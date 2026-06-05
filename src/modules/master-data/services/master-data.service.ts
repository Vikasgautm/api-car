import { v4 as uuidv4 } from 'uuid';
import { IMasterOption, MASTER_CATEGORIES, MASTER_SEED_DATA, MasterCategory, MasterOption } from '../models/master-option.model';
import { IUnknownValue, UnknownValue } from '../models/unknown-value.model';
import { AppError } from '../../../shared/utils/app-error.util';
import { cache } from '../../../utils/cache.util';

const CACHE_KEY = 'master_data:all_active';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export class MasterDataService {
  // ── Query ────────────────────────────────────────────────────────────────────

  static async getCategories(): Promise<MasterCategory[]> {
    return MASTER_CATEGORIES;
  }

  static async getOptions(categoryKey: string, includeInactive = false): Promise<IMasterOption[]> {
    const filter: Record<string, any> = { category_key: categoryKey };
    if (!includeInactive) filter.is_active = true;
    return MasterOption.find(filter).sort({ sort_order: 1, label: 1 }).lean();
  }

  static async getOptionByValue(categoryKey: string, value: string): Promise<IMasterOption | null> {
    return MasterOption.findOne({ category_key: categoryKey, value }).lean();
  }

  // Returns all active options for every category in one round-trip.
  // Result is cached for 5 minutes; invalidated by any mutation.
  static async getAllActiveOptions(): Promise<Record<string, IMasterOption[]>> {
    const cached = cache.get<Record<string, IMasterOption[]>>(CACHE_KEY);
    if (cached) return cached;

    const all = await MasterOption.find({ is_active: true }).sort({ category_key: 1, sort_order: 1 }).lean();
    const map: Record<string, IMasterOption[]> = {};
    for (const opt of all) {
      if (!map[opt.category_key]) map[opt.category_key] = [];
      map[opt.category_key].push(opt);
    }

    cache.set(CACHE_KEY, map, CACHE_TTL_MS);
    return map;
  }

  // ── Mutations ─────────────────────────────────────────────────────────────────

  static async createOption(
    categoryKey: string,
    data: { label: string; value: string; sort_order?: number; metadata?: Record<string, any> },
  ): Promise<IMasterOption> {
    this.assertValidCategory(categoryKey);

    const existing = await MasterOption.findOne({ category_key: categoryKey, value: data.value });
    if (existing) throw new AppError(`Option with value "${data.value}" already exists in category "${categoryKey}"`, 409);

    const maxOrder = await MasterOption.findOne({ category_key: categoryKey }).sort({ sort_order: -1 }).lean();
    const nextOrder = data.sort_order ?? ((maxOrder?.sort_order ?? -1) + 1);

    const opt = new MasterOption({
      option_id: uuidv4(),
      category_key: categoryKey,
      label: data.label.trim(),
      value: data.value.trim().toLowerCase().replace(/\s+/g, '_'),
      sort_order: nextOrder,
      is_active: true,
      is_system: false,
      metadata: data.metadata ?? {},
    });
    const saved = await opt.save();
    cache.delete(CACHE_KEY);
    return saved;
  }

  static async updateOption(
    optionId: string,
    data: { label?: string; value?: string; sort_order?: number; is_active?: boolean; metadata?: Record<string, any> },
  ): Promise<IMasterOption> {
    const opt = await MasterOption.findOne({ option_id: optionId });
    if (!opt) throw new AppError('Option not found', 404);

    if (data.label !== undefined) opt.label = data.label.trim();
    if (data.value !== undefined) opt.value = data.value.trim().toLowerCase().replace(/\s+/g, '_');
    if (data.sort_order !== undefined) opt.sort_order = data.sort_order;
    if (data.is_active !== undefined) opt.is_active = data.is_active;
    if (data.metadata !== undefined) opt.metadata = data.metadata;

    const saved = await opt.save();
    cache.delete(CACHE_KEY);
    return saved;
  }

  static async deleteOption(optionId: string): Promise<void> {
    const opt = await MasterOption.findOne({ option_id: optionId });
    if (!opt) throw new AppError('Option not found', 404);
    if (opt.is_system) throw new AppError('System options cannot be deleted. Deactivate instead.', 400);
    await opt.deleteOne();
    cache.delete(CACHE_KEY);
  }

  static async toggleActive(optionId: string): Promise<IMasterOption> {
    const opt = await MasterOption.findOne({ option_id: optionId });
    if (!opt) throw new AppError('Option not found', 404);
    opt.is_active = !opt.is_active;
    const saved = await opt.save();
    cache.delete(CACHE_KEY);
    return saved;
  }

  static async reorderOptions(categoryKey: string, orderedIds: string[]): Promise<void> {
    const updates = orderedIds.map((id, index) =>
      MasterOption.updateOne({ option_id: id, category_key: categoryKey }, { $set: { sort_order: index } })
    );
    await Promise.all(updates);
    cache.delete(CACHE_KEY);
  }

  // ── Seed ─────────────────────────────────────────────────────────────────────

  // One bulkWrite with upsert — 132 items in a single round-trip.
  // The unique (category_key, value) index causes duplicates to be silently skipped.
  static async seedDefaults(): Promise<{ created: number; skipped: number }> {
    const ops: Parameters<typeof MasterOption.bulkWrite>[0] = [];
    let total = 0;

    for (const [categoryKey, items] of Object.entries(MASTER_SEED_DATA)) {
      items.forEach(({ label, value }, i) => {
        total++;
        ops.push({
          updateOne: {
            filter: { category_key: categoryKey, value },
            update: {
              $setOnInsert: {
                option_id: uuidv4(),
                category_key: categoryKey,
                label,
                value,
                sort_order: i,
                is_active: true,
                is_system: true,
                metadata: {},
              },
            },
            upsert: true,
          },
        });
      });
    }

    if (ops.length === 0) return { created: 0, skipped: 0 };

    const result = await MasterOption.bulkWrite(ops, { ordered: false });
    cache.delete(CACHE_KEY);

    const created = result.upsertedCount ?? 0;
    return { created, skipped: total - created };
  }

  // ── Toggle/Dropdown import mapping ────────────────────────────────────────────

  static normalizeBooleanImport(raw: any): boolean | null {
    if (raw === null || raw === undefined || raw === '') return null;
    if (typeof raw === 'boolean') return raw;
    const str = String(raw).trim().toLowerCase();
    const TRUE_SET = new Set(['yes', 'available', 'standard', 'included', 'true', '1', 'yes (standard)', 'std', 'yes (optional)']);
    const FALSE_SET = new Set(['no', 'not available', 'optional', 'na', 'n/a', 'false', '0', 'not fitted', 'none', '-', '--']);
    if (TRUE_SET.has(str)) return true;
    if (FALSE_SET.has(str)) return false;
    return null;
  }

  static normalizeMultiSelectImport(raw: any): string[] {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw.map((s: any) => String(s).trim()).filter(Boolean);
    return String(raw).split(/[,;/|]+/).map((s) => s.trim()).filter(Boolean);
  }

  // Resolves a raw imported value to the closest master option value.
  // Uses the shared 5-minute cache — a bulk import of N variants makes 1 DB round-trip
  // instead of N×categories queries.
  static async resolveDropdownImport(categoryKey: string, raw: any): Promise<string> {
    if (!raw) return '';

    const allOptions = await this.getAllActiveOptions();
    const options = allOptions[categoryKey] ?? [];
    const rawStr = String(raw).trim();
    const normalized = rawStr.toLowerCase().replace(/[\s-]+/g, '_');

    const exact = options.find(
      (o) => o.value === normalized || o.label.toLowerCase() === rawStr.toLowerCase(),
    );
    if (exact) return exact.value;

    const partial = options.find((o) =>
      o.label.toLowerCase().includes(rawStr.toLowerCase()),
    );
    return partial ? partial.value : 'other';
  }

  // ── Unknown Value Queue ───────────────────────────────────────────────────────

  static async logUnknownValue(categoryKey: string, rawValue: string, context?: string): Promise<void> {
    try {
      await UnknownValue.findOneAndUpdate(
        { category_key: categoryKey, raw_value: rawValue },
        {
          $inc: { occurrence_count: 1 },
          $setOnInsert: {
            unknown_id: uuidv4(),
            category_key: categoryKey,
            raw_value: rawValue,
            context: context ?? '',
            is_resolved: false,
          },
        },
        { upsert: true, new: true },
      );
    } catch {
      // Non-fatal — never break imports due to logging failures
    }
  }

  static async getUnknownValues(resolvedFilter?: boolean): Promise<IUnknownValue[]> {
    const filter: Record<string, any> = {};
    if (resolvedFilter !== undefined) filter.is_resolved = resolvedFilter;
    return UnknownValue.find(filter).sort({ occurrence_count: -1, created_at: -1 }).lean();
  }

  static async resolveUnknownValue(unknownId: string, targetOptionValue: string): Promise<IUnknownValue> {
    const record = await UnknownValue.findOne({ unknown_id: unknownId });
    if (!record) throw new AppError('Unknown value record not found', 404);
    record.is_resolved = true;
    record.resolved_to = targetOptionValue;
    record.resolved_at = new Date();
    return record.save();
  }

  static async dismissUnknownValue(unknownId: string): Promise<void> {
    const record = await UnknownValue.findOne({ unknown_id: unknownId });
    if (!record) throw new AppError('Unknown value record not found', 404);
    record.is_resolved = true;
    record.resolved_to = 'dismissed';
    record.resolved_at = new Date();
    await record.save();
  }

  static async promoteUnknownToMaster(unknownId: string): Promise<IMasterOption> {
    const record = await UnknownValue.findOne({ unknown_id: unknownId });
    if (!record) throw new AppError('Unknown value record not found', 404);

    const label = record.raw_value;
    const value = label.trim().toLowerCase().replace(/[\s-]+/g, '_').replace(/[^a-z0-9_]/g, '');
    const created = await this.createOption(record.category_key, { label, value });

    record.is_resolved = true;
    record.resolved_to = created.value;
    record.resolved_at = new Date();
    await record.save();

    return created;
  }

  // Public label map: { category_key: { value: label, … }, … }
  static async getPublicLabelMap(): Promise<Record<string, Record<string, string>>> {
    const allOptions = await this.getAllActiveOptions();
    const labelMap: Record<string, Record<string, string>> = {};
    for (const [categoryKey, options] of Object.entries(allOptions)) {
      labelMap[categoryKey] = {};
      for (const opt of options) {
        labelMap[categoryKey][opt.value] = opt.label;
      }
    }
    return labelMap;
  }

  // ── Private helpers ───────────────────────────────────────────────────────────

  private static assertValidCategory(categoryKey: string): void {
    const valid = MASTER_CATEGORIES.some((c) => c.key === categoryKey);
    if (!valid) throw new AppError(`Unknown master data category: "${categoryKey}"`, 400);
  }
}
