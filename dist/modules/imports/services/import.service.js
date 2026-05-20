"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportService = void 0;
const uuid_1 = require("uuid");
const errorMessages_1 = require("../../../constants/errorMessages");
const body_type_model_1 = require("../../../models/body-type.model");
const brand_model_1 = require("../../../models/brand.model");
const car_variant_model_1 = require("../../../models/car-variant.model");
const car_model_1 = require("../../../models/car.model");
const fuel_type_model_1 = require("../../../models/fuel-type.model");
const import_log_model_1 = require("../../../models/import-log.model");
const app_error_util_1 = require("../../../shared/utils/app-error.util");
const car_aggregation_service_1 = require("../../../shared/services/car-aggregation.service");
const variant_integrity_service_1 = require("../../variants/services/variant-integrity.service");
const field_source_metadata_1 = require("../../../shared/utils/field-source-metadata");
const cardekho_extractor_1 = require("../extractors/cardekho.extractor");
const carwale_extractor_1 = require("../extractors/carwale.extractor");
const key_matcher_1 = require("../extractors/key-matcher");
const spec_validator_1 = require("../validation/spec-validator");
const seo_tag_generator_service_1 = require("./seo-tag-generator.service");
const import_normalizer_service_1 = require("./import-normalizer.service");
const powertrain_detector_service_1 = require("../../variants/services/powertrain-detector.service");
const seo_auto_wiring_service_1 = require("./seo-auto-wiring.service");
class ImportService {
    static detectSource(url) {
        if (url.includes('carwale.com'))
            return 'carwale';
        return 'cardekho';
    }
    static async extractCarData(url) {
        return this.detectSource(url) === 'carwale'
            ? carwale_extractor_1.CarWaleExtractor.extractCarData(url)
            : cardekho_extractor_1.CarDekhoExtractor.extractCarData(url);
    }
    static async extractVariantData(url) {
        return this.detectSource(url) === 'carwale'
            ? carwale_extractor_1.CarWaleExtractor.extractVariantData(url)
            : cardekho_extractor_1.CarDekhoExtractor.extractVariantData(url);
    }
    static async previewCarImport(url, userId) {
        const source = this.detectSource(url);
        // Extract data from URL
        const extracted = await this.extractCarData(url);
        // Check for existing car with same slug
        const existingCar = await car_model_1.Car.findOne({
            slug: extracted.slug,
            is_deleted: false
        });
        // Match fields
        const matched = {};
        const unmatched = [];
        // Match brand
        const brandMatch = await this.matchBrand(extracted.brand);
        if (brandMatch) {
            matched['brand'] = {
                field: 'brand',
                value: brandMatch.brand_id,
                matchType: 'exact',
                confidence: 1,
                matched_key: brandMatch.name,
            };
        }
        else {
            unmatched.push('brand');
        }
        // Match body type
        const bodyTypeMatch = await this.matchBodyType(extracted.body_type || '');
        if (bodyTypeMatch) {
            matched['body_type'] = {
                field: 'body_type',
                value: bodyTypeMatch.body_type_id,
                matchType: 'exact',
                confidence: 1,
                matched_key: bodyTypeMatch.name,
            };
        }
        else {
            unmatched.push('body_type');
        }
        // Match fuel type
        const fuelTypeMatch = await this.matchFuelType(extracted.fuel_type || '');
        if (fuelTypeMatch) {
            matched['fuel_type'] = {
                field: 'fuel_type',
                value: fuelTypeMatch.fuel_type_id,
                matchType: 'exact',
                confidence: 1,
                matched_key: fuelTypeMatch.name,
            };
        }
        else {
            unmatched.push('fuel_type');
        }
        // Check if electric
        const isElectric = extracted.fuel_type?.toLowerCase().includes('electric') || false;
        matched['is_electric'] = {
            field: 'is_electric',
            value: isElectric,
            matchType: 'exact',
            confidence: 1,
        };
        const warnings = [];
        if (unmatched.length > 0) {
            warnings.push(`Some fields could not be automatically matched: ${unmatched.join(', ')}`);
        }
        if (existingCar) {
            warnings.push(`A car with similar name already exists: ${existingCar.name}`);
        }
        // Create import log
        const import_id = (0, uuid_1.v4)();
        await import_log_model_1.ImportLog.create({
            import_id,
            source,
            import_type: 'car',
            source_url: url,
            status: 'previewed',
            extracted_data: extracted,
            matched_data: matched,
            unmatched_data: { unmatched },
            warnings,
            created_by: userId,
        });
        return {
            success: true,
            source,
            type: 'car',
            url,
            extracted,
            matched,
            unmatched,
            warnings,
            existing_car: existingCar ? {
                car_id: existingCar.car_id,
                name: existingCar.name,
                slug: existingCar.slug,
            } : undefined,
        };
    }
    static async saveCarImport(payload, userId) {
        const { url, mode, car_id, data, unmatched_data } = payload;
        // Clean null values from data
        const cleanData = Object.fromEntries(Object.entries(data).filter(([_, value]) => value !== null));
        let car;
        if (mode === 'create') {
            // Check for duplicate slug
            const existingSlug = await car_model_1.Car.findOne({
                slug: data.slug,
                is_deleted: false
            });
            if (existingSlug) {
                throw new app_error_util_1.AppError(`Car with slug '${data.slug}' already exists. Use update or merge mode instead.`, 409);
            }
            car = await car_model_1.Car.create({
                car_id: (0, uuid_1.v4)(),
                ...cleanData,
                is_deleted: false,
            });
            // Update import log
            await import_log_model_1.ImportLog.findOneAndUpdate({ source_url: url, created_by: userId }, {
                status: 'saved',
                car_id: car.car_id,
                matched_data: data,
            });
        }
        else if (mode === 'update' || mode === 'merge') {
            if (!car_id) {
                throw new app_error_util_1.AppError('car_id is required for update/merge mode', 400);
            }
            const existingCar = await car_model_1.Car.findOne({
                car_id,
                is_deleted: false
            });
            if (!existingCar) {
                throw new app_error_util_1.AppError('Car not found', 404);
            }
            const updateData = {};
            if (mode === 'update') {
                // Update all provided fields (excluding nulls)
                Object.assign(updateData, cleanData);
            }
            else {
                // Merge mode: only fill empty fields (excluding nulls)
                if (!existingCar.name && cleanData.name)
                    updateData.name = cleanData.name;
                if (!existingCar.description && cleanData.description)
                    updateData.description = cleanData.description;
                if (!existingCar.exshowroom_price && cleanData.exshowroom_price !== undefined)
                    updateData.exshowroom_price = cleanData.exshowroom_price;
                if (!existingCar.expected_exshowroom_price && cleanData.expected_exshowroom_price !== undefined)
                    updateData.expected_exshowroom_price = cleanData.expected_exshowroom_price;
            }
            car = await car_model_1.Car.findOneAndUpdate({ car_id, is_deleted: false }, updateData, { returnDocument: 'after' });
            // Update import log
            await import_log_model_1.ImportLog.findOneAndUpdate({ source_url: url, created_by: userId }, {
                status: 'saved',
                car_id: car?.car_id,
                matched_data: updateData,
            });
        }
        return {
            success: true,
            car_id: car?.car_id || '',
            warnings: [],
            errors: [],
        };
    }
    static async previewVariantImport(carId, urls, userId) {
        const items = [];
        const warnings = [];
        // Verify car exists
        const car = await car_model_1.Car.findOne({ car_id: carId, is_deleted: false });
        if (!car) {
            throw new app_error_util_1.AppError('Car not found', 404, {
                userMessage: errorMessages_1.USER_MESSAGES.CAR_NOT_FOUND,
                errorCode: errorMessages_1.ERROR_CODES.CAR_NOT_FOUND,
                details: {
                    field: 'car_id',
                    reason: 'The car does not exist or has been deleted.',
                },
            });
        }
        // Batch fetch all variants for the car to avoid N findOne queries in loop
        const existingVariants = await car_variant_model_1.CarVariant.find({
            car_id: carId,
            is_deleted: false,
        }).lean();
        // Build a lookup map for O(1) variant lookups in loop
        const variantsBySlug = new Map(existingVariants.map((v) => [v.slug, v]));
        for (const url of urls) {
            const source = this.detectSource(url);
            try {
                const extracted = await this.extractVariantData(url);
                // Check for existing variant using in-memory lookup
                const variantSlug = extracted.variant_name.toLowerCase().replace(/\s+/g, '-');
                const existingVariant = variantsBySlug.get(variantSlug);
                // Match specs
                const { matched, unmatched } = await key_matcher_1.KeyMatcher.matchSpecs(extracted.specs);
                const itemWarnings = [];
                // Resolve fuel type conflict: check if specs contain conflicting fuel type
                const specFuelType = matched.find(m => m.matched_key_name === 'fuel_type');
                let resolvedFuelType = extracted.fuel_type || '';
                if (specFuelType && resolvedFuelType) {
                    const normalizedTopLevel = resolvedFuelType.toLowerCase().trim();
                    const normalizedSpec = specFuelType.source_value.toLowerCase().trim();
                    // If they conflict, prefer top-level (more reliable) and add warning
                    if (normalizedTopLevel !== normalizedSpec &&
                        !normalizedTopLevel.includes(normalizedSpec) &&
                        !normalizedSpec.includes(normalizedTopLevel)) {
                        itemWarnings.push(`Fuel type conflict: top-level is '${resolvedFuelType}' but specs show '${specFuelType.source_value}'. Using top-level value.`);
                    }
                }
                // Match fuel type
                const fuelTypeMatch = await this.matchFuelType(resolvedFuelType);
                const fuelTypeMatched = {
                    field: 'fuel_type',
                    value: fuelTypeMatch?.fuel_type_id || '',
                    matchType: (fuelTypeMatch ? 'exact' : 'unmatched'),
                    confidence: fuelTypeMatch ? 1 : 0,
                    matched_key: fuelTypeMatch?.name,
                };
                // Normalize transmission
                const normalizedTransmission = this.normalizeTransmission(extracted.transmission || '');
                // Map matched specs to specs_normalized and specs_raw structures
                const { specs_normalized, specs_raw } = key_matcher_1.KeyMatcher.mapMatchedSpecsToSpecsNormalized(matched);
                // Log key matching results for debugging
                const keyMapping = matched.map(m => ({
                    extracted: m.source_label,
                    mapped_to: m.matched_key_name,
                    path: m.suggested_path,
                    match_type: m.matchType,
                }));
                const unmatchedKeys = unmatched.map(u => ({
                    extracted: u.source_label,
                    value: u.source_value,
                    suggested_slug: u.suggested_slug,
                }));
                // Define expected model keys for variants
                const expectedVariantKeys = [
                    'variant_name', 'slug', 'model_year', 'fuel_type_id', 'transmission_type',
                    'drivetrain', 'seating_capacity', 'ex_showroom_price', 'expected_price',
                    'is_upcoming', 'specs_normalized', 'specs_raw', 'is_published'
                ];
                // Extract keys from the extracted data
                const extractedTopLevelKeys = Object.keys(extracted);
                const missingRequiredKeys = expectedVariantKeys.filter(k => !extractedTopLevelKeys.includes(k) &&
                    !['variant_name', 'fuel_type', 'transmission', 'price'].includes(k));
                if (unmatched.length > 0) {
                    itemWarnings.push(`${unmatched.length} specs could not be matched`);
                }
                if (matched.some(m => m.matchType === 'fuzzy')) {
                    itemWarnings.push('Some specs have fuzzy matches and need confirmation');
                }
                if (!fuelTypeMatch) {
                    itemWarnings.push(`Fuel type '${extracted.fuel_type}' could not be matched`);
                }
                if (!normalizedTransmission) {
                    itemWarnings.push(`Transmission '${extracted.transmission}' could not be normalized to valid type`);
                }
                // Spec contradiction check — flag at preview so user can review before saving.
                const specValidation = (0, spec_validator_1.validateVariantSpecs)({
                    fuel_type_name: resolvedFuelType,
                    specs_normalized: specs_normalized,
                    specs_raw,
                });
                for (const err of specValidation.errors) {
                    itemWarnings.push(`[Spec conflict] ${err.message}`);
                }
                if (existingVariant) {
                    itemWarnings.push(`Variant with similar name already exists: ${existingVariant.variant_name}`);
                }
                items.push({
                    url,
                    extracted,
                    matched_specs: matched,
                    unmatched_specs: unmatched,
                    warnings: itemWarnings,
                    matched_fuel_type: fuelTypeMatched,
                    normalized_transmission: normalizedTransmission,
                    specs_normalized,
                    specs_raw,
                    existing_variant: existingVariant ? {
                        variant_id: existingVariant.variant_id,
                        variant_name: existingVariant.variant_name,
                        slug: existingVariant.slug,
                    } : undefined,
                });
                // Create import log for each variant
                await import_log_model_1.ImportLog.create({
                    import_id: (0, uuid_1.v4)(),
                    source,
                    import_type: 'variant',
                    source_url: url,
                    car_id: carId,
                    status: 'previewed',
                    extracted_data: extracted,
                    matched_data: { matched, fuel_type: fuelTypeMatched, specs_normalized, specs_raw },
                    unmatched_data: { unmatched },
                    warnings: itemWarnings,
                    created_by: userId,
                });
            }
            catch (error) {
                warnings.push(`Failed to extract data from ${url}: ${error.message}`);
            }
        }
        // All URLs in one batch should be from the same source — use first URL's source for the response.
        const batchSource = urls.length > 0 ? this.detectSource(urls[0]) : 'cardekho';
        return {
            success: true,
            source: batchSource,
            type: 'variants',
            car_id: carId,
            items,
            warnings,
        };
    }
    static async saveVariantImport(payload, userId) {
        const { car_id, mode, items } = payload;
        const variantIds = [];
        const warnings = [];
        const errors = [];
        // Verify car exists
        const car = await car_model_1.Car.findOne({ car_id, is_deleted: false });
        if (!car) {
            throw new app_error_util_1.AppError(`Car not found for car_id: ${car_id}`, 404, {
                userMessage: errorMessages_1.USER_MESSAGES.CAR_NOT_FOUND,
                errorCode: errorMessages_1.ERROR_CODES.CAR_NOT_FOUND,
                details: {
                    field: 'car_id',
                    reason: 'The car does not exist or has been deleted.',
                },
            });
        }
        // Batch fetch all existing variants and fuel types before loop to avoid N+1
        const [existingVariants, allFuelTypes] = await Promise.all([
            car_variant_model_1.CarVariant.find({ car_id, is_deleted: false }).lean(),
            fuel_type_model_1.FuelType.find({ is_deleted: false }).lean(),
        ]);
        // Create maps for O(1) lookups
        const variantSlugSet = new Set(existingVariants.map((v) => v.slug));
        const fuelTypeMap = new Map(allFuelTypes.map((ft) => [ft.fuel_type_id, ft]));
        // Separate processing for create and update modes
        const createPayloads = [];
        const updateOps = [];
        const importLogOps = [];
        for (const item of items) {
            // Enhance variant data with normalization before processing
            item.data = await this.enhanceVariantWithNormalization(item.data, item.data.fuel_type_id);
            try {
                // Clean null values from item data
                const cleanItemData = Object.fromEntries(Object.entries(item.data).filter(([_, value]) => value !== null));
                let variant;
                if (mode === 'create') {
                    // Check for duplicate slug using in-memory set
                    if (variantSlugSet.has(item.data.slug)) {
                        warnings.push(`Variant with slug '${item.data.slug}' already exists. Skipping.`);
                        continue;
                    }
                    // Build the correct save payload with proper field mapping
                    // Explicitly cast values to satisfy TypeScript
                    // Hard-fail on impossible fuel-type / spec combinations.
                    const fuelTypeIdStr = typeof cleanItemData.fuel_type_id === 'string' ? cleanItemData.fuel_type_id : undefined;
                    const fuelTypeForValidation = fuelTypeIdStr
                        ? fuelTypeMap.get(fuelTypeIdStr)?.name
                        : undefined;
                    const specValidation = (0, spec_validator_1.validateVariantSpecs)({
                        fuel_type_name: fuelTypeForValidation,
                        specs_normalized: cleanItemData.specs_normalized,
                        specs_raw: cleanItemData.specs_raw,
                    });
                    if (!specValidation.valid) {
                        const msg = specValidation.errors.map(e => e.message).join('; ');
                        errors.push(`Spec conflict in ${item.url}: ${msg}`);
                        continue;
                    }
                    // Generate SEO tags from derived flags in specs_raw.
                    const generatedTags = seo_tag_generator_service_1.SEOTagGeneratorService.generateTagsFromDerivedFlags(cleanItemData.specs_raw);
                    const bestForTags = seo_tag_generator_service_1.SEOTagGeneratorService.mergeTags(cleanItemData.best_for_tags, generatedTags);
                    const variantId = (0, uuid_1.v4)();
                    let variantPayload = {
                        variant_id: variantId,
                        car_id: car_id,
                        variant_name: String(cleanItemData.name || cleanItemData.variant_name || ''),
                        slug: String(cleanItemData.slug || ''),
                        model_year: Number(cleanItemData.model_year || new Date().getFullYear()),
                        fuel_type_id: cleanItemData.fuel_type_id ? String(cleanItemData.fuel_type_id) : undefined,
                        transmission_type: cleanItemData.transmission_type ? String(cleanItemData.transmission_type) : undefined,
                        drivetrain: cleanItemData.drivetrain ? String(cleanItemData.drivetrain) : undefined,
                        seating_capacity: cleanItemData.seating_capacity ? Number(cleanItemData.seating_capacity) : undefined,
                        ex_showroom_price: cleanItemData.ex_showroom_price !== undefined ? Number(cleanItemData.ex_showroom_price) : undefined,
                        expected_price: cleanItemData.expected_price !== undefined ? Number(cleanItemData.expected_price) : undefined,
                        expected_launch_date: cleanItemData.expected_launch_date && (typeof cleanItemData.expected_launch_date === 'string' || typeof cleanItemData.expected_launch_date === 'number') ? new Date(cleanItemData.expected_launch_date) : undefined,
                        is_upcoming: Boolean(cleanItemData.is_upcoming || false),
                        specs_normalized: cleanItemData.specs_normalized && typeof cleanItemData.specs_normalized === 'object' && !Array.isArray(cleanItemData.specs_normalized) ? cleanItemData.specs_normalized : undefined,
                        specs_raw: cleanItemData.specs_raw && typeof cleanItemData.specs_raw === 'object' && !Array.isArray(cleanItemData.specs_raw) ? cleanItemData.specs_raw : undefined,
                        best_for_tags: bestForTags,
                        hidden_spec_keys: Array.isArray(cleanItemData.hidden_spec_keys) ? cleanItemData.hidden_spec_keys : [],
                        is_published: Boolean(cleanItemData.is_published || false),
                        is_deleted: false,
                        // Powertrain detection flags (from normalization engine)
                        has_engine: cleanItemData.has_engine !== undefined ? Boolean(cleanItemData.has_engine) : false,
                        has_battery: cleanItemData.has_battery !== undefined ? Boolean(cleanItemData.has_battery) : false,
                        has_motor: cleanItemData.has_motor !== undefined ? Boolean(cleanItemData.has_motor) : false,
                        has_external_charging: cleanItemData.has_external_charging !== undefined ? Boolean(cleanItemData.has_external_charging) : false,
                        powertrain_detection_confidence: cleanItemData.powertrain_detection_confidence !== undefined ? Number(cleanItemData.powertrain_detection_confidence) : 0,
                    };
                    // Auto-convert types to match CarVariant schema requirements
                    variantPayload = this.convertSpecsTypes(variantPayload);
                    // Queue bulk insert instead of individual create
                    createPayloads.push({
                        insertOne: { document: variantPayload },
                        url: item.url,
                        data: item.data,
                        unmatched_specs: item.unmatched_specs,
                    });
                    variantIds.push(variantId);
                    variantSlugSet.add(item.data.slug); // Add to in-memory set to prevent duplicates in batch
                }
                else if (mode === 'update' || mode === 'merge') {
                    if (!item.variant_id) {
                        warnings.push(`variant_id is required for update/merge mode. Skipping ${item.url}`);
                        continue;
                    }
                    // Find existing variant from pre-fetched batch
                    const existingVariant = existingVariants.find((v) => v.variant_id === item.variant_id);
                    if (!existingVariant) {
                        warnings.push(`Variant not found: ${item.variant_id}. Skipping ${item.url}`);
                        continue;
                    }
                    // For update/merge, we still need the full document for change tracking (not lean)
                    // Fetch it now if needed for change history recording
                    const fullVariant = mode === 'update' || mode === 'merge'
                        ? await car_variant_model_1.CarVariant.findOne({ variant_id: item.variant_id, car_id, is_deleted: false })
                        : null;
                    const beforeDoc = fullVariant?.toObject() || existingVariant;
                    const updateData = {};
                    if (mode === 'update') {
                        // Map fields correctly: 'name' from frontend -> 'variant_name' in model
                        if (cleanItemData.name !== undefined)
                            updateData.variant_name = cleanItemData.name;
                        if (cleanItemData.slug !== undefined)
                            updateData.slug = cleanItemData.slug;
                        if (cleanItemData.model_year !== undefined)
                            updateData.model_year = cleanItemData.model_year;
                        if (cleanItemData.fuel_type_id !== undefined)
                            updateData.fuel_type_id = cleanItemData.fuel_type_id;
                        if (cleanItemData.transmission_type !== undefined)
                            updateData.transmission_type = cleanItemData.transmission_type;
                        if (cleanItemData.drivetrain !== undefined)
                            updateData.drivetrain = cleanItemData.drivetrain;
                        if (cleanItemData.seating_capacity !== undefined)
                            updateData.seating_capacity = cleanItemData.seating_capacity;
                        if (cleanItemData.ex_showroom_price !== undefined)
                            updateData.ex_showroom_price = cleanItemData.ex_showroom_price;
                        if (cleanItemData.expected_price !== undefined)
                            updateData.expected_price = cleanItemData.expected_price;
                        if (cleanItemData.expected_launch_date !== undefined)
                            updateData.expected_launch_date = cleanItemData.expected_launch_date;
                        if (cleanItemData.is_upcoming !== undefined)
                            updateData.is_upcoming = cleanItemData.is_upcoming;
                        if (cleanItemData.specs_normalized !== undefined)
                            updateData.specs_normalized = cleanItemData.specs_normalized;
                        if (cleanItemData.specs_raw !== undefined)
                            updateData.specs_raw = cleanItemData.specs_raw;
                        if (cleanItemData.hidden_spec_keys !== undefined)
                            updateData.hidden_spec_keys = cleanItemData.hidden_spec_keys;
                        if (cleanItemData.is_published !== undefined)
                            updateData.is_published = cleanItemData.is_published;
                        // Powertrain flags from normalization (always update if available)
                        if (cleanItemData.has_engine !== undefined)
                            updateData.has_engine = Boolean(cleanItemData.has_engine);
                        if (cleanItemData.has_battery !== undefined)
                            updateData.has_battery = Boolean(cleanItemData.has_battery);
                        if (cleanItemData.has_motor !== undefined)
                            updateData.has_motor = Boolean(cleanItemData.has_motor);
                        if (cleanItemData.has_external_charging !== undefined)
                            updateData.has_external_charging = Boolean(cleanItemData.has_external_charging);
                        if (cleanItemData.powertrain_detection_confidence !== undefined)
                            updateData.powertrain_detection_confidence = Number(cleanItemData.powertrain_detection_confidence);
                    }
                    else {
                        // Merge mode: only fill empty fields (excluding nulls)
                        if (!existingVariant.variant_name && cleanItemData.name)
                            updateData.variant_name = cleanItemData.name;
                        if (!existingVariant.ex_showroom_price && cleanItemData.ex_showroom_price !== undefined)
                            updateData.ex_showroom_price = cleanItemData.ex_showroom_price;
                        if (!existingVariant.expected_price && cleanItemData.expected_price !== undefined)
                            updateData.expected_price = cleanItemData.expected_price;
                        if (!existingVariant.fuel_type_id && cleanItemData.fuel_type_id)
                            updateData.fuel_type_id = cleanItemData.fuel_type_id;
                        if (!existingVariant.transmission_type && cleanItemData.transmission_type)
                            updateData.transmission_type = cleanItemData.transmission_type;
                        if (cleanItemData.specs_normalized) {
                            // Use source priority merge for specs in merge mode
                            const existingMetadata = existingVariant.specs_metadata || {};
                            const incomingMetadata = {};
                            // Build metadata for each incoming spec field
                            for (const [key, value] of Object.entries(cleanItemData.specs_normalized)) {
                                incomingMetadata[key] = field_source_metadata_1.MetadataBuilder.fromImportSource(value, item.url || 'import', 85);
                            }
                            const mergeResult = field_source_metadata_1.SourcePriorityMerge.mergeVariantSpecs(existingVariant.specs_normalized || {}, existingMetadata, cleanItemData.specs_normalized, incomingMetadata);
                            updateData.specs_normalized = mergeResult.merged;
                            updateData.specs_metadata = mergeResult.mergedMetadata;
                        }
                        // Powertrain flags in merge mode: only update if not already set
                        if (cleanItemData.has_engine !== undefined && !existingVariant.has_engine)
                            updateData.has_engine = Boolean(cleanItemData.has_engine);
                        if (cleanItemData.has_battery !== undefined && !existingVariant.has_battery)
                            updateData.has_battery = Boolean(cleanItemData.has_battery);
                        if (cleanItemData.has_motor !== undefined && !existingVariant.has_motor)
                            updateData.has_motor = Boolean(cleanItemData.has_motor);
                        if (cleanItemData.has_external_charging !== undefined && !existingVariant.has_external_charging)
                            updateData.has_external_charging = Boolean(cleanItemData.has_external_charging);
                        if (cleanItemData.powertrain_detection_confidence !== undefined) {
                            const newConfidence = Number(cleanItemData.powertrain_detection_confidence);
                            if (!existingVariant.powertrain_detection_confidence || newConfidence > (existingVariant.powertrain_detection_confidence || 0)) {
                                updateData.powertrain_detection_confidence = newConfidence;
                            }
                        }
                    }
                    // Auto-convert types to match CarVariant schema requirements
                    if (updateData.specs_normalized) {
                        updateData.specs_normalized = this.convertObjectTypes(updateData.specs_normalized);
                    }
                    // Regenerate SEO tags from updated/merged specs_raw.
                    const finalSpecsRaw = updateData.specs_raw || existingVariant.specs_raw;
                    const updatedGeneratedTags = seo_tag_generator_service_1.SEOTagGeneratorService.generateTagsFromDerivedFlags(finalSpecsRaw);
                    const updatedBestForTags = seo_tag_generator_service_1.SEOTagGeneratorService.mergeTags(updateData.best_for_tags || existingVariant.best_for_tags, updatedGeneratedTags);
                    if (updatedBestForTags.length > 0) {
                        updateData.best_for_tags = updatedBestForTags;
                    }
                    // Queue bulk update instead of individual findOneAndUpdate
                    updateOps.push({
                        updateOne: {
                            filter: { variant_id: item.variant_id, car_id, is_deleted: false },
                            update: { $set: updateData },
                        },
                        variant_id: item.variant_id,
                        beforeDoc,
                        url: item.url,
                        data: updateData,
                        unmatched_specs: item.unmatched_specs,
                    });
                    variantIds.push(item.variant_id);
                }
            }
            catch (error) {
                errors.push(`Failed to save variant from ${item.url}: ${error.message}`);
            }
        }
        // Execute all bulk creates at once
        if (createPayloads.length > 0) {
            try {
                const bulkCreateOps = createPayloads.map(p => ({
                    insertOne: { document: p.insertOne.document }
                }));
                await car_variant_model_1.CarVariant.bulkWrite(bulkCreateOps);
                // Update import logs for all created variants in parallel
                await Promise.all(createPayloads.map(p => import_log_model_1.ImportLog.findOneAndUpdate({ source_url: p.url, created_by: userId }, {
                    status: 'saved',
                    variant_id: p.insertOne.document.variant_id,
                    matched_data: p.data,
                    unmatched_data: { unmatched_specs: p.unmatched_specs },
                }).catch(err => {
                    console.warn(`Failed to update import log for ${p.url}: ${err?.message}`);
                })));
            }
            catch (err) {
                errors.push(`Failed to batch create variants: ${err?.message}`);
            }
        }
        // Execute all bulk updates at once
        if (updateOps.length > 0) {
            try {
                const bulkUpdateOps = updateOps.map(op => ({
                    updateOne: op.updateOne
                }));
                await car_variant_model_1.CarVariant.bulkWrite(bulkUpdateOps);
                // Fetch updated variants for change history recording (in parallel)
                const updatePromises = updateOps.map(async (op) => {
                    try {
                        const updatedVariant = await car_variant_model_1.CarVariant.findOne({
                            variant_id: op.variant_id,
                            car_id,
                            is_deleted: false
                        });
                        if (updatedVariant) {
                            await variant_integrity_service_1.VariantIntegrityService.recordVariantChanges(op.variant_id, op.beforeDoc, updatedVariant.toObject(), op.url || 'import', 'import').catch(err => {
                                console.warn(`Failed to record change history for variant ${op.variant_id}: ${err?.message}`);
                            });
                        }
                        // Update import log
                        return import_log_model_1.ImportLog.findOneAndUpdate({ source_url: op.url, created_by: userId }, {
                            status: 'saved',
                            variant_id: op.variant_id,
                            matched_data: op.data,
                            unmatched_data: { unmatched_specs: op.unmatched_specs },
                        }).catch(err => {
                            console.warn(`Failed to update import log for ${op.url}: ${err?.message}`);
                        });
                    }
                    catch (err) {
                        console.warn(`Failed to process update for variant ${op.variant_id}: ${err?.message}`);
                    }
                });
                await Promise.all(updatePromises);
            }
            catch (err) {
                errors.push(`Failed to batch update variants: ${err?.message}`);
            }
        }
        // Bulk import skips the per-write recompute hooks the CRUD path uses, so the
        // parent car's denormalised aggregates (variant_count, min/max price,
        // engine_options, feature_availability, AI intelligence flags, etc.) stay
        // stale until the next single-variant edit. Recompute once at the end via
        // the full aggregation engine — the import is scoped to a single car_id,
        // so this is one hop, not N.
        if (variantIds.length > 0) {
            try {
                await car_aggregation_service_1.CarAggregationService.recomputeFullAggregates(car_id);
            }
            catch (err) {
                warnings.push(`Saved ${variantIds.length} variant(s) but failed to refresh car aggregates: ${err?.message ?? err}. Run /cars/admin/recompute-aggregates to fix.`);
            }
            // Phase 5: Auto-wire SEO connections for enabled features
            try {
                // Wire created variants
                for (const payload of createPayloads) {
                    if (payload.insertOne.document.specs_normalized) {
                        await seo_auto_wiring_service_1.SEOAutoWiringService.autoWireVariant(payload.insertOne.document.variant_id, car_id, payload.insertOne.document.specs_normalized);
                    }
                }
                // Wire updated variants
                for (const op of updateOps) {
                    const variant = await car_variant_model_1.CarVariant.findOne({ variant_id: op.variant_id, is_deleted: false });
                    if (variant?.specs_normalized) {
                        await seo_auto_wiring_service_1.SEOAutoWiringService.autoWireVariant(op.variant_id, car_id, variant.specs_normalized);
                    }
                }
            }
            catch (err) {
                warnings.push(`Saved variants but failed to auto-wire SEO connections: ${err?.message ?? err}. Manual SEO setup may be needed.`);
            }
        }
        return {
            success: errors.length === 0,
            variant_ids: variantIds,
            warnings,
            errors,
        };
    }
    static async matchBrand(brandName) {
        const normalized = brandName.toLowerCase().replace(/\s+/g, '');
        return await brand_model_1.Brand.findOne({
            is_deleted: false,
            $or: [
                { name: { $regex: brandName, $options: 'i' } },
                { slug: normalized },
            ]
        });
    }
    static async matchBodyType(bodyTypeName) {
        if (!bodyTypeName)
            return null;
        const normalized = bodyTypeName.toLowerCase().replace(/\s+/g, '');
        return await body_type_model_1.BodyType.findOne({
            is_deleted: false,
            $or: [
                { name: { $regex: bodyTypeName, $options: 'i' } },
                { slug: normalized },
            ]
        });
    }
    static async matchFuelType(fuelTypeName) {
        if (!fuelTypeName)
            return null;
        const normalized = fuelTypeName.toLowerCase().replace(/\s+/g, '');
        return await fuel_type_model_1.FuelType.findOne({
            is_deleted: false,
            $or: [
                { name: { $regex: fuelTypeName, $options: 'i' } },
                { slug: normalized },
            ]
        });
    }
    static normalizeTransmission(transmission) {
        if (!transmission)
            return null;
        const normalized = transmission.toLowerCase().trim();
        // Direct matches
        if (normalized === 'manual')
            return 'manual';
        if (normalized === 'automatic')
            return 'automatic';
        if (normalized === 'cvt')
            return 'cvt';
        if (normalized === 'dct')
            return 'dct';
        if (normalized === 'amt')
            return 'amt';
        if (normalized === 'dsg')
            return 'dsg';
        if (normalized === 'imt')
            return 'imt';
        if (normalized === 'e-cvt' || normalized === 'ecvt')
            return 'e_cvt';
        if (normalized === 'torque converter')
            return 'torque_converter';
        if (normalized === 'single speed' || normalized === 'single-speed' || normalized === 'single speed ev')
            return 'single_speed_ev';
        // Fuzzy matches — order matters: check specific (DSG/iMT/e-CVT/EV) before
        // generic (manual/automatic) so "DSG (auto)" doesn't degrade to 'automatic'.
        if (normalized.includes('dsg'))
            return 'dsg';
        if (normalized.includes('imt') || normalized.includes('intelligent manual'))
            return 'imt';
        if (normalized.includes('e-cvt') || normalized.includes('ecvt'))
            return 'e_cvt';
        if (normalized.includes('torque converter'))
            return 'torque_converter';
        if (normalized.includes('single speed') || normalized.includes('single-speed') || normalized.includes('reduction gear'))
            return 'single_speed_ev';
        if (normalized.includes('dct') || normalized.includes('dual clutch') || normalized.includes('dual-clutch'))
            return 'dct';
        if (normalized.includes('amt') || normalized.includes('automated manual'))
            return 'amt';
        if (normalized.includes('cvt') || normalized.includes('continuously variable'))
            return 'cvt';
        if (normalized.includes('manual'))
            return 'manual';
        if (normalized.includes('automatic') || normalized.includes('auto'))
            return 'automatic';
        return null;
    }
    static convertSpecsTypes(payload) {
        if (!payload.specs_normalized) {
            return payload;
        }
        const converted = { ...payload };
        converted.specs_normalized = this.convertObjectTypes(payload.specs_normalized);
        return converted;
    }
    static convertObjectTypes(obj) {
        if (!obj || typeof obj !== 'object') {
            return obj;
        }
        const converted = {};
        // Known boolean fields in CarVariant schema
        const booleanFields = [
            'turbocharger',
            'led_headlights',
            'led_tail_lights',
            'drl',
            'alloy_wheels',
            'panoramic_sunroof',
            'moonroof',
            'rear_sunblind',
            'digital_driver_display',
            'ambient_lighting',
            'abs',
            'ebd',
            'brake_assist',
            'esp',
            'traction_control',
            'hill_hold',
            'hill_descent',
            'rear_camera',
            'camera_360',
            'isofix',
            'seat_belt_warning',
            'speed_alert',
            'crash_sensor',
            'engine_immobilizer',
            'central_locking',
            'child_safety_lock',
            'automatic_climate_control',
            'air_quality_control',
            'rear_ac_vents',
            'steering_mounted_controls',
            'cruise_control',
            'paddle_shifters',
            'remote_start',
            'keyless_entry',
            'push_button_start',
            'rear_window_defogger',
            'rear_wiper',
            'headlamp_washer',
            'cooled_glovebox',
            'android_auto',
            'apple_carplay',
            'bluetooth',
            'wireless_charging',
            'navigation',
            'voice_command',
            'wifi_hotspot',
            'internet_connectivity',
            'ota_updates',
            'app_connectivity',
            'vehicle_tracking',
            'geofencing',
            'remote_vehicle_control',
            'sos_emergency_assist',
            'adaptive_cruise_control',
            'lane_keep_assist',
            'lane_departure_warning',
            'blind_spot_monitoring',
            'forward_collision_warning',
            'automatic_emergency_braking',
            'traffic_sign_recognition',
            'autonomous_emergency_braking',
            'roof_rails',
            'spoiler',
            'skid_plate',
        ];
        // Known number fields in CarVariant schema
        const numberFields = [
            'cylinders',
            'valves_per_cylinder',
            'seating_capacity',
            'doors',
            'airbags',
            'usb_ports',
            'speakers',
            'basic_warranty_years',
            'basic_warranty_km',
            'battery_warranty_years',
            'battery_warranty_km',
        ];
        for (const key in obj) {
            const value = obj[key];
            // Handle nested objects recursively
            if (value && typeof value === 'object' && !Array.isArray(value)) {
                converted[key] = this.convertObjectTypes(value);
            }
            else {
                // Convert boolean fields
                if (booleanFields.includes(key)) {
                    converted[key] = this.convertToBoolean(value);
                }
                // Convert number fields
                else if (numberFields.includes(key)) {
                    converted[key] = this.convertToNumber(value);
                }
                // Keep as-is for other fields
                else {
                    converted[key] = value;
                }
            }
        }
        return converted;
    }
    static convertToBoolean(value) {
        if (value === null || value === undefined)
            return null;
        if (typeof value === 'boolean')
            return value;
        if (typeof value === 'string') {
            const lower = value.trim().toLowerCase();
            if (lower === 'yes' || lower === 'true' || lower === 'available' || lower === 'with' || lower === 'powered') {
                return true;
            }
            if (lower === 'no' || lower === 'false' || lower === 'not available' || lower === 'none' || lower === 'na') {
                return false;
            }
        }
        // Try to convert number to boolean
        if (typeof value === 'number') {
            return value !== 0;
        }
        return null;
    }
    static convertToNumber(value) {
        if (value === null || value === undefined)
            return null;
        if (typeof value === 'number')
            return value;
        if (typeof value === 'string') {
            const trimmed = value.trim();
            const numMatch = trimmed.match(/[\d.]+/);
            if (numMatch) {
                const num = parseFloat(numMatch[0]);
                return isNaN(num) ? null : num;
            }
        }
        return null;
    }
    /**
     * Enhance variant data with normalization and powertrain detection.
     * Phase 1: Normalize specs_raw → improved specs_normalized + set powertrain flags.
     */
    static async enhanceVariantWithNormalization(variantData, fuel_type_id) {
        try {
            const specs_raw = variantData.specs_raw;
            if (!specs_raw) {
                return variantData; // Nothing to normalize
            }
            // Get fuel_type slug for powertrain detection
            let fuel_type_slug = 'petrol'; // default
            if (fuel_type_id) {
                const fuelType = await fuel_type_model_1.FuelType.findOne({ fuel_type_id, is_deleted: false });
                if (fuelType?.slug) {
                    fuel_type_slug = fuelType.slug;
                }
            }
            // Run normalization engine on specs_raw
            const normalizationReport = import_normalizer_service_1.ImportNormalizerService.normalize(specs_raw);
            // Detect powertrain capabilities from normalized specs
            const powertrainFlags = powertrain_detector_service_1.PowertrainDetectorService.detect(normalizationReport.specs_normalized, fuel_type_slug);
            // Merge normalized specs with existing specs_normalized (use normalized as base)
            const mergedSpecs = {
                ...variantData.specs_normalized,
                ...normalizationReport.specs_normalized,
            };
            return {
                ...variantData,
                specs_normalized: mergedSpecs,
                has_engine: powertrainFlags.has_engine,
                has_battery: powertrainFlags.has_battery,
                has_motor: powertrainFlags.has_motor,
                has_external_charging: powertrainFlags.has_external_charging,
                powertrain_detection_confidence: powertrainFlags.confidence,
            };
        }
        catch (error) {
            // Log but don't fail — normalization is an enhancement, not a requirement
            console.warn(`Failed to enhance variant with normalization: ${error instanceof Error ? error.message : String(error)}`);
            return variantData;
        }
    }
    static async getImportLogs(userId, filter) {
        const query = { created_by: userId };
        if (filter?.status) {
            query.status = filter.status;
        }
        if (filter?.import_type) {
            query.import_type = filter.import_type;
        }
        return await import_log_model_1.ImportLog.find(query)
            .sort({ created_at: -1 })
            .limit(50);
    }
}
exports.ImportService = ImportService;
//# sourceMappingURL=import.service.js.map