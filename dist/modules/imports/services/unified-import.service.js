"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnifiedImportService = void 0;
const uuid_1 = require("uuid");
const brand_model_1 = require("../../../models/brand.model");
const body_type_model_1 = require("../../../models/body-type.model");
const fuel_type_model_1 = require("../../../models/fuel-type.model");
const car_model_1 = require("../../../models/car.model");
const car_variant_model_1 = require("../../../models/car-variant.model");
const import_log_model_1 = require("../../../models/import-log.model");
const import_key_mapping_model_1 = require("../../../models/import-key-mapping.model");
const app_error_util_1 = require("../../../shared/utils/app-error.util");
const car_aggregation_service_1 = require("../../../shared/services/car-aggregation.service");
const cardekho_extractor_1 = require("../extractors/cardekho.extractor");
const carwale_extractor_1 = require("../extractors/carwale.extractor");
const key_matcher_1 = require("../extractors/key-matcher");
const import_normalizer_service_1 = require("./import-normalizer.service");
const powertrain_detector_service_1 = require("../../variants/services/powertrain-detector.service");
const seo_tag_generator_service_1 = require("./seo-tag-generator.service");
const seo_auto_wiring_service_1 = require("./seo-auto-wiring.service");
const spec_validator_1 = require("../validation/spec-validator");
const available_target_fields_1 = require("../constants/available-target-fields");
class UnifiedImportService {
    // ── Source detection ────────────────────────────────────────────────────────
    static detectSource(url) {
        if (url.includes('carwale.com'))
            return 'carwale';
        return 'cardekho';
    }
    static async fetchCarData(url) {
        return this.detectSource(url) === 'carwale'
            ? carwale_extractor_1.CarWaleExtractor.extractCarData(url)
            : cardekho_extractor_1.CarDekhoExtractor.extractCarData(url);
    }
    static async fetchVariantData(url) {
        return this.detectSource(url) === 'carwale'
            ? carwale_extractor_1.CarWaleExtractor.extractVariantData(url)
            : cardekho_extractor_1.CarDekhoExtractor.extractVariantData(url);
    }
    // ── Key normalization ───────────────────────────────────────────────────────
    static normalizeKey(raw) {
        return raw
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, ' ')
            .replace(/\s+/g, '_')
            .replace(/^_+|_+$/g, '');
    }
    // ── Saved mapping lookup ────────────────────────────────────────────────────
    static async loadSavedMappings(source) {
        return import_key_mapping_model_1.ImportKeyMapping.find({ source, is_active: true }).lean();
    }
    static applyKeyMappings(unmatched, savedMappings) {
        const mappingMap = new Map(savedMappings.map(m => [m.normalized_scraped_key, m.target_field]));
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
    static async buildCarMatchedFields(extracted) {
        const matched = [];
        const unmatched = [];
        const raw = {};
        // Name
        matched.push({ scrapedKey: 'Car Name', value: extracted.name, targetField: 'name', targetLabel: 'Car Name', confidence: 1.0, matchType: 'exact' });
        // Brand
        if (extracted.brand) {
            const brandMatch = await brand_model_1.Brand.findOne({
                is_deleted: false,
                $or: [
                    { name: { $regex: `^${extracted.brand}$`, $options: 'i' } },
                    { name: { $regex: extracted.brand, $options: 'i' } },
                ],
            }).lean();
            if (brandMatch) {
                matched.push({ scrapedKey: 'Brand', value: brandMatch.brand_id, targetField: 'brand_id', targetLabel: `Brand (${brandMatch.name})`, confidence: 1.0, matchType: 'exact' });
            }
            else {
                unmatched.push({ scrapedKey: 'Brand', value: extracted.brand, section: 'Car Info', confidence: 0, suggestedTargetField: 'brand_id' });
            }
        }
        else {
            unmatched.push({ scrapedKey: 'Brand', value: '', section: 'Car Info', confidence: 0, suggestedTargetField: 'brand_id' });
        }
        // Body Type
        if (extracted.body_type) {
            const btMatch = await body_type_model_1.BodyType.findOne({
                is_deleted: false,
                name: { $regex: extracted.body_type, $options: 'i' },
            }).lean();
            if (btMatch) {
                matched.push({ scrapedKey: 'Body Type', value: btMatch.body_type_id, targetField: 'body_type_id', targetLabel: `Body Type (${btMatch.name})`, confidence: 1.0, matchType: 'exact' });
            }
            else {
                unmatched.push({ scrapedKey: 'Body Type', value: extracted.body_type, section: 'Car Info', confidence: 0, suggestedTargetField: 'body_type_id' });
            }
        }
        else {
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
        if (extracted.range)
            raw.range = extracted.range;
        if (extracted.battery_capacity)
            raw.battery_capacity = extracted.battery_capacity;
        if (extracted.power)
            raw.power = extracted.power;
        if (extracted.safety_rating)
            raw.safety_rating = extracted.safety_rating;
        if (extracted.colors)
            raw.colors = extracted.colors;
        if (extracted.variants)
            raw.available_variants = extracted.variants;
        if (extracted.price_range_text)
            raw.price_range_text = extracted.price_range_text;
        return { matched, unmatched, raw };
    }
    // ── Master data validation ──────────────────────────────────────────────────
    static async validateMasterData(source, carUrl, variantUrl) {
        const warnings = [];
        const hasBrands = await brand_model_1.Brand.countDocuments({ is_deleted: false });
        if (!hasBrands)
            warnings.push('No Brand master data found. Please create brands before importing.');
        const hasBodyTypes = await body_type_model_1.BodyType.countDocuments({ is_deleted: false });
        if (!hasBodyTypes)
            warnings.push('No Body Type master data found. Please create body types before importing.');
        const hasFuelTypes = await fuel_type_model_1.FuelType.countDocuments({ is_deleted: false });
        if (!hasFuelTypes)
            warnings.push('No Fuel Type master data found. Please create fuel types before importing.');
        return warnings;
    }
    // ── Unified Preview ─────────────────────────────────────────────────────────
    static async buildVariantSection(variantUrl, savedMappings, userId, source) {
        const extractedVariant = await this.fetchVariantData(variantUrl);
        const { matched: matchedSpecs, unmatched: unmatchedSpecs } = await key_matcher_1.KeyMatcher.matchSpecs(extractedVariant.specs);
        const matchedPreview = matchedSpecs.map(m => ({
            scrapedKey: m.source_label,
            value: m.source_value,
            targetField: m.suggested_path || m.matched_key_name,
            section: m.section,
            matchType: m.matchType,
            confidence: m.confidence,
        }));
        const unmatchedWithSuggestions = this.applyKeyMappings(unmatchedSpecs, savedMappings);
        const fuelTypeMatch = await fuel_type_model_1.FuelType.findOne({ is_deleted: false, name: { $regex: extractedVariant.fuel_type || '', $options: 'i' } }).lean();
        const normalizedTransmission = this.normalizeTransmission(extractedVariant.transmission || '');
        const { specs_normalized, specs_raw } = key_matcher_1.KeyMatcher.mapMatchedSpecsToSpecsNormalized(matchedSpecs);
        const variantSlug = (extractedVariant.variant_name || '').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        const variantWarnings = [];
        if (!fuelTypeMatch && extractedVariant.fuel_type)
            variantWarnings.push(`Fuel type "${extractedVariant.fuel_type}" not found in master data.`);
        if (!normalizedTransmission && extractedVariant.transmission)
            variantWarnings.push(`Transmission "${extractedVariant.transmission}" could not be normalized.`);
        if (unmatchedSpecs.length > 0)
            variantWarnings.push(`${unmatchedSpecs.length} specs could not be auto-matched.`);
        if (matchedSpecs.some(m => m.matchType === 'fuzzy'))
            variantWarnings.push('Some specs used fuzzy matching — review before saving.');
        const existingVariant = await car_variant_model_1.CarVariant.findOne({ slug: variantSlug, is_deleted: false }).lean();
        if (existingVariant)
            variantWarnings.push(`Variant with slug "${variantSlug}" already exists: ${existingVariant.variant_name}`);
        await import_log_model_1.ImportLog.create({
            import_id: (0, uuid_1.v4)(), source, import_type: 'variant', source_url: variantUrl,
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
            fuelTypeId: fuelTypeMatch ? fuelTypeMatch.fuel_type_id : undefined,
            fuelTypeMatched: !!fuelTypeMatch,
            transmission: extractedVariant.transmission,
            transmissionNormalized: normalizedTransmission,
            matched: matchedPreview,
            unmatched: unmatchedWithSuggestions,
            specsNormalized: specs_normalized,
            specsRaw: specs_raw,
            existing: existingVariant ? {
                variant_id: existingVariant.variant_id,
                variant_name: existingVariant.variant_name,
                slug: existingVariant.slug,
            } : undefined,
            warnings: variantWarnings,
        };
    }
    static async unifiedPreview(source, carUrl, variantUrls, userId) {
        const globalWarnings = [];
        // Validate master data
        const masterWarnings = await this.validateMasterData(source, carUrl, variantUrls[0]);
        globalWarnings.push(...masterWarnings);
        // Load saved key mappings for this source
        const savedMappings = await this.loadSavedMappings(source);
        // ── Car section ──────────────────────────────────────────────────────────
        let carSection = {
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
                const existingCar = await car_model_1.Car.findOne({ slug: extractedCar.slug, is_deleted: false }).lean();
                if (existingCar) {
                    carSection.warnings.push(`Car with slug "${extractedCar.slug}" already exists: ${existingCar.name}`);
                }
                carSection = {
                    extracted: extractedCar,
                    matched: carMatched,
                    unmatched: carUnmatched,
                    raw: carRaw,
                    existing: existingCar ? {
                        car_id: existingCar.car_id,
                        name: existingCar.name,
                        slug: existingCar.slug,
                    } : undefined,
                    warnings: carSection.warnings,
                };
                // Log car preview
                await import_log_model_1.ImportLog.create({
                    import_id: (0, uuid_1.v4)(),
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
            }
            catch (err) {
                carSection.warnings.push(`Car fetch failed: ${err.message}`);
                globalWarnings.push(`Car data could not be extracted: ${err.message}`);
            }
        }
        // ── Variant sections (one per URL) ──────────────────────────────────────
        const variantSections = [];
        for (const variantUrl of variantUrls) {
            if (!variantUrl)
                continue;
            try {
                const section = await this.buildVariantSection(variantUrl, savedMappings, userId, source);
                variantSections.push(section);
            }
            catch (err) {
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
            availableTargetFields: available_target_fields_1.AVAILABLE_TARGET_FIELD_GROUPS,
            warnings: globalWarnings,
        };
    }
    // ── Apply manual mappings to specs ──────────────────────────────────────────
    static applyManualMappingsToSpecs(specsNormalized, specsRaw, manualMappings, ignoredKeys) {
        const sn = { ...specsNormalized };
        const sr = { ...specsRaw };
        const unmatchedRaw = {};
        const ignoredSet = new Set(ignoredKeys.map(k => k.toLowerCase()));
        for (const mapping of manualMappings) {
            if (ignoredSet.has(mapping.scrapedKey.toLowerCase()))
                continue;
            const { targetField, value } = mapping;
            if (!targetField || targetField === 'specs_raw' || targetField === 'ignore') {
                unmatchedRaw[mapping.scrapedKey] = value;
                continue;
            }
            const parts = targetField.split('.');
            if (parts[0] === 'specs_normalized') {
                // Drill down into sn
                let cur = sn;
                for (let i = 1; i < parts.length - 1; i++) {
                    if (!cur[parts[i]])
                        cur[parts[i]] = {};
                    cur = cur[parts[i]];
                }
                cur[parts[parts.length - 1]] = value;
            }
            else if (parts[0] === 'specs_raw') {
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
    static async persistKeyMappings(source, manualMappings, targetModel, userId) {
        let saved = 0;
        for (const mapping of manualMappings) {
            if (!mapping.saveMapping || !mapping.targetField)
                continue;
            const normalizedScrapedKey = this.normalizeKey(mapping.scrapedKey);
            const sectionKey = (mapping.section || 'general').toLowerCase().replace(/\s+/g, '_');
            try {
                await import_key_mapping_model_1.ImportKeyMapping.findOneAndUpdate({ source, normalized_scraped_key: normalizedScrapedKey, target_model: targetModel }, {
                    $set: {
                        scraped_key: mapping.scrapedKey,
                        normalized_scraped_key: normalizedScrapedKey,
                        target_field: mapping.targetField,
                        target_section: sectionKey,
                        is_active: true,
                        updated_by: userId,
                    },
                    $setOnInsert: {
                        mapping_id: (0, uuid_1.v4)(),
                        source,
                        target_model: targetModel,
                        created_by: userId,
                    },
                }, { upsert: true, new: true });
                saved++;
            }
            catch {
                // Duplicate index conflict — mapping already exists, skip silently
            }
        }
        return saved;
    }
    // ── Unified Save ────────────────────────────────────────────────────────────
    static async unifiedSave(payload, userId) {
        const { source, carUrl, car: carPayload } = payload;
        const warnings = [];
        const errors = [];
        let savedCarId;
        const savedVariantIds = [];
        let totalSavedMappings = 0;
        // ── Save Car ─────────────────────────────────────────────────────────────
        if (carPayload) {
            try {
                const { mode, car_id, name, brand_id, body_type_id, slug, description, exshowroom_price, expected_exshowroom_price, is_electric, is_published, manualMappings, ignoredKeys, } = carPayload;
                // Validate required master data
                const brandExists = await brand_model_1.Brand.findOne({ brand_id, is_deleted: false });
                if (!brandExists) {
                    throw new app_error_util_1.AppError(`Brand not found for brand_id: ${brand_id}. Please ensure Brand master data exists.`, 404);
                }
                const bodyTypeExists = await body_type_model_1.BodyType.findOne({ body_type_id, is_deleted: false });
                if (!bodyTypeExists) {
                    throw new app_error_util_1.AppError(`Body Type not found for body_type_id: ${body_type_id}. Please ensure Body Type master data exists.`, 404);
                }
                if (mode === 'create') {
                    const existingSlug = await car_model_1.Car.findOne({ slug, is_deleted: false });
                    if (existingSlug) {
                        throw new app_error_util_1.AppError(`Car with slug "${slug}" already exists. Use update or merge mode.`, 409);
                    }
                    const newCarId = (0, uuid_1.v4)();
                    const carDoc = await car_model_1.Car.create({
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
                    await import_log_model_1.ImportLog.findOneAndUpdate({ source_url: carUrl, created_by: userId, import_type: 'car' }, { status: 'saved', car_id: newCarId });
                }
                else {
                    if (!car_id)
                        throw new app_error_util_1.AppError('car_id required for update/merge mode', 400);
                    const existingCar = await car_model_1.Car.findOne({ car_id, is_deleted: false });
                    if (!existingCar)
                        throw new app_error_util_1.AppError(`Car not found: ${car_id}`, 404);
                    const updateData = {};
                    if (mode === 'update') {
                        Object.assign(updateData, { name, slug, brand_id, body_type_id, description, exshowroom_price, expected_exshowroom_price, is_electric, is_published });
                    }
                    else {
                        // Merge: only fill empty fields
                        if (!existingCar.name && name)
                            updateData.name = name;
                        if (!existingCar.description && description)
                            updateData.description = description;
                        if (!existingCar.exshowroom_price && exshowroom_price)
                            updateData.exshowroom_price = exshowroom_price;
                    }
                    await car_model_1.Car.findOneAndUpdate({ car_id, is_deleted: false }, updateData);
                    savedCarId = car_id;
                    await import_log_model_1.ImportLog.findOneAndUpdate({ source_url: carUrl, created_by: userId, import_type: 'car' }, { status: 'saved', car_id });
                }
                // Persist car-level manual mappings
                const carMappingsSaved = await this.persistKeyMappings(source, manualMappings, 'Car', userId);
                totalSavedMappings += carMappingsSaved;
            }
            catch (err) {
                if (err instanceof app_error_util_1.AppError)
                    throw err;
                errors.push(`Car save failed: ${err.message}`);
            }
        }
        // ── Save Variants ────────────────────────────────────────────────────────
        for (const variantPayload of (payload.variants || [])) {
            try {
                const { mode, variant_id, variantName, slug, modelYear, fuelTypeId, transmissionType, exShowroomPrice, specsNormalized, specsRaw, manualMappings, ignoredKeys, sourceUrl: variantSourceUrl, } = variantPayload;
                const car_id = variantPayload.car_id || savedCarId || '';
                if (!car_id)
                    throw new app_error_util_1.AppError('Parent car_id is required for variant save. Provide a car URL or select an existing car.', 400);
                const car = await car_model_1.Car.findOne({ car_id, is_deleted: false });
                if (!car)
                    throw new app_error_util_1.AppError(`Parent car not found: ${car_id}.`, 404);
                let resolvedFuelTypeId = fuelTypeId;
                if (fuelTypeId) {
                    const ftExists = await fuel_type_model_1.FuelType.findOne({ fuel_type_id: fuelTypeId, is_deleted: false });
                    if (!ftExists) {
                        warnings.push(`Fuel type ID "${fuelTypeId}" not found for variant "${variantName}". Saving without fuel type.`);
                        resolvedFuelTypeId = undefined;
                    }
                }
                const { specsNormalized: finalSpecsNormalized, specsRaw: finalSpecsRaw, unmatchedRaw } = this.applyManualMappingsToSpecs(specsNormalized || {}, specsRaw || {}, manualMappings, ignoredKeys);
                const mergedSpecsRaw = { ...finalSpecsRaw, _unmatched: unmatchedRaw };
                const enhanced = await this.enhanceWithNormalization({ specs_normalized: finalSpecsNormalized, specs_raw: mergedSpecsRaw }, resolvedFuelTypeId);
                // ── Extract root-level fields from rootKey mappings ─────────────────
                // Key-matcher places rootKey-mapped fields (trim_name, drivetrain, etc.)
                // as top-level properties on specs_normalized. Lift them to root fields
                // and strip them from specs_normalized before saving.
                const sn = enhanced.specs_normalized;
                const importedTrimName = sn.trim_name || undefined;
                const importedDrivetrain = sn.drivetrain || undefined;
                const importedSeatingCapacity = sn.dimensions_practicality?.seating_capacity != null
                    ? Number(sn.dimensions_practicality.seating_capacity)
                    : sn.seating_capacity != null
                        ? Number(sn.seating_capacity)
                        : undefined;
                // ex_showroom_price from spec row takes precedence only when payload price is missing
                const importedExShowroomPrice = exShowroomPrice ?? (typeof sn.ex_showroom_price === 'number' ? sn.ex_showroom_price : undefined);
                // body_type: fall back to parent car's body_type_id resolved name
                let importedBodyType = sn.body_type || undefined;
                if (!importedBodyType && car.body_type_id) {
                    const bt = await body_type_model_1.BodyType.findOne({ body_type_id: car.body_type_id, is_deleted: false }).lean();
                    if (bt?.name)
                        importedBodyType = bt.name;
                }
                // Remove rootKey artefacts from specs_normalized so they don't double-save
                const { trim_name: _tn, drivetrain: _dr, seating_capacity: _sc, ex_showroom_price: _ep, body_type: _bt, ...cleanSpecsNormalized } = sn;
                enhanced.specs_normalized = cleanSpecsNormalized;
                const specValidation = (0, spec_validator_1.validateVariantSpecs)({ fuel_type_name: undefined, specs_normalized: enhanced.specs_normalized, specs_raw: enhanced.specs_raw });
                if (!specValidation.valid) {
                    const msg = specValidation.errors.map((e) => e.message).join('; ');
                    warnings.push(`Spec validation for "${variantName}": ${msg}`);
                }
                const generatedTags = seo_tag_generator_service_1.SEOTagGeneratorService.generateTagsFromDerivedFlags(enhanced.specs_raw);
                if (mode === 'create') {
                    const variantSlugClean = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
                    const existingVariant = await car_variant_model_1.CarVariant.findOne({ car_id, slug: variantSlugClean, is_deleted: false });
                    if (existingVariant)
                        throw new app_error_util_1.AppError(`Variant with slug "${variantSlugClean}" already exists for this car.`, 409);
                    const newVariantId = (0, uuid_1.v4)();
                    const variantDoc = await car_variant_model_1.CarVariant.create({
                        variant_id: newVariantId, car_id,
                        variant_name: variantName.trim(), slug: variantSlugClean,
                        model_year: modelYear || new Date().getFullYear(),
                        fuel_type_id: resolvedFuelTypeId,
                        transmission_type: transmissionType || undefined,
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
                        await import_log_model_1.ImportLog.findOneAndUpdate({ source_url: variantSourceUrl, created_by: userId, import_type: 'variant' }, { status: 'saved', variant_id: newVariantId, car_id });
                    }
                    try {
                        await car_aggregation_service_1.CarAggregationService.recomputeFullAggregates(car_id);
                    }
                    catch (e) {
                        warnings.push(`Aggregates recompute failed for "${variantName}": ${e.message}`);
                    }
                    try {
                        if (enhanced.specs_normalized) {
                            await seo_auto_wiring_service_1.SEOAutoWiringService.autoWireVariant(newVariantId, car_id, enhanced.specs_normalized);
                        }
                    }
                    catch { /* non-fatal */ }
                }
                else if (mode === 'update' || mode === 'merge') {
                    if (!variant_id)
                        throw new app_error_util_1.AppError('variant_id required for update/merge mode', 400);
                    const existingVariant = await car_variant_model_1.CarVariant.findOne({ variant_id, car_id, is_deleted: false });
                    if (!existingVariant)
                        throw new app_error_util_1.AppError(`Variant not found: ${variant_id}`, 404);
                    const updateData = { specs_normalized: enhanced.specs_normalized, specs_raw: enhanced.specs_raw };
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
                    }
                    else {
                        // merge mode: only fill root fields if currently empty
                        if (importedBodyType && !existingVariant.body_type)
                            updateData.body_type = importedBodyType;
                        if (importedTrimName && !existingVariant.trim_name)
                            updateData.trim_name = importedTrimName;
                        if (importedSeatingCapacity != null && !existingVariant.seating_capacity)
                            updateData.seating_capacity = importedSeatingCapacity;
                        if (importedDrivetrain && !existingVariant.drivetrain)
                            updateData.drivetrain = importedDrivetrain;
                        if (importedExShowroomPrice && !existingVariant.ex_showroom_price)
                            updateData.ex_showroom_price = importedExShowroomPrice;
                    }
                    await car_variant_model_1.CarVariant.findOneAndUpdate({ variant_id, is_deleted: false }, updateData);
                    savedVariantIds.push(variant_id);
                    try {
                        await car_aggregation_service_1.CarAggregationService.recomputeFullAggregates(car_id);
                    }
                    catch (e) {
                        warnings.push(`Aggregates recompute failed for "${variantName}": ${e.message}`);
                    }
                }
                const variantMappingsSaved = await this.persistKeyMappings(source, manualMappings, 'CarVariant', userId);
                totalSavedMappings += variantMappingsSaved;
            }
            catch (err) {
                if (err instanceof app_error_util_1.AppError)
                    throw err;
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
    static async getKeyMappings(source, targetModel) {
        const filter = { is_active: true };
        if (source)
            filter.source = source;
        if (targetModel)
            filter.target_model = targetModel;
        return import_key_mapping_model_1.ImportKeyMapping.find(filter).sort({ scraped_key: 1 }).lean();
    }
    static async deleteKeyMapping(mapping_id) {
        return import_key_mapping_model_1.ImportKeyMapping.findOneAndUpdate({ mapping_id }, { is_active: false }, { new: true });
    }
    // ── Normalization helper ────────────────────────────────────────────────────
    static async enhanceWithNormalization(data, fuel_type_id) {
        try {
            if (!data.specs_raw)
                return { ...data, has_engine: false, has_battery: false, has_motor: false, has_external_charging: false };
            let fuel_type_slug = 'petrol';
            if (fuel_type_id) {
                const ft = await fuel_type_model_1.FuelType.findOne({ fuel_type_id, is_deleted: false });
                if (ft?.slug)
                    fuel_type_slug = ft.slug;
            }
            const normReport = import_normalizer_service_1.ImportNormalizerService.normalize(data.specs_raw);
            const powertrainFlags = powertrain_detector_service_1.PowertrainDetectorService.detect(normReport.specs_normalized, fuel_type_slug);
            const mergedNormalized = { ...data.specs_normalized, ...normReport.specs_normalized };
            // Normalize alternate_fuel_type: strip primary fuel prefix (e.g. "Petrol+CNG" → "CNG")
            const ep = mergedNormalized.engine_performance;
            if (ep?.alternate_fuel_type) {
                const raw = String(ep.alternate_fuel_type).toLowerCase();
                if (raw.includes('cng'))
                    ep.alternate_fuel_type = 'CNG';
                else if (raw.includes('electric') || raw.includes('ev') || raw.includes('hybrid'))
                    ep.alternate_fuel_type = 'Electric';
                else if (raw.includes('lpg'))
                    ep.alternate_fuel_type = 'LPG';
                else if (raw.includes('hydrogen'))
                    ep.alternate_fuel_type = 'Hydrogen';
            }
            return {
                specs_normalized: mergedNormalized,
                specs_raw: data.specs_raw,
                has_engine: powertrainFlags.has_engine,
                has_battery: powertrainFlags.has_battery,
                has_motor: powertrainFlags.has_motor,
                has_external_charging: powertrainFlags.has_external_charging,
            };
        }
        catch {
            return { ...data, has_engine: false, has_battery: false, has_motor: false, has_external_charging: false };
        }
    }
    // ── Transmission normalizer ─────────────────────────────────────────────────
    static normalizeTransmission(transmission) {
        if (!transmission)
            return null;
        const n = transmission.toLowerCase().trim();
        if (n === 'manual')
            return 'manual';
        if (n === 'automatic')
            return 'automatic';
        if (n === 'cvt')
            return 'cvt';
        if (n === 'dct')
            return 'dct';
        if (n === 'amt')
            return 'amt';
        if (n === 'dsg')
            return 'dsg';
        if (n === 'imt')
            return 'imt';
        if (n === 'e-cvt' || n === 'ecvt')
            return 'e_cvt';
        if (n === 'torque converter')
            return 'torque_converter';
        if (n.includes('single speed') || n.includes('single-speed') || n.includes('reduction gear'))
            return 'single_speed_ev';
        if (n.includes('dsg'))
            return 'dsg';
        if (n.includes('imt'))
            return 'imt';
        if (n.includes('e-cvt') || n.includes('ecvt'))
            return 'e_cvt';
        if (n.includes('dct') || n.includes('dual clutch'))
            return 'dct';
        if (n.includes('amt') || n.includes('automated manual'))
            return 'amt';
        if (n.includes('cvt') || n.includes('continuously variable'))
            return 'cvt';
        if (n.includes('manual'))
            return 'manual';
        if (n.includes('automatic') || n.includes('auto'))
            return 'automatic';
        return null;
    }
}
exports.UnifiedImportService = UnifiedImportService;
//# sourceMappingURL=unified-import.service.js.map