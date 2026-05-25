import { IVariantImportStaging, VariantImportStaging } from '../models/VariantImportStaging';
import { Types } from 'mongoose';

export interface GroupedVariants {
  normalized_name: string;
  source_names: string[];
  variants: IVariantImportStaging[];
  suggested_car_id?: string;
  suggested_car_name?: string;
}

export class VariantGroupingService {
  static normalizeName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\b(new|all|updated|refreshed|facelift|2024|2025|2026)\b/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  static slugify(name: string): string {
    return this.normalizeName(name).replace(/\s+/g, '-');
  }

  static similarity(a: string, b: string): number {
    const na = this.normalizeName(a);
    const nb = this.normalizeName(b);
    if (na === nb) return 1;
    const wordsA = new Set(na.split(' ').filter(Boolean));
    const wordsB = new Set(nb.split(' ').filter(Boolean));
    const intersection = [...wordsA].filter(w => wordsB.has(w)).length;
    const union = new Set([...wordsA, ...wordsB]).size;
    return union === 0 ? 0 : intersection / union;
  }

  static groupVariants(variants: IVariantImportStaging[]): GroupedVariants[] {
    const groups: GroupedVariants[] = [];

    for (const variant of variants) {
      const name = variant.source_car_name;
      const normalizedName = this.normalizeName(name);

      let matched = false;
      for (const group of groups) {
        if (this.similarity(group.normalized_name, normalizedName) >= 0.6) {
          group.variants.push(variant);
          if (!group.source_names.includes(name)) {
            group.source_names.push(name);
          }
          matched = true;
          break;
        }
      }

      if (!matched) {
        groups.push({
          normalized_name: normalizedName,
          source_names: [name],
          variants: [variant],
          suggested_car_id: variant.suggested_car_id,
          suggested_car_name: variant.suggested_car_name,
        });
      }
    }

    return groups;
  }

  static async applyGrouping(sessionId: string): Promise<{ grouped: number; groups: number }> {
    const variants = await VariantImportStaging.find({
      import_session_id: new Types.ObjectId(sessionId),
      import_status: { $in: ['imported', 'draft'] },
    });

    const groups = this.groupVariants(variants);
    let grouped = 0;

    for (const group of groups) {
      const ids = group.variants.map(v => v._id);
      const normalized = group.normalized_name;

      await VariantImportStaging.updateMany(
        { _id: { $in: ids } },
        {
          $set: {
            normalized_car_name: normalized,
            import_status: 'grouped',
          },
        }
      );
      grouped += ids.length;
    }

    return { grouped, groups: groups.length };
  }
}
