import { SpecsNormalized } from '../../../models/car-variant.model';
import { IVariantSpecKey, VariantSpecKey } from '../../../models/variant-spec-key.model';
import { getSpecMapping, isInvalidLabel, normalizeLabel, parseSpecValue } from '../../../modules/variants/utils/spec-key-map';
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
    const seenLabels = new Set<string>();

    for (const spec of extractedSpecs) {
      // Skip invalid labels
      if (isInvalidLabel(spec.label)) {
        continue;
      }

      // Skip duplicate labels
      const normalizedLabel = normalizeLabel(spec.label);
      if (seenLabels.has(normalizedLabel)) {
        continue;
      }
      seenLabels.add(normalizedLabel);

      const normalizedSlug = this.slugify(spec.label);
      
      // First, check canonical mapping
      const canonicalMapping = getSpecMapping(spec.label);
      
      if (canonicalMapping) {
        // Use canonical mapping - highest priority
        const parsedValue = parseSpecValue(spec.value, canonicalMapping.type);
        
        matched.push({
          source_label: spec.label,
          source_value: spec.value,
          matched_key_id: canonicalMapping.key,
          matched_key_name: canonicalMapping.key,
          matched_key_slug: canonicalMapping.key,
          category: canonicalMapping.category,
          section: spec.section,
          matchType: 'exact',
          confidence: 1.0,
          suggested_path: canonicalMapping.path || canonicalMapping.rootKey,
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
        matched.push({
          source_label: spec.label,
          source_value: spec.value,
          matched_key_id: bestMatch.key_id,
          matched_key_name: bestMatch.name,
          matched_key_slug: bestMatch.slug,
          category: bestMatch.category,
          section: spec.section,
          matchType: bestMatchType,
          confidence: bestConfidence,
          suggested_path: this.mapToSpecPath(bestMatch.category, bestMatch.name),
        });
      } else {
        unmatched.push({
          section: spec.section,
          source_label: spec.label,
          source_value: spec.value,
          suggested_slug: normalizedSlug,
          suggested_category: this.guessCategory(spec.label, spec.section),
        });
      }
    }

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

  private static guessCategory(label: string, section: string): string {
    const lowerLabel = label.toLowerCase();
    const lowerSection = section.toLowerCase();

    // Engine & Transmission
    if (lowerLabel.includes('engine') || lowerLabel.includes('motor') || 
        lowerLabel.includes('power') || lowerLabel.includes('torque') ||
        lowerLabel.includes('displacement') || lowerLabel.includes('cylinder')) {
      return 'engine_performance';
    }

    // Battery & Charging
    if (lowerLabel.includes('battery') || lowerLabel.includes('charging') || 
        lowerLabel.includes('range') || lowerLabel.includes('kwh')) {
      return 'battery_charging';
    }

    // Dimensions
    if (lowerLabel.includes('length') || lowerLabel.includes('width') || 
        lowerLabel.includes('height') || lowerLabel.includes('wheelbase') ||
        lowerLabel.includes('boot') || lowerLabel.includes('ground clearance')) {
      return 'dimensions_practicality';
    }

    // Safety
    if (lowerLabel.includes('airbag') || lowerLabel.includes('abs') || 
        lowerLabel.includes('brake') || lowerLabel.includes('safety') ||
        lowerLabel.includes('ncap')) {
      return 'safety';
    }

    // Suspension & Steering
    if (lowerLabel.includes('suspension') || lowerLabel.includes('steering')) {
      return 'suspension_steering_brakes';
    }

    // Tyres
    if (lowerLabel.includes('tyre') || lowerLabel.includes('wheel') || lowerLabel.includes('rim')) {
      return 'tyres_wheels';
    }

    // Mileage
    if (lowerLabel.includes('mileage') || lowerLabel.includes('fuel tank')) {
      return 'mileage_range';
    }

    // ADAS
    if (lowerLabel.includes('adaptive') || lowerLabel.includes('lane') || 
        lowerLabel.includes('collision') || lowerLabel.includes('cruise')) {
      return 'adas';
    }

    // Infotainment
    if (lowerLabel.includes('screen') || lowerLabel.includes('display') || 
        lowerLabel.includes('bluetooth') || lowerLabel.includes('speaker') ||
        lowerLabel.includes('android') || lowerLabel.includes('apple')) {
      return 'infotainment_connectivity';
    }

    // Comfort
    if (lowerLabel.includes('ac') || lowerLabel.includes('seat') || 
        lowerLabel.includes('climate') || lowerLabel.includes('sunroof')) {
      return 'comfort_convenience';
    }

    // Interior
    if (lowerLabel.includes('dashboard') || lowerLabel.includes('interior') || 
        lowerLabel.includes('upholstery')) {
      return 'interior';
    }

    // Exterior
    if (lowerLabel.includes('headlight') || lowerLabel.includes('tail light') || 
        lowerLabel.includes('fog') || lowerLabel.includes('mirror')) {
      return 'exterior';
    }

    // Warranty
    if (lowerLabel.includes('warranty')) {
      return 'warranty';
    }

    // Default based on section
    if (lowerSection.includes('engine') || lowerSection.includes('transmission')) {
      return 'engine_performance';
    }
    if (lowerSection.includes('dimension')) {
      return 'dimensions_practicality';
    }
    if (lowerSection.includes('safety')) {
      return 'safety';
    }

    return 'dimensions_practicality'; // Default
  }

  static mapMatchedSpecsToSpecsNormalized(matchedSpecs: MatchedSpec[]): Partial<SpecsNormalized> {
    const specs: Partial<SpecsNormalized> = {};

    for (const matched of matchedSpecs) {
      if (!matched.suggested_path) continue;

      const pathParts = matched.suggested_path.split('.');
      let current: any = specs;

      for (let i = 0; i < pathParts.length - 1; i++) {
        const part = pathParts[i];
        if (!current[part]) {
          current[part] = {};
        }
        current = current[part];
      }

      const finalKey = pathParts[pathParts.length - 1];
      current[finalKey] = matched.source_value;
    }

    return specs;
  }

  static clearCache(): void {
    this.specKeyCache = null;
    this.cacheExpiry = 0;
  }
}
