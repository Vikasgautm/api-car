import { ImportLog } from '../../../models/import-log.model';

export interface UnmatchedKeyFrequency {
  key: string;
  count: number;
  sources: { source: string; count: number }[];
  sample_values: string[];
}

export interface UnmatchedKeysAnalyticsResult {
  total_imports: number;
  imports_with_unmatched: number;
  total_unique_unmatched_keys: number;
  frequency_by_key: UnmatchedKeyFrequency[];
}

export class UnmatchedKeysAnalyticsService {
  static async getUnmatchedKeyFrequency(limit: number = 50): Promise<UnmatchedKeysAnalyticsResult> {
    const allLogs = await ImportLog.find({
      'unmatched_data.unmatched': { $exists: true, $ne: [] },
    });

    const frequencyMap = new Map<string, { count: number; sources: Map<string, number>; sample_values: Set<string> }>();
    let importsWithUnmatched = 0;

    for (const log of allLogs) {
      if (log.unmatched_data?.unmatched?.length > 0) {
        importsWithUnmatched++;
        const unmatched = log.unmatched_data.unmatched as any[];

        for (const item of unmatched) {
          const key = this.normalizeKey(item.source_label || item.extracted || '');
          if (!key) continue;

          if (!frequencyMap.has(key)) {
            frequencyMap.set(key, {
              count: 0,
              sources: new Map<string, number>(),
              sample_values: new Set<string>(),
            });
          }

          const entry = frequencyMap.get(key)!;
          entry.count++;
          entry.sources.set(log.source || 'unknown', (entry.sources.get(log.source || 'unknown') || 0) + 1);
          if (entry.sample_values.size < 5) {
            entry.sample_values.add(item.source_value || item.value || '');
          }
        }
      }
    }

    const frequencyByKey = Array.from(frequencyMap.entries())
      .map(([key, data]) => ({
        key,
        count: data.count,
        sources: Array.from(data.sources.entries()).map(([source, count]) => ({ source, count })),
        sample_values: Array.from(data.sample_values),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    return {
      total_imports: await ImportLog.countDocuments({}),
      imports_with_unmatched: importsWithUnmatched,
      total_unique_unmatched_keys: frequencyMap.size,
      frequency_by_key: frequencyByKey,
    };
  }

  static async getFrequencyBySource(source: string, limit: number = 50): Promise<UnmatchedKeyFrequency[]> {
    const logs = await ImportLog.find({
      source: source as any,
      'unmatched_data.unmatched': { $exists: true, $ne: [] },
    });

    const frequencyMap = new Map<string, { count: number; sample_values: Set<string> }>();

    for (const log of logs) {
      if (log.unmatched_data?.unmatched?.length > 0) {
        const unmatched = log.unmatched_data.unmatched as any[];

        for (const item of unmatched) {
          const key = this.normalizeKey(item.source_label || item.extracted || '');
          if (!key) continue;

          if (!frequencyMap.has(key)) {
            frequencyMap.set(key, { count: 0, sample_values: new Set<string>() });
          }

          const entry = frequencyMap.get(key)!;
          entry.count++;
          if (entry.sample_values.size < 5) {
            entry.sample_values.add(item.source_value || item.value || '');
          }
        }
      }
    }

    return Array.from(frequencyMap.entries())
      .map(([key, data]) => ({
        key,
        count: data.count,
        sources: [{ source, count: data.count }],
        sample_values: Array.from(data.sample_values),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  static async getFrequencyByImportType(
    importType: 'car' | 'variant',
    limit: number = 50
  ): Promise<UnmatchedKeyFrequency[]> {
    const logs = await ImportLog.find({
      import_type: importType,
      'unmatched_data.unmatched': { $exists: true, $ne: [] },
    });

    const frequencyMap = new Map<string, { count: number; sample_values: Set<string> }>();

    for (const log of logs) {
      if (log.unmatched_data?.unmatched?.length > 0) {
        const unmatched = log.unmatched_data.unmatched as any[];

        for (const item of unmatched) {
          const key = this.normalizeKey(item.source_label || item.extracted || '');
          if (!key) continue;

          if (!frequencyMap.has(key)) {
            frequencyMap.set(key, { count: 0, sample_values: new Set<string>() });
          }

          const entry = frequencyMap.get(key)!;
          entry.count++;
          if (entry.sample_values.size < 5) {
            entry.sample_values.add(item.source_value || item.value || '');
          }
        }
      }
    }

    return Array.from(frequencyMap.entries())
      .map(([key, data]) => ({
        key,
        count: data.count,
        sources: [{ source: importType, count: data.count }],
        sample_values: Array.from(data.sample_values),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  private static normalizeKey(key: string): string {
    if (!key) return '';
    return key.toLowerCase().trim().replace(/\s+/g, '_');
  }
}
