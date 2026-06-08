import { v4 as uuidv4 } from 'uuid';
import { Brand } from '../../../models/brand.model';
import { BodyType } from '../../../models/body-type.model';
import { FuelType } from '../../../models/fuel-type.model';
import { Car } from '../../../models/car.model';
import { CarVariant, SpecsNormalized, TransmissionType } from '../../../models/car-variant.model';
import { ImportLog } from '../../../models/import-log.model';
import { ImportKeyMapping, IImportKeyMapping } from '../../../models/import-key-mapping.model';
import { AppError } from '../../../shared/utils/app-error.util';
import { CarAggregationService } from '../../../shared/services/car-aggregation.service';
import { CarDekhoExtractor } from '../extractors/cardekho.extractor';
import { CarWaleExtractor } from '../extractors/carwale.extractor';
import { KeyMatcher } from '../extractors/key-matcher';
import { ImportNormalizerService } from './import-normalizer.service';
import { PowertrainDetectorService } from '../../variants/services/powertrain-detector.service';
import { SEOTagGeneratorService } from './seo-tag-generator.service';
import { SEOAutoWiringService } from './seo-auto-wiring.service';
import { validateVariantSpecs } from '../validation/spec-validator';
import { AVAILABLE_TARGET_FIELD_GROUPS, TargetFieldGroup } from '../constants/available-target-fields';
import { ExtractedCarData, ExtractedVariantData, MatchedSpec, UnmatchedSpec } from '../types/import.types';

export type ImportSource = 'carwale' | 'cardekho';

// ── Unified preview response ──────────────────────────────────────────────────

export interface UnmatchedCarField {
  scrapedKey: string;
  value: string;
  section: string;
  suggestedTargetField?: string;
  confidence: number;
}

export interface MatchedCarField {
  scrapedKey: string;
  value: any;
  targetField: string;
  targetLabel: string;
  confidence: number;
  matchType: string;
}

export interface UnmatchedSpecWithSuggestion {
  scrapedKey: string;
  value: string;
  section: string;
  suggestedTargetField?: string;
  suggestedCategory?: string;
  confidence: number;
}

export interface MatchedSpecPreview {
  scrapedKey: string;
  value: any;
  targetField: string;
  section: string;
  matchType: string;
  confidence: number;
}

export interface VariantSectionPreview {
  sourceUrl: string;
  extracted: ExtractedVariantData | null;
  variantName: string;
  fullName: string;
  price: number;
  priceText: string;
  fuelType: string;
  fuelTypeId?: string;
  fuelTypeMatched: boolean;
  transmission: string;
  transmissionNormalized?: string | null;
  matched: MatchedSpecPreview[];
  unmatched: UnmatchedSpecWithSuggestion[];
  specsNormalized: Partial<SpecsNormalized>;
  specsRaw: Record<string, any>;
  existing?: { variant_id: string; variant_name: string; slug: string };
  warnings: string[];
}

export interface UnifiedPreviewResponse {
  success: boolean;
  source: ImportSource;
  car: {
    extracted: ExtractedCarData | null;
    matched: MatchedCarField[];
    unmatched: UnmatchedCarField[];
    raw: Record<string, any>;
    existing?: { car_id: string; name: string; slug: string };
    warnings: string[];
  };
  variants: VariantSectionPreview[];
  availableTargetFields: TargetFieldGroup[];
  warnings: string[];
}

// ── Unified save request ──────────────────────────────────────────────────────

export interface ManualMapping {
  scrapedKey: string;
  targetField: string;
  value: any;
  saveMapping: boolean;
  section?: string;
}

export interface UnifiedSaveCarPayload {
  mode: 'create' | 'update' | 'merge';
  car_id?: string;
  name: string;
  brand_id: string;
  body_type_id: string;
  slug: string;
  description?: string;
  exshowroom_price?: number | null;
  expected_exshowroom_price?: number | null;
  is_electric: boolean;
  is_published: boolean;
  manualMappings: ManualMapping[];
  ignoredKeys: string[];
}

export interface UnifiedSaveVariantPayload {
  mode: 'create' | 'update' | 'merge';
  car_id: string;
  variant_id?: string;
  sourceUrl?: string;
  variantName: string;
  slug: string;
  modelYear: number;
  fuelTypeId?: string;
  transmissionType?: string | null;
  exShowroomPrice?: number;
  specsNormalized: any;
  specsRaw: any;
  manualMappings: ManualMapping[];
  ignoredKeys: string[];
}

export interface UnifiedSaveRequest {
  source: ImportSource;
  carUrl?: string;
  variantUrls?: string[];
  car?: UnifiedSaveCarPayload;
  variants?: UnifiedSaveVariantPayload[];
}

export interface UnifiedSaveResult {
  success: boolean;
  car_id?: string;
  variant_ids: string[];
  savedMappings: number;
  warnings: string[];
  errors: string[];
}

export class UnifiedImportService {
  // ── Source detection ────────────────────────────────────────────────────────

  static detectSource(url: string): ImportSource {
    if (url.includes('carwale.com')) return 'carwale';
    return 'cardekho';
  }

  private static async fetchCarData(url: string): Promise<ExtractedCarData> {
    return this.detectSource(url) === 'carwale'
      ? CarWaleExtractor.extractCarData(url)
      : CarDekhoExtractor.extractCarData(url);
  }

  private static async fetchVariantData(url: string): Promise<ExtractedVariantData> {
    return this.detectSource(url) === 'carwale'
      ? CarWaleExtractor.extractVariantData(url)
      : CarDekhoExtractor.extractVariantData(url);
  }

  // ── Key normalization ───────────────────────────────────────────────────────

  static normalizeKey(raw: string): string {
    return raw
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  // ── Saved mapping lookup ────────────────────────────────────────────────────

  private static async loadSavedMappings(source: ImportSource): Promise<IImportKeyMapping[]> {
    return ImportKeyMapping.find({ source, is_active: true }).lean() as any;
  }

  private static applyKeyMappings(
    unmatched: UnmatchedSpec[],
    savedMappings: IImportKeyMapping[]
  ): UnmatchedSpecWithSuggestion[] {
    const mappingMap = new Map(
      savedMappings.map(m => [m.normalized_scraped_key, m.target_field])
    );

    return unmatched.map(u => {
      const normalizedKey = this.normalizeKey(u.source_label);
      const savedField = mappingMap.get(normalizedKey);

      return {
        scrapedKey: u.source_label,
        value: u.source_value,
        section: u.section,
        suggestedTargetField: savedField || u.suggested_category,
        suggestedCategory: u.suggested_category,
        confidence: savedField ? 0.95 : 0,
      };
    });
  }

  // ── Car field matching ──────────────────────────────────────────────────────

  private static async buildCarMatchedFields(extracted: ExtractedCarData): Promise<{
    matched: MatchedCarField[];
    unmatched: UnmatchedCarField[];
    raw: Record<string, any>;
  }> {
    const matched: MatchedCarField[] = [];
    const unmatched: UnmatchedCarField[] = [];
    const raw: Record<string, any> = {};
    // Name
    matched.push({ scrapedKey: 'Car Name', value: extracted.name, targetField: 'name', targetLabel: 'Car Name', confidence: 1.0, matchType: 'exact' });

    // Brand
    if (extracted.brand) {
      const brandMatch = await Brand.findOne({
        is_deleted: false,
        $or: [
          { name: { $regex: `^${extracted.brand}$`, $options: 'i' } },
          { name: { $regex: extracted.brand, $options: 'i' } },
        ],
      }).lean();
      if (brandMatch) {
        matched.push({ scrapedKey: 'Brand', value: (brandMatch as any).brand_id, targetField: 'brand_id', targetLabel: `Brand (${(brandMatch as any).name})`, confidence: 1.0, matchType: 'exact' });
      } else {
        unmatched.push({ scrapedKey: 'Brand', value: extracted.brand, section: 'Car Info', confidence: 0, suggestedTargetField: 'brand_id' });
      }
    } else {
      unmatched.push({ scrapedKey: 'Brand', value: '', section: 'Car Info', confidence: 0, suggestedTargetField: 'brand_id' });
    }

    // Body Type
    if (extracted.body_type) {
      const btMatch = await BodyType.findOne({
        is_deleted: false,
        name: { $regex: extracted.body_type, $options: 'i' },
      }).lean();
      if (btMatch) {
        matched.push({ scrapedKey: 'Body Type', value: (btMatch as any).body_type_id, targetField: 'body_type_id', targetLabel: `Body Type (${(btMatch as any).name})`, confidence: 1.0, matchType: 'exact' });
      } else {
        unmatched.push({ scrapedKey: 'Body Type', value: extracted.body_type, section: 'Car Info', confidence: 0, suggestedTargetField: 'body_type_id' });
      }
    } else {
      unmatched.push({ scrapedKey: 'Body Type', value: '', section: 'Car Info', confidence: 0, suggestedTargetField: 'body_type_id' });
    }

    // Slug
    matched.push({ scrapedKey: 'Slug', value: extracted.slug, targetField: 'slug', targetLabel: 'URL Slug', confidence: 1.0, matchType: 'exact' });

    // Description
    if (extracted.description) {
      matched.push({ scrapedKey: 'Description', value: extracted.description, targetField: 'description', targetLabel: 'Description', confidence: 1.0, matchType: 'exact' });
    }

    // Prices
    if (extracted.min_price) {
      matched.push({ scrapedKey: 'Min Price', value: extracted.min_price, targetField: 'exshowroom_price', targetLabel: 'Ex-Showroom Price', confidence: 0.9, matchType: 'normalized' });
    }
    if (extracted.max_price) {
      matched.push({ scrapedKey: 'Max Price', value: extracted.max_price, targetField: 'expected_exshowroom_price', targetLabel: 'Expected Price', confidence: 0.9, matchType: 'normalized' });
    }

    // Is Electric
    const isElectric = extracted.fuel_type?.toLowerCase().includes('electric') || false;
    matched.push({ scrapedKey: 'Is Electric', value: isElectric, targetField: 'is_electric', targetLabel: 'Is Electric', confidence: 1.0, matchType: 'exact' });

    // Store extra raw fields
    if (extracted.range) raw.range = extracted.range;
    if (extracted.battery_capacity) raw.battery_capacity = extracted.battery_capacity;
    if (extracted.power) raw.power = extracted.power;
    if (extracted.safety_rating) raw.safety_rating = extracted.safety_rating;
    if (extracted.colors) raw.colors = extracted.colors;
    if (extracted.variants) raw.available_variants = extracted.variants;
    if (extracted.price_range_text) raw.price_range_text = extracted.price_range_text;

    return { matched, unmatched, raw };
  }

  // ── Master data validation ──────────────────────────────────────────────────

  static async validateMasterData(source: ImportSource, carUrl?: string, variantUrl?: string): Promise<string[]> {
    const warnings: string[] = [];

    const hasBrands = await Brand.countDocuments({ is_deleted: false });
    if (!hasBrands) warnings.push('No Brand master data found. Please create brands before importing.');

    const hasBodyTypes = await BodyType.countDocuments({ is_deleted: false });
    if (!hasBodyTypes) warnings.push('No Body Type master data found. Please create body types before importing.');

    const hasFuelTypes = await FuelType.countDocuments({ is_deleted: false });
    if (!hasFuelTypes) warnings.push('No Fuel Type master data found. Please create fuel types before importing.');

    return warnings;
  }

  // ── Unified Preview ─────────────────────────────────────────────────────────

  private static async buildVariantSection(
    variantUrl: string,
    savedMappings: IImportKeyMapping[],
    userId: string,
    source: ImportSource
  ): Promise<VariantSectionPreview> {
    const extractedVariant = await this.fetchVariantData(variantUrl);
    const { matched: matchedSpecs, unmatched: unmatchedSpecs } = await KeyMatcher.matchSpecs(extractedVariant.specs);
    const matchedPreview: MatchedSpecPreview[] = matchedSpecs.map(m => ({
      scrapedKey: m.source_label,
      value: m.source_value,
      targetField: m.suggested_path || m.matched_key_name,
      section: m.section,
      matchType: m.matchType,
      confidence: m.confidence,
    }));
    const unmatchedWithSuggestions = this.applyKeyMappings(unmatchedSpecs, savedMappings);
    const fuelTypeMatch = await FuelType.findOne({ is_deleted: false, name: { $regex: extractedVariant.fuel_type || '', $options: 'i' } }).lean();
    const normalizedTransmission = this.normalizeTransmission(extractedVariant.transmission || '');
    const { specs_normalized, specs_raw } = KeyMatcher.mapMatchedSpecsToSpecsNormalized(matchedSpecs);
    const variantSlug = (extractedVariant.variant_name || '').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const variantWarnings: string[] = [];
    if (!fuelTypeMatch && extractedVariant.fuel_type) variantWarnings.push(`Fuel type "${extractedVariant.fuel_type}" not found in master data.`);
    if (!normalizedTransmission && extractedVariant.transmission) variantWarnings.push(`Transmission "${extractedVariant.transmission}" could not be normalized.`);
    if (unmatchedSpecs.length > 0) variantWarnings.push(`${unmatchedSpecs.length} specs could not be auto-matched.`);
    if (matchedSpecs.some(m => m.matchType === 'fuzzy')) variantWarnings.push('Some specs used fuzzy matching — review before saving.');
    const existingVariant = await CarVariant.findOne({ slug: variantSlug, is_deleted: false }).lean();
    if (existingVariant) variantWarnings.push(`Variant with slug "${variantSlug}" already exists: ${(existingVariant as any).variant_name}`);
    await ImportLog.create({
      import_id: uuidv4(), source, import_type: 'variant', source_url: variantUrl,
      status: 'previewed', extracted_data: extractedVariant,
      matched_data: { matched: matchedSpecs, fuel_type: fuelTypeMatch, specs_normalized, specs_raw },
      unmatched_data: { unmatched: unmatchedSpecs }, warnings: variantWarnings, created_by: userId,
    });
    return {
      sourceUrl: variantUrl,
      extracted: extractedVariant,
      variantName: extractedVariant.variant_name,
      fullName: extractedVariant.full_name,
      price: extractedVariant.price,
      priceText: extractedVariant.price_text,
      fuelType: extractedVariant.fuel_type,
      fuelTypeId: fuelTypeMatch ? (fuelTypeMatch as any).fuel_type_id : undefined,
      fuelTypeMatched: !!fuelTypeMatch,
      transmission: extractedVariant.transmission,
      transmissionNormalized: normalizedTransmission,
      matched: matchedPreview,
      unmatched: unmatchedWithSuggestions,
      specsNormalized: specs_normalized,
      specsRaw: specs_raw,
      existing: existingVariant ? {
        variant_id: (existingVariant as any).variant_id,
        variant_name: (existingVariant as any).variant_name,
        slug: (existingVariant as any).slug,
      } : undefined,
      warnings: variantWarnings,
    };
  }

  static async unifiedPreview(
    source: ImportSource,
    carUrl: string | undefined,
    variantUrls: string[],
    userId: string
  ): Promise<UnifiedPreviewResponse> {
    const globalWarnings: string[] = [];

    // Validate master data
    const masterWarnings = await this.validateMasterData(source, carUrl, variantUrls[0]);
    globalWarnings.push(...masterWarnings);

    // Load saved key mappings for this source
    const savedMappings = await this.loadSavedMappings(source);

    // ── Car section ──────────────────────────────────────────────────────────
    let carSection: UnifiedPreviewResponse['car'] = {
      extracted: null,
      matched: [],
      unmatched: [],
      raw: {},
      warnings: [],
    };

    if (carUrl) {
      try {
        const extractedCar = await this.fetchCarData(carUrl);
        const { matched: carMatched, unmatched: carUnmatched, raw: carRaw } = await this.buildCarMatchedFields(extractedCar);

        // Check for existing car
        const existingCar = await Car.findOne({ slug: extractedCar.slug, is_deleted: false }).lean();
        if (existingCar) {
          carSection.warnings.push(`Car with slug "${extractedCar.slug}" already exists: ${(existingCar as any).name}`);
        }

        carSection = {
          extracted: extractedCar,
          matched: carMatched,
          unmatched: carUnmatched,
          raw: carRaw,
          existing: existingCar ? {
            car_id: (existingCar as any).car_id,
            name: (existingCar as any).name,
            slug: (existingCar as any).slug,
          } : undefined,
          warnings: carSection.warnings,
        };

        // Log car preview
        await ImportLog.create({
          import_id: uuidv4(),
          source,
          import_type: 'car',
          source_url: carUrl,
          status: 'previewed',
          extracted_data: extractedCar,
          matched_data: { matched: carMatched },
          unmatched_data: { unmatched: carUnmatched },
          warnings: carSection.warnings,
          created_by: userId,
        });
      } catch (err: any) {
        carSection.warnings.push(`Car fetch failed: ${err.message}`);
        globalWarnings.push(`Car data could not be extracted: ${err.message}`);
      }
    }

    // ── Variant sections (one per URL) ──────────────────────────────────────
    const variantSections: VariantSectionPreview[] = [];

    for (const variantUrl of variantUrls) {
      if (!variantUrl) continue;
      try {
        const section = await this.buildVariantSection(variantUrl, savedMappings, userId, source);
        variantSections.push(section);
      } catch (err: any) {
        globalWarnings.push(`Variant data could not be extracted from ${variantUrl}: ${err.message}`);
        variantSections.push({
          sourceUrl: variantUrl,
          extracted: null, variantName: '', fullName: '', price: 0, priceText: '',
          fuelType: '', fuelTypeMatched: false, transmission: '', transmissionNormalized: null,
          matched: [], unmatched: [], specsNormalized: {}, specsRaw: {},
          warnings: [`Fetch failed: ${err.message}`],
        });
      }
    }

    return {
      success: true,
      source,
      car: carSection,
      variants: variantSections,
      availableTargetFields: AVAILABLE_TARGET_FIELD_GROUPS,
      warnings: globalWarnings,
    };
  }

  // ── Apply manual mappings to specs ──────────────────────────────────────────

  private static applyManualMappingsToSpecs(
    specsNormalized: any,
    specsRaw: any,
    manualMappings: ManualMapping[],
    ignoredKeys: string[]
  ): { specsNormalized: any; specsRaw: any; unmatchedRaw: Record<string, any> } {
    const sn = { ...specsNormalized };
    const sr = { ...specsRaw };
    const unmatchedRaw: Record<string, any> = {};

    const ignoredSet = new Set(ignoredKeys.map(k => k.toLowerCase()));

    for (const mapping of manualMappings) {
      if (ignoredSet.has(mapping.scrapedKey.toLowerCase())) continue;

      const { targetField, value } = mapping;

      if (!targetField || targetField === 'specs_raw' || targetField === 'ignore') {
        unmatchedRaw[mapping.scrapedKey] = value;
        continue;
      }

      const parts = targetField.split('.');
      if (parts[0] === 'specs_normalized') {
        // Drill down into sn
        let cur: any = sn;
        for (let i = 1; i < parts.length - 1; i++) {
          if (!cur[parts[i]]) cur[parts[i]] = {};
          cur = cur[parts[i]];
        }
        cur[parts[parts.length - 1]] = value;
      } else if (parts[0] === 'specs_raw') {
        sr[mapping.scrapedKey] = value;
      }
    }

    // Ignored keys → store in unmatchedRaw for traceability
    for (const key of ignoredKeys) {
      unmatchedRaw[`_ignored_${key}`] = '[admin ignored]';
    }

    return { specsNormalized: sn, specsRaw: sr, unmatchedRaw };
  }

  // ── Persist saved key mappings ──────────────────────────────────────────────

  private static async persistKeyMappings(
    source: ImportSource,
    manualMappings: ManualMapping[],
    targetModel: 'Car' | 'CarVariant',
    userId: string
  ): Promise<number> {
    let saved = 0;

    for (const mapping of manualMappings) {
      if (!mapping.saveMapping || !mapping.targetField) continue;

      const normalizedScrapedKey = this.normalizeKey(mapping.scrapedKey);
      const sectionKey = (mapping.section || 'general').toLowerCase().replace(/\s+/g, '_');

      try {
        await ImportKeyMapping.findOneAndUpdate(
          { source, normalized_scraped_key: normalizedScrapedKey, target_model: targetModel },
          {
            $set: {
              scraped_key: mapping.scrapedKey,
              normalized_scraped_key: normalizedScrapedKey,
              target_field: mapping.targetField,
              target_section: sectionKey,
              is_active: true,
              updated_by: userId,
            },
            $setOnInsert: {
              mapping_id: uuidv4(),
              source,
              target_model: targetModel,
              created_by: userId,
            },
          },
          { upsert: true, new: true }
        );
        saved++;
      } catch {
        // Duplicate index conflict — mapping already exists, skip silently
      }
    }

    return saved;
  }

  // ── Unified Save ────────────────────────────────────────────────────────────

  static async unifiedSave(payload: UnifiedSaveRequest, userId: string): Promise<UnifiedSaveResult> {
    const { source, carUrl, car: carPayload } = payload;
    const warnings: string[] = [];
    const errors: string[] = [];
    let savedCarId: string | undefined;
    const savedVariantIds: string[] = [];
    let totalSavedMappings = 0;

    // ── Save Car ─────────────────────────────────────────────────────────────
    if (carPayload) {
      try {
        const {
          mode, car_id, name, brand_id, body_type_id, slug,
          description, exshowroom_price, expected_exshowroom_price,
          is_electric, is_published, manualMappings, ignoredKeys,
        } = carPayload;

        // Validate required master data
        const brandExists = await Brand.findOne({ brand_id, is_deleted: false });
        if (!brandExists) {
          throw new AppError(`Brand not found for brand_id: ${brand_id}. Please ensure Brand master data exists.`, 404);
        }

        const bodyTypeExists = await BodyType.findOne({ body_type_id, is_deleted: false });
        if (!bodyTypeExists) {
          throw new AppError(`Body Type not found for body_type_id: ${body_type_id}. Please ensure Body Type master data exists.`, 404);
        }

        if (mode === 'create') {
          const existingSlug = await Car.findOne({ slug, is_deleted: false });
          if (existingSlug) {
            throw new AppError(`Car with slug "${slug}" already exists. Use update or merge mode.`, 409);
          }

          const newCarId = uuidv4();
          const carDoc = await Car.create({
            car_id: newCarId,
            name: name.trim(),
            slug: slug.trim(),
            brand_id,
            body_type_id,
            description: (description || '').trim(),
            exshowroom_price: exshowroom_price ?? undefined,
            expected_exshowroom_price: expected_exshowroom_price ?? undefined,
            is_electric,
            is_published,
            is_deleted: false,
          });
          savedCarId = carDoc.car_id;

          await ImportLog.findOneAndUpdate(
            { source_url: carUrl, created_by: userId, import_type: 'car' },
            { status: 'saved', car_id: newCarId }
          );
        } else {
          if (!car_id) throw new AppError('car_id required for update/merge mode', 400);

          const existingCar = await Car.findOne({ car_id, is_deleted: false });
          if (!existingCar) throw new AppError(`Car not found: ${car_id}`, 404);

          const updateData: any = {};
          if (mode === 'update') {
            Object.assign(updateData, { name, slug, brand_id, body_type_id, description, exshowroom_price, expected_exshowroom_price, is_electric, is_published });
          } else {
            // Merge: only fill empty fields
            if (!existingCar.name && name) updateData.name = name;
            if (!existingCar.description && description) updateData.description = description;
            if (!existingCar.exshowroom_price && exshowroom_price) updateData.exshowroom_price = exshowroom_price;
          }

          await Car.findOneAndUpdate({ car_id, is_deleted: false }, updateData);
          savedCarId = car_id;

          await ImportLog.findOneAndUpdate(
            { source_url: carUrl, created_by: userId, import_type: 'car' },
            { status: 'saved', car_id }
          );
        }

        // Persist car-level manual mappings
        const carMappingsSaved = await this.persistKeyMappings(source, manualMappings, 'Car', userId);
        totalSavedMappings += carMappingsSaved;

      } catch (err: any) {
        if (err instanceof AppError) throw err;
        errors.push(`Car save failed: ${err.message}`);
      }
    }

    // ── Save Variants ────────────────────────────────────────────────────────
    for (const variantPayload of (payload.variants || [])) {
      try {
        const {
          mode, variant_id, variantName, slug, modelYear, fuelTypeId,
          transmissionType, exShowroomPrice, specsNormalized, specsRaw,
          manualMappings, ignoredKeys, sourceUrl: variantSourceUrl,
        } = variantPayload;

        const car_id = variantPayload.car_id || savedCarId || '';
        if (!car_id) throw new AppError('Parent car_id is required for variant save. Provide a car URL or select an existing car.', 400);

        const car = await Car.findOne({ car_id, is_deleted: false });
        if (!car) throw new AppError(`Parent car not found: ${car_id}.`, 404);

        let resolvedFuelTypeId = fuelTypeId;
        if (fuelTypeId) {
          const ftExists = await FuelType.findOne({ fuel_type_id: fuelTypeId, is_deleted: false });
          if (!ftExists) {
            warnings.push(`Fuel type ID "${fuelTypeId}" not found for variant "${variantName}". Saving without fuel type.`);
            resolvedFuelTypeId = undefined;
          }
        }

        const { specsNormalized: finalSpecsNormalized, specsRaw: finalSpecsRaw, unmatchedRaw } =
          this.applyManualMappingsToSpecs(specsNormalized || {}, specsRaw || {}, manualMappings, ignoredKeys);
        const mergedSpecsRaw = { ...finalSpecsRaw, _unmatched: unmatchedRaw };
        const enhanced = await this.enhanceWithNormalization({ specs_normalized: finalSpecsNormalized, specs_raw: mergedSpecsRaw }, resolvedFuelTypeId);

        // ── Extract root-level fields from rootKey mappings ─────────────────
        // Key-matcher places rootKey-mapped fields (trim_name, drivetrain, etc.)
        // as top-level properties on specs_normalized. Lift them to root fields
        // and strip them from specs_normalized before saving.
        const sn = enhanced.specs_normalized as any;
        const importedTrimName: string | undefined = sn.trim_name || undefined;
        const importedDrivetrain: string | undefined = sn.drivetrain || undefined;
        const importedSeatingCapacity: number | undefined =
          sn.dimensions_practicality?.seating_capacity != null
            ? Number(sn.dimensions_practicality.seating_capacity)
            : sn.seating_capacity != null
              ? Number(sn.seating_capacity)
              : undefined;
        // ex_showroom_price from spec row takes precedence only when payload price is missing
        const importedExShowroomPrice: number | undefined =
          exShowroomPrice ?? (typeof sn.ex_showroom_price === 'number' ? sn.ex_showroom_price : undefined);
        // body_type: fall back to parent car's body_type_id resolved name
        let importedBodyType: string | undefined = sn.body_type || undefined;
        if (!importedBodyType && (car as any).body_type_id) {
          const bt = await BodyType.findOne({ body_type_id: (car as any).body_type_id, is_deleted: false }).lean();
          if ((bt as any)?.name) importedBodyType = (bt as any).name;
        }

        // Remove rootKey artefacts from specs_normalized so they don't double-save
        const { trim_name: _tn, drivetrain: _dr, seating_capacity: _sc, ex_showroom_price: _ep, body_type: _bt, ...cleanSpecsNormalized } = sn;
        enhanced.specs_normalized = cleanSpecsNormalized;

        const specValidation = validateVariantSpecs({ fuel_type_name: undefined, specs_normalized: enhanced.specs_normalized, specs_raw: enhanced.specs_raw });
        if (!specValidation.valid) {
          const msg = specValidation.errors.map((e: any) => e.message).join('; ');
          warnings.push(`Spec validation for "${variantName}": ${msg}`);
        }

        const generatedTags = SEOTagGeneratorService.generateTagsFromDerivedFlags(enhanced.specs_raw);

        if (mode === 'create') {
          const variantSlugClean = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
          const existingVariant = await CarVariant.findOne({ car_id, slug: variantSlugClean, is_deleted: false });
          if (existingVariant) throw new AppError(`Variant with slug "${variantSlugClean}" already exists for this car.`, 409);

          const newVariantId = uuidv4();
          const variantDoc = await CarVariant.create({
            variant_id: newVariantId, car_id,
            variant_name: variantName.trim(), slug: variantSlugClean,
            model_year: modelYear || new Date().getFullYear(),
            fuel_type_id: resolvedFuelTypeId,
            transmission_type: transmissionType as TransmissionType || undefined,
            ex_showroom_price: importedExShowroomPrice,
            body_type: importedBodyType,
            trim_name: importedTrimName,
            seating_capacity: importedSeatingCapacity,
            drivetrain: importedDrivetrain,
            specs_normalized: enhanced.specs_normalized, specs_raw: enhanced.specs_raw,
            best_for_tags: generatedTags,
            has_engine: enhanced.has_engine, has_battery: enhanced.has_battery,
            has_motor: enhanced.has_motor, has_external_charging: enhanced.has_external_charging,
            is_published: false, is_deleted: false, is_archived: false,
          });
          savedVariantIds.push(variantDoc.variant_id);

          if (variantSourceUrl) {
            await ImportLog.findOneAndUpdate(
              { source_url: variantSourceUrl, created_by: userId, import_type: 'variant' },
              { status: 'saved', variant_id: newVariantId, car_id }
            );
          }

          try { await CarAggregationService.recomputeFullAggregates(car_id); }
          catch (e: any) { warnings.push(`Aggregates recompute failed for "${variantName}": ${(e as Error).message}`); }

          try {
            if (enhanced.specs_normalized) {
              await SEOAutoWiringService.autoWireVariant(newVariantId, car_id, enhanced.specs_normalized);
            }
          } catch { /* non-fatal */ }

        } else if (mode === 'update' || mode === 'merge') {
          if (!variant_id) throw new AppError('variant_id required for update/merge mode', 400);
          const existingVariant = await CarVariant.findOne({ variant_id, car_id, is_deleted: false });
          if (!existingVariant) throw new AppError(`Variant not found: ${variant_id}`, 404);

          const updateData: any = { specs_normalized: enhanced.specs_normalized, specs_raw: enhanced.specs_raw };
          if (mode === 'update') {
            Object.assign(updateData, {
              variant_name: variantName, slug: slug.trim(), model_year: modelYear,
              fuel_type_id: resolvedFuelTypeId, transmission_type: transmissionType,
              ex_showroom_price: importedExShowroomPrice,
              body_type: importedBodyType,
              trim_name: importedTrimName,
              ...(importedSeatingCapacity != null && { seating_capacity: importedSeatingCapacity }),
              ...(importedDrivetrain && { drivetrain: importedDrivetrain }),
              best_for_tags: generatedTags,
              has_engine: enhanced.has_engine, has_battery: enhanced.has_battery,
              has_motor: enhanced.has_motor, has_external_charging: enhanced.has_external_charging,
            });
          } else {
            // merge mode: only fill root fields if currently empty
            if (importedBodyType && !(existingVariant as any).body_type) updateData.body_type = importedBodyType;
            if (importedTrimName && !(existingVariant as any).trim_name) updateData.trim_name = importedTrimName;
            if (importedSeatingCapacity != null && !(existingVariant as any).seating_capacity) updateData.seating_capacity = importedSeatingCapacity;
            if (importedDrivetrain && !(existingVariant as any).drivetrain) updateData.drivetrain = importedDrivetrain;
            if (importedExShowroomPrice && !(existingVariant as any).ex_showroom_price) updateData.ex_showroom_price = importedExShowroomPrice;
          }

          await CarVariant.findOneAndUpdate({ variant_id, is_deleted: false }, updateData);
          savedVariantIds.push(variant_id);

          try { await CarAggregationService.recomputeFullAggregates(car_id); }
          catch (e: any) { warnings.push(`Aggregates recompute failed for "${variantName}": ${(e as Error).message}`); }
        }

        const variantMappingsSaved = await this.persistKeyMappings(source, manualMappings, 'CarVariant', userId);
        totalSavedMappings += variantMappingsSaved;

      } catch (err: any) {
        if (err instanceof AppError) throw err;
        errors.push(`Variant "${variantPayload.variantName}" save failed: ${err.message}`);
      }
    }

    return {
      success: errors.length === 0,
      car_id: savedCarId,
      variant_ids: savedVariantIds,
      savedMappings: totalSavedMappings,
      warnings,
      errors,
    };
  }

  // ── Key mappings CRUD ───────────────────────────────────────────────────────

  static async getKeyMappings(source?: ImportSource, targetModel?: 'Car' | 'CarVariant') {
    const filter: any = { is_active: true };
    if (source) filter.source = source;
    if (targetModel) filter.target_model = targetModel;
    return ImportKeyMapping.find(filter).sort({ scraped_key: 1 }).lean();
  }

  static async deleteKeyMapping(mapping_id: string) {
    return ImportKeyMapping.findOneAndUpdate(
      { mapping_id },
      { is_active: false },
      { new: true }
    );
  }

  // ── Normalization helper ────────────────────────────────────────────────────

  private static async enhanceWithNormalization(
    data: { specs_normalized: any; specs_raw: any },
    fuel_type_id?: string
  ): Promise<any> {
    try {
      if (!data.specs_raw) return { ...data, has_engine: false, has_battery: false, has_motor: false, has_external_charging: false };

      let fuel_type_slug = 'petrol';
      if (fuel_type_id) {
        const ft = await FuelType.findOne({ fuel_type_id, is_deleted: false });
        if (ft?.slug) fuel_type_slug = ft.slug;
      }

      const normReport = ImportNormalizerService.normalize(data.specs_raw);
      const powertrainFlags = PowertrainDetectorService.detect(normReport.specs_normalized, fuel_type_slug);

      const mergedNormalized = { ...data.specs_normalized, ...normReport.specs_normalized };

      // Normalize alternate_fuel_type: strip primary fuel prefix (e.g. "Petrol+CNG" → "CNG")
      const ep = mergedNormalized.engine_performance;
      if (ep?.alternate_fuel_type) {
        const raw = String(ep.alternate_fuel_type).toLowerCase();
        if (raw.includes('cng')) ep.alternate_fuel_type = 'CNG';
        else if (raw.includes('electric') || raw.includes('ev') || raw.includes('hybrid')) ep.alternate_fuel_type = 'Electric';
        else if (raw.includes('lpg')) ep.alternate_fuel_type = 'LPG';
        else if (raw.includes('hydrogen')) ep.alternate_fuel_type = 'Hydrogen';
      }

      return {
        specs_normalized: mergedNormalized,
        specs_raw: data.specs_raw,
        has_engine: powertrainFlags.has_engine,
        has_battery: powertrainFlags.has_battery,
        has_motor: powertrainFlags.has_motor,
        has_external_charging: powertrainFlags.has_external_charging,
      };
    } catch {
      return { ...data, has_engine: false, has_battery: false, has_motor: false, has_external_charging: false };
    }
  }

  // ── Transmission normalizer ─────────────────────────────────────────────────

  static normalizeTransmission(transmission: string): TransmissionType | null {
    if (!transmission) return null;
    const n = transmission.toLowerCase().trim();
    if (n === 'manual') return 'manual';
    if (n === 'automatic') return 'automatic';
    if (n === 'cvt') return 'cvt';
    if (n === 'dct') return 'dct';
    if (n === 'amt') return 'amt';
    if (n === 'dsg') return 'dsg';
    if (n === 'imt') return 'imt';
    if (n === 'e-cvt' || n === 'ecvt') return 'e_cvt';
    if (n === 'torque converter') return 'torque_converter';
    if (n.includes('single speed') || n.includes('single-speed') || n.includes('reduction gear')) return 'single_speed_ev';
    if (n.includes('dsg')) return 'dsg';
    if (n.includes('imt')) return 'imt';
    if (n.includes('e-cvt') || n.includes('ecvt')) return 'e_cvt';
    if (n.includes('dct') || n.includes('dual clutch')) return 'dct';
    if (n.includes('amt') || n.includes('automated manual')) return 'amt';
    if (n.includes('cvt') || n.includes('continuously variable')) return 'cvt';
    if (n.includes('manual')) return 'manual';
    if (n.includes('automatic') || n.includes('auto')) return 'automatic';
    return null;
  }
}
