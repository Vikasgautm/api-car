import { v4 as uuidv4 } from 'uuid';
import { IMasterOption, MASTER_CATEGORIES, MASTER_SEED_DATA, MasterCategory, MasterOption } from '../models/master-option.model';
import { AppError } from '../../../shared/utils/app-error.util';

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
  static async getAllActiveOptions(): Promise<Record<string, IMasterOption[]>> {
    const all = await MasterOption.find({ is_active: true }).sort({ category_key: 1, sort_order: 1 }).lean();
    const map: Record<string, IMasterOption[]> = {};
    for (const opt of all) {
      if (!map[opt.category_key]) map[opt.category_key] = [];
      map[opt.category_key].push(opt);
    }
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
    return opt.save();
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

    return opt.save();
  }

  static async deleteOption(optionId: string): Promise<void> {
    const opt = await MasterOption.findOne({ option_id: optionId });
    if (!opt) throw new AppError('Option not found', 404);
    if (opt.is_system) throw new AppError('System options cannot be deleted. Deactivate instead.', 400);
    await opt.deleteOne();
  }

  static async toggleActive(optionId: string): Promise<IMasterOption> {
    const opt = await MasterOption.findOne({ option_id: optionId });
    if (!opt) throw new AppError('Option not found', 404);
    opt.is_active = !opt.is_active;
    return opt.save();
  }

  static async reorderOptions(categoryKey: string, orderedIds: string[]): Promise<void> {
    const updates = orderedIds.map((id, index) =>
      MasterOption.updateOne({ option_id: id, category_key: categoryKey }, { $set: { sort_order: index } })
    );
    await Promise.all(updates);
  }

  // ── Seed ─────────────────────────────────────────────────────────────────────

  static async seedDefaults(): Promise<{ created: number; skipped: number }> {
    let created = 0;
    let skipped = 0;

    for (const [categoryKey, items] of Object.entries(MASTER_SEED_DATA)) {
      for (let i = 0; i < items.length; i++) {
        const { label, value } = items[i];
        const exists = await MasterOption.exists({ category_key: categoryKey, value });
        if (exists) { skipped++; continue; }

        await MasterOption.create({
          option_id: uuidv4(),
          category_key: categoryKey,
          label,
          value,
          sort_order: i,
          is_active: true,
          is_system: true,
        });
        created++;
      }
    }

    return { created, skipped };
  }

  // ── Toggle/Dropdown import mapping ────────────────────────────────────────────

  /**
   * Normalise a raw imported toggle/boolean value to true/false/null.
   * Handles: Yes, No, Available, Not Available, Standard, Included, Optional, NA, etc.
   */
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

  /**
   * Normalise a raw imported multi-select value to string[].
   * Handles comma-separated strings and arrays.
   */
  static normalizeMultiSelectImport(raw: any): string[] {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw.map((s: any) => String(s).trim()).filter(Boolean);
    return String(raw)
      .split(/[,;/|]+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  /**
   * Find the closest matching option value for a category, or return 'other'.
   */
  static async resolveDropdownImport(categoryKey: string, raw: any): Promise<string> {
    if (!raw) return '';
    const str = String(raw).trim().toLowerCase().replace(/[\s-]+/g, '_');
    const options = await this.getOptions(categoryKey, true);
    const exact = options.find((o) => o.value === str || o.label.toLowerCase() === String(raw).trim().toLowerCase());
    if (exact) return exact.value;
    const partial = options.find((o) => o.label.toLowerCase().includes(String(raw).trim().toLowerCase()));
    if (partial) return partial.value;
    return 'other';
  }

  // ── Private helpers ───────────────────────────────────────────────────────────

  private static assertValidCategory(categoryKey: string): void {
    const valid = MASTER_CATEGORIES.some((c) => c.key === categoryKey);
    if (!valid) throw new AppError(`Unknown master data category: "${categoryKey}"`, 400);
  }
}
