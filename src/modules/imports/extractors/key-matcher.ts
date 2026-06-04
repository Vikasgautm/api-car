import * as fs from 'fs';
import * as path from 'path';
import { SpecsNormalized } from '../../../models/car-variant.model';
import { IVariantSpecKey, VariantSpecKey } from '../../../models/variant-spec-key.model';
import { deriveFeatureFlags, getSpecMapping, guessCategory, isInvalidLabel, normalizeLabel, parseSpecValue } from '../../../modules/variants/utils/spec-key-map';
import { ExtractedSpec, MatchedSpec, MatchType, UnmatchedSpec } from '../types/import.types';

export class KeyMatcher {
  private static specKeyCache: IVariantSpecKey[] | null = null;
  private static cacheExpiry: number = 0;
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private static slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  private static calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  private static async loadSpecKeys(): Promise<IVariantSpecKey[]> {
    const now = Date.now();
    
    if (this.specKeyCache && now < this.cacheExpiry) {
      return this.specKeyCache;
    }

    const keys = await VariantSpecKey.find({ 
      is_deleted: false,
      is_published: true 
    }).lean();

    this.specKeyCache = keys;
    this.cacheExpiry = now + this.CACHE_DURATION;
    
    return keys;
  }

  static async matchSpecs(extractedSpecs: ExtractedSpec[]): Promise<{
    matched: MatchedSpec[];
    unmatched: UnmatchedSpec[];
  }> {
    const specKeys = await this.loadSpecKeys();
    const matched: MatchedSpec[] = [];
    const unmatched: UnmatchedSpec[] = [];
    const seenDedupKeys = new Set<string>();
    let duplicateSkippedCount = 0;
    let invalidSkippedCount = 0;

    // Track per-spec debug info
    const debugEntries: Array<{
      original_label: string;
      normalized_label: string;
      matched_path?: string;
      match_type: string;
      confidence: number;
      final_value: any;
    }> = [];

    for (const spec of extractedSpecs) {
      // Skip invalid labels
      if (isInvalidLabel(spec.label)) {
        invalidSkippedCount++;
        continue;
      }

      const normalizedLabel = normalizeLabel(spec.label);
      const normalizedSlug = this.slugify(spec.label);

      // Dedup by normalized label + value + section (keep first occurrence)
      const dedupKey = `${normalizedLabel}|||${spec.value}|||${spec.section}`;
      if (seenDedupKeys.has(dedupKey)) {
        duplicateSkippedCount++;
        continue;
      }
      seenDedupKeys.add(dedupKey);

      // First, check canonical mapping (SPEC_LABEL_MAP)
      const canonicalMapping = getSpecMapping(spec.label);

      if (canonicalMapping) {
        const parsedValue = parseSpecValue(spec.value, canonicalMapping.type);
        const path = canonicalMapping.path || canonicalMapping.rootKey || '';

        debugEntries.push({
          original_label: spec.label,
          normalized_label: normalizedLabel,
          matched_path: path,
          match_type: 'canonical',
          confidence: 1.0,
          final_value: parsedValue,
        });

        matched.push({
          source_label: spec.label,
          source_value: parsedValue,
          matched_key_id: canonicalMapping.key,
          matched_key_name: canonicalMapping.key,
          matched_key_slug: canonicalMapping.key,
          category: canonicalMapping.category,
          section: spec.section,
          matchType: 'exact',
          confidence: 1.0,
          suggested_path: path,
        });
        continue;
      }

      // Fallback to database matching
      let bestMatch: IVariantSpecKey | null = null;
      let bestMatchType: MatchType = 'unmatched';
      let bestConfidence = 0;

      for (const key of specKeys) {
        // Exact match on name
        if (normalizedLabel === normalizeLabel(key.name)) {
          bestMatch = key;
          bestMatchType = 'exact';
          bestConfidence = 1.0;
          break;
        }

        // Exact match on slug
        if (normalizedSlug === key.slug) {
          bestMatch = key;
          bestMatchType = 'exact';
          bestConfidence = 1.0;
          break;
        }

        // Alias match
        const normalizedAliases = key.aliases.map(a => normalizeLabel(a));
        if (normalizedAliases.includes(normalizedLabel)) {
          bestMatch = key;
          bestMatchType = 'alias';
          bestConfidence = 0.95;
          break;
        }

        // Fuzzy match on name
        const similarity = this.calculateSimilarity(normalizedLabel, normalizeLabel(key.name));
        if (similarity > bestConfidence && similarity >= 0.75) {
          bestMatch = key;
          bestMatchType = similarity >= 0.9 ? 'normalized' : 'fuzzy';
          bestConfidence = similarity;
        }
      }

      if (bestMatch && bestConfidence >= 0.75) {
        const suggestedPath = this.mapToSpecPath(bestMatch.category, bestMatch.name);
        const matchLabel = bestMatchType === 'exact' ? 'DB-EXACT' : bestMatchType === 'alias' ? 'DB-ALIAS' : 'FUZZY';
        
        // Parse value based on data_type from database spec key
        const parsedValue = this.parseValueByDataType(spec.value, bestMatch.data_type);

        debugEntries.push({
          original_label: spec.label,
          normalized_label: normalizedLabel,
          matched_path: suggestedPath,
          match_type: `db-${bestMatchType}`,
          confidence: bestConfidence,
          final_value: parsedValue,
        });

        matched.push({
          source_label: spec.label,
          source_value: parsedValue,
          matched_key_id: bestMatch.key_id,
          matched_key_name: bestMatch.name,
          matched_key_slug: bestMatch.slug,
          category: bestMatch.category,
          section: spec.section,
          matchType: bestMatchType,
          confidence: bestConfidence,
          suggested_path: suggestedPath,
        });
      } else {
        const guessedCategory = guessCategory(spec.label, spec.section);

        debugEntries.push({
          original_label: spec.label,
          normalized_label: normalizedLabel,
          matched_path: undefined,
          match_type: 'unmatched',
          confidence: 0,
          final_value: spec.value,
        });

        unmatched.push({
          section: spec.section,
          source_label: spec.label,
          source_value: spec.value,
          suggested_slug: normalizedSlug,
          suggested_category: guessedCategory,
        });
      }
    }

    // Count unique labels (before dedup)
    const uniqueLabels = new Set(extractedSpecs.filter(s => !isInvalidLabel(s.label)).map(s => normalizeLabel(s.label)));

    // Count raw (specs_raw path) matched specs
    const rawCount = matched.filter(m => m.suggested_path?.startsWith('specs_raw.')).length;
    const normalizedCount = matched.filter(m => m.suggested_path?.startsWith('specs_normalized.')).length;
    const rootCount = matched.filter(m => m.suggested_path && !m.suggested_path.startsWith('specs_raw.') && !m.suggested_path.startsWith('specs_normalized.')).length;

    // Summary
    const summary = {
      total_extracted_specs: extractedSpecs.length,
      unique_labels: uniqueLabels.size,
      invalid_skipped: invalidSkippedCount,
      duplicate_skipped: duplicateSkippedCount,
      matched_count: matched.length,
      matched_normalized: normalizedCount,
      matched_raw: rawCount,
      matched_root: rootCount,
      unmatched_count: unmatched.length,
      match_types: {
        canonical: matched.filter(m => m.matchType === 'exact' && m.suggested_path && !m.suggested_path.startsWith('specs_raw.')).length,
        'db-exact': matched.filter(m => m.matchType === 'exact' && m.matched_key_id !== m.matched_key_name).length,
        'db-alias': matched.filter(m => m.matchType === 'alias').length,
        fuzzy: matched.filter(m => m.matchType === 'normalized' || m.matchType === 'fuzzy').length,
      },
      unmatched_labels: unmatched.map(u => u.source_label),
    };

    // Write matching results to file
    const logDir = path.resolve(process.cwd(), 'logs', 'imports');
    fs.mkdirSync(logDir, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const logFile = path.join(logDir, `key-match-${timestamp}.json`);
    fs.writeFileSync(logFile, JSON.stringify({ summary, debug_entries: debugEntries }, null, 2), 'utf-8');

    return { matched, unmatched };
  }

  private static mapToSpecPath(category: string, keyName: string): string {
    // Map category to the nested path in specs_normalized
    const categoryMap: Record<string, string> = {
      'engine_performance': 'specs_normalized.engine_performance',
      'mileage_range': 'specs_normalized.mileage_range',
      'battery_charging': 'specs_normalized.battery_charging',
      'dimensions_practicality': 'specs_normalized.dimensions_practicality',
      'suspension_steering_brakes': 'specs_normalized.suspension_steering_brakes',
      'tyres_wheels': 'specs_normalized.tyres_wheels',
      'safety': 'specs_normalized.safety',
      'adas': 'specs_normalized.adas',
      'comfort_convenience': 'specs_normalized.comfort_convenience',
      'infotainment_connectivity': 'specs_normalized.infotainment_connectivity',
      'connected_car': 'specs_normalized.connected_car',
      'interior': 'specs_normalized.interior',
      'exterior': 'specs_normalized.exterior',
      'warranty': 'specs_normalized.warranty',
    };

    const basePath = categoryMap[category] || 'specs_normalized';
    const camelCaseKey = this.toCamelCase(keyName);
    return `${basePath}.${camelCaseKey}`;
  }

  private static toCamelCase(str: string): string {
    return str
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+(.)/g, (_, c) => c.toUpperCase())
      .replace(/^\s/, '');
  }

  private static parseValueByDataType(value: string, dataType: string): any {
    if (!value) return null;

    const trimmed = value.trim();

    switch (dataType) {
      case 'boolean': {
        // Mirror parseSpecValue's permissive boolean rules so DB-fallback matches
        // behave identically to canonical SPEC_LABEL_MAP matches.
        return parseSpecValue(trimmed, 'boolean');
      }
      
      case 'number': {
        const numMatch = trimmed.match(/[\d.]+/);
        if (numMatch) {
          const num = parseFloat(numMatch[0]);
          return isNaN(num) ? null : num;
        }
        return null;
      }
      
      case 'list': {
        return trimmed
          .split('|')
          .map(s => s.trim())
          .filter(s => s.length > 0);
      }
      
      case 'date': {
        const date = new Date(trimmed);
        return isNaN(date.getTime()) ? null : date;
      }
      
      case 'string':
      default:
        return trimmed;
    }
  }

  static mapMatchedSpecsToSpecsNormalized(matchedSpecs: MatchedSpec[]): {
    specs_normalized: Partial<SpecsNormalized>;
    specs_raw: Record<string, any>;
  } {
    const specsNormalized: Partial<SpecsNormalized> = {};
    const specsRaw: Record<string, any> = {};
    const additionalFeatures: string[] = [];

    for (const matched of matchedSpecs) {
      if (!matched.suggested_path) continue;

      const pathParts = matched.suggested_path.split('.');

      // Special handling for additional_features - accumulate as array
      if (pathParts[pathParts.length - 1] === 'additional_features') {
        additionalFeatures.push(matched.source_value);
        continue;
      }

      // Route to specs_raw or specs_normalized based on path prefix
      if (pathParts[0] === 'specs_raw') {
        let current: any = specsRaw;
        for (let i = 1; i < pathParts.length - 1; i++) {
          const part = pathParts[i];
          if (!current[part]) {
            current[part] = {};
          }
          current = current[part];
        }
        const finalKey = pathParts[pathParts.length - 1];
        current[finalKey] = matched.source_value;
      } else if (pathParts[0] === 'specs_normalized') {
        let current: any = specsNormalized;
        for (let i = 1; i < pathParts.length - 1; i++) {
          const part = pathParts[i];
          if (!current[part]) {
            current[part] = {};
          }
          current = current[part];
        }
        const finalKey = pathParts[pathParts.length - 1];
        current[finalKey] = matched.source_value;
      } else {
        // Root-level field (e.g., transmission_type, drivetrain)
        (specsNormalized as any)[pathParts[0]] = matched.source_value;
      }
    }

    // Set accumulated additional_features
    if (additionalFeatures.length > 0) {
      specsRaw.additional_features = additionalFeatures;

      // Derive android_auto / apple_carplay from additional features text
      const allFeaturesText = additionalFeatures.join(' ').toLowerCase();
      if (allFeaturesText.includes('android auto') || allFeaturesText.includes('androidauto')) {
        if (!specsNormalized.infotainment_connectivity) specsNormalized.infotainment_connectivity = {};
        specsNormalized.infotainment_connectivity.android_auto = true;
      }
      if (allFeaturesText.includes('apple carplay') || allFeaturesText.includes('applecarplay')) {
        if (!specsNormalized.infotainment_connectivity) specsNormalized.infotainment_connectivity = {};
        specsNormalized.infotainment_connectivity.apple_carplay = true;
      }
    }

    // Layer 3 — Feature Intelligence. Derived flags power SEO categories,
    // buyer filters, "cars with X" landing pages, and comparison tables.
    // Stored under specs_raw.derived so the variant schema stays untouched.
    const rootFuelType = matchedSpecs.find(m => m.suggested_path === 'fuel_type')?.source_value;
    const rootTransmission = matchedSpecs.find(m => m.suggested_path === 'transmission_type')?.source_value;
    const derived = deriveFeatureFlags(specsNormalized, specsRaw, {
      fuel_type: typeof rootFuelType === 'string' ? rootFuelType : undefined,
      transmission_type: typeof rootTransmission === 'string' ? rootTransmission : undefined,
    });
    if (Object.keys(derived).length > 0) {
      specsRaw.derived = derived;
    }

    return { specs_normalized: specsNormalized, specs_raw: specsRaw };
  }

  static clearCache(): void {
    this.specKeyCache = null;
    this.cacheExpiry = 0;
  }
}
