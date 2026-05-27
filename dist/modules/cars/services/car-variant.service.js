"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CarVariantService = void 0;
const uuid_1 = require("uuid");
const errorMessages_1 = require("../../../constants/errorMessages");
const car_variant_model_1 = require("../../../models/car-variant.model");
const car_model_1 = require("../../../models/car.model");
const fuel_type_model_1 = require("../../../models/fuel-type.model");
const car_aggregation_service_1 = require("../../../shared/services/car-aggregation.service");
const mileage_recompute_service_1 = require("../../../shared/services/mileage-recompute.service");
const app_error_util_1 = require("../../../shared/utils/app-error.util");
const audit_util_1 = require("../../../shared/utils/audit.util");
const filter_util_1 = require("../../../shared/utils/filter.util");
const pagination_util_1 = require("../../../shared/utils/pagination.util");
const slug_util_1 = require("../../../shared/utils/slug.util");
const variant_integrity_service_1 = require("../../variants/services/variant-integrity.service");
const variant_response_transformer_1 = require("../../../shared/transformers/variant-response.transformer");
const import_normalizer_service_1 = require("../../imports/services/import-normalizer.service");
const powertrain_detector_service_1 = require("../../variants/services/powertrain-detector.service");
const seo_auto_wiring_service_1 = require("../../imports/services/seo-auto-wiring.service");
const FUEL_SPEC_RULES = {
    engine_performance: {
        engine_type: { hideFor: ['ev'] },
        displacement: { hideFor: ['ev'] },
        max_power: { hideFor: ['ev'] },
        max_torque: { hideFor: ['ev'] },
        cylinders: { hideFor: ['ev'] },
        valves_per_cylinder: { hideFor: ['ev'] },
        turbocharger: { hideFor: ['ev'] },
        fuel_system: { hideFor: ['ev'] },
        cng_power_torque: { hideFor: ['ice', 'ev', 'hybrid'] },
        electric_assist: { hideFor: ['ice', 'cng', 'ev'] },
        idle_start_stop: { hideFor: ['ev'] },
    },
    mileage_range: {
        arai_mileage: { hideFor: ['ev'] },
        real_mileage: { hideFor: ['ev'] },
        city_mileage: { hideFor: ['ev'] },
        highway_mileage: { hideFor: ['ev'] },
        fuel_tank_capacity: { hideFor: ['ev'] },
        emission_standard: { hideFor: ['ev'] },
        e20_compatibility: { hideFor: ['ev'] },
        cng_mileage: { hideFor: ['ice', 'ev', 'hybrid'] },
        cng_tank_capacity: { hideFor: ['ice', 'ev', 'hybrid'] },
    },
    battery_charging: {
        motor_type: { hideFor: ['ice', 'cng'] },
        motor_power_kw: { hideFor: ['ice', 'cng'] },
        motor_torque_nm: { hideFor: ['ice', 'cng'] },
        number_of_motors: { hideFor: ['ice', 'cng'] },
        ev_mode: { hideFor: ['ice', 'cng', 'ev'] },
        battery_wltp_km: { hideFor: ['ice', 'cng', 'hybrid'] },
        real_world_range: { hideFor: ['ice', 'cng'] },
        battery_capacity: { hideFor: ['ice', 'cng'] },
        battery_type: { hideFor: ['ice', 'cng'] },
        charging_port_type: { hideFor: ['ice', 'cng', 'hybrid'] },
        ac_charging_time: { hideFor: ['ice', 'cng', 'hybrid'] },
        dc_fast_charging_time: { hideFor: ['ice', 'cng', 'hybrid'] },
        fast_charge_0_80: { hideFor: ['ice', 'cng', 'hybrid'] },
        charging_time_7kw: { hideFor: ['ice', 'cng', 'hybrid'] },
        charging_time_50kw: { hideFor: ['ice', 'cng', 'hybrid'] },
        regenerative_braking: { hideFor: ['ice', 'cng'] },
    },
    dimensions_practicality: {
        frunk_space: { hideFor: ['ice', 'cng', 'hybrid'] },
    },
    suspension_steering_brakes: {},
    tyres_wheels: {},
    safety: {},
    adas: {},
    comfort_convenience: {},
    infotainment_connectivity: {},
    connected_car: {},
    interior: {},
    exterior: {},
    warranty: {
        battery_warranty_years: { hideFor: ['ice', 'cng'] },
        battery_warranty_km: { hideFor: ['ice', 'cng'] },
    },
    storage_cabin_practicality: {},
    driver_display_controls: {
        paddle_shifters: { hideFor: ['ev'] },
    },
};
// Fields whose value should be overridden for specific fuel types
const FUEL_VALUE_OVERRIDES = {};
// Transmission/gearbox overrides live at the variant top level, handled separately in the controller.
const normalizeFuel = (fuelNameOrSlug) => {
    const lower = (fuelNameOrSlug || '').toLowerCase();
    if (lower.includes('electric') || lower === 'ev' || lower === 'bev')
        return 'ev';
    if (lower.includes('cng') || lower.includes('natural gas') || lower.includes('compressed'))
        return 'cng';
    if (lower.includes('hybrid'))
        return 'hybrid';
    return 'ice';
};
class CarVariantService {
    static SECTION_NAME_TO_KEY_MAP = {
        'Engine & Performance': 'engine_performance',
        'Mileage / Range': 'mileage_range',
        'Battery & Charging': 'battery_charging',
        'Dimensions & Practicality': 'dimensions_practicality',
        'Suspension / Steering / Brakes': 'suspension_steering_brakes',
        'Tyres & Wheels': 'tyres_wheels',
        'Safety': 'safety',
        'ADAS': 'adas',
        'Comfort & Convenience': 'comfort_convenience',
        'Infotainment & Connectivity': 'infotainment_connectivity',
        'Connected Car': 'connected_car',
        'Interior': 'interior',
        'Exterior': 'exterior',
        'Warranty': 'warranty',
        'Storage & Cabin Practicality': 'storage_cabin_practicality',
        'Driver Display & Controls': 'driver_display_controls',
    };
    static removeHiddenSpecKeys(specs_normalized, hidden_spec_keys = []) {
        if (!specs_normalized || !hidden_spec_keys || hidden_spec_keys.length === 0) {
            return specs_normalized;
        }
        const result = JSON.parse(JSON.stringify(specs_normalized));
        hidden_spec_keys.forEach(keyPath => {
            const keys = keyPath.split('.');
            let current = result;
            for (let i = 0; i < keys.length - 1; i++) {
                if (current && current[keys[i]] !== undefined) {
                    current = current[keys[i]];
                }
                else {
                    return;
                }
            }
            if (current && current[keys[keys.length - 1]] !== undefined) {
                delete current[keys[keys.length - 1]];
            }
        });
        return result;
    }
    static removeHiddenSections(specs_normalized, hidden_sections) {
        const sectionsToHide = hidden_sections || [];
        if (!specs_normalized || sectionsToHide.length === 0) {
            return specs_normalized;
        }
        // Create shallow copy only if needed (more efficient than deep clone)
        const result = { ...specs_normalized };
        // Delete only the sections that need to be hidden
        for (const sectionName of sectionsToHide) {
            const key = this.SECTION_NAME_TO_KEY_MAP[sectionName];
            if (key && result[key]) {
                delete result[key];
            }
            else if (!key) {
                console.warn(`Unknown section name in hidden_sections: ${sectionName}`);
            }
        }
        return result;
    }
    // Step 1 — remove fields that should be hidden for the variant's fuel type.
    // fuel_type_ref may be a raw UUID string, a slug/name string, or a Mongoose-populated
    // object {name, slug} — all three are handled.
    static applyFuelTypeFilter(specs_normalized, fuel_type_ref) {
        if (!specs_normalized)
            return specs_normalized;
        let fuelIdentifier;
        if (typeof fuel_type_ref === 'string') {
            fuelIdentifier = fuel_type_ref;
        }
        else if (fuel_type_ref && typeof fuel_type_ref === 'object') {
            // Populated Mongoose document: prefer slug, fall back to name
            fuelIdentifier = fuel_type_ref.slug || fuel_type_ref.name || '';
        }
        else {
            fuelIdentifier = '';
        }
        const fuel = normalizeFuel(fuelIdentifier);
        const result = JSON.parse(JSON.stringify(specs_normalized));
        for (const sectionKey of Object.keys(FUEL_SPEC_RULES)) {
            const section = result[sectionKey];
            if (!section)
                continue;
            const fieldRules = FUEL_SPEC_RULES[sectionKey];
            for (const [fieldKey, rule] of Object.entries(fieldRules)) {
                if (rule.hideFor.includes(fuel)) {
                    delete section[fieldKey];
                }
            }
        }
        // Transmission-type forced values (top-level, not in specs_normalized)
        // These are handled in the controller as they're not inside specs_normalized.
        return result;
    }
    // Step 2 — remove null/undefined/empty keys from every section
    static removeEmptyValues(specs_normalized) {
        if (!specs_normalized)
            return specs_normalized;
        const result = {};
        for (const [sectionKey, section] of Object.entries(specs_normalized)) {
            if (!section || typeof section !== 'object')
                continue;
            const cleaned = {};
            for (const [k, v] of Object.entries(section)) {
                if (v !== null && v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0)) {
                    cleaned[k] = v;
                }
            }
            if (Object.keys(cleaned).length > 0) {
                result[sectionKey] = cleaned;
            }
        }
        return result;
    }
    // Step 3 — remove entire sections where all fields were removed by steps 1+2
    static autoHideEmptySections(specs_normalized) {
        if (!specs_normalized)
            return specs_normalized;
        const result = {};
        for (const [sectionKey, section] of Object.entries(specs_normalized)) {
            if (section && typeof section === 'object' && Object.keys(section).length > 0) {
                result[sectionKey] = section;
            }
        }
        return result;
    }
    static async getAllVariants(filterDto, includeDeleted = false) {
        try {
            const { page = 1, limit = 10, q, car_id, fuel_type_id, transmission_type, model_year, is_published, is_archived, is_deleted, min_price, max_price, min_model_year, max_model_year, sortBy = 'variant_name', sortOrder = 'asc', } = filterDto;
            const filter = {};
            if (is_deleted === 'true' || is_deleted === true) {
                filter.is_deleted = true;
            }
            else if (!includeDeleted) {
                filter.is_deleted = false;
            }
            // By default, exclude archived variants unless explicitly requested.
            // Accept boolean (from JSON callers) AND string ("true"/"false"/"all" from
            // query-string callers). Previously the boolean `false` fell through both
            // branches and silently disabled the filter — admins saw archived rows mixed
            // into the active list.
            if (is_archived === undefined || is_archived === false || is_archived === 'false') {
                filter.is_archived = false;
            }
            else if (is_archived === true || is_archived === 'true') {
                filter.is_archived = true;
            }
            // is_archived === 'all' → no filter applied (show both).
            if (is_published !== undefined) {
                filter.is_published = is_published;
            }
            if (car_id !== undefined) {
                filter.car_id = car_id;
            }
            if (fuel_type_id !== undefined) {
                filter.fuel_type_id = fuel_type_id;
            }
            if (transmission_type !== undefined) {
                filter.transmission_type = transmission_type;
            }
            // Model year range filter
            if (model_year !== undefined) {
                filter.model_year = model_year;
            }
            else {
                if (min_model_year !== undefined || max_model_year !== undefined) {
                    const yearFilter = {};
                    if (min_model_year !== undefined) {
                        yearFilter.$gte = Number(min_model_year);
                    }
                    if (max_model_year !== undefined) {
                        yearFilter.$lte = Number(max_model_year);
                    }
                    filter.model_year = yearFilter;
                }
            }
            // Price range filter
            const priceFilter = {};
            if (min_price !== undefined) {
                priceFilter.$gte = Number(min_price);
            }
            if (max_price !== undefined) {
                priceFilter.$lte = Number(max_price);
            }
            if (Object.keys(priceFilter).length > 0) {
                filter.$or = [
                    { ex_showroom_price: priceFilter },
                    { expected_price: priceFilter },
                ];
            }
            if (q) {
                const searchFilter = filter_util_1.FilterUtil.buildSearchFilter(['variant_name'], q);
                Object.assign(filter, searchFilter);
            }
            const { skip, limit: validatedLimit } = pagination_util_1.PaginationUtil.getPaginationParams(page, limit, { maxLimit: 500 });
            const sortFilter = filter_util_1.FilterUtil.buildSortFilter(sortBy, sortOrder);
            const variants = await car_variant_model_1.CarVariant.find(filter)
                .select('variant_id car_id variant_name slug model_year fuel_type_id transmission_type drivetrain seating_capacity ex_showroom_price expected_price is_published is_archived is_deleted is_upcoming is_featured variant_status publish_status market_status variant_rank trim_name edition_name created_at updated_at')
                .sort(sortFilter)
                .skip(skip)
                .limit(validatedLimit)
                .lean();
            const total = await car_variant_model_1.CarVariant.countDocuments(filter);
            const paginationMeta = pagination_util_1.PaginationUtil.createPaginationMeta(page, validatedLimit, total);
            return { variants, pagination: paginationMeta };
        }
        catch (error) {
            console.error('Error in getAllVariants:', error);
            throw new app_error_util_1.AppError('Failed to fetch variants', 500, {
                userMessage: errorMessages_1.USER_MESSAGES.INTERNAL_SERVER_ERROR,
                errorCode: errorMessages_1.ERROR_CODES.INTERNAL_SERVER_ERROR,
                details: {
                    reason: error instanceof Error ? error.message : 'Unknown error',
                },
            });
        }
    }
    static async getVariantById(variantId) {
        return await car_variant_model_1.CarVariant.findOne({ variant_id: variantId, is_deleted: false });
    }
    static async getVariantBySlug(slug) {
        return await car_variant_model_1.CarVariant.findOne({ slug, is_deleted: false });
    }
    // Returns variants grouped by parent car, paginating at the car level.
    // Counts (total/live/hidden/draft) reflect ALL non-deleted variants for the car,
    // independent of any applied filter — so the UI always shows the true picture.
    static async getGroupedVariants(filterDto) {
        const { page = 1, limit = 25, q, brand_id, body_type_id, fuel_type_id, transmission_type, is_archived, is_deleted, min_price, max_price, sortOrder = 'asc', } = filterDto;
        // Build variant match conditions as an $and array to support multiple $or clauses
        const conditions = [];
        if (is_deleted === 'true' || is_deleted === true) {
            conditions.push({ is_deleted: true });
        }
        else {
            conditions.push({ is_deleted: { $ne: true } });
        }
        if (is_archived === undefined || is_archived === false || is_archived === 'false') {
            conditions.push({ is_archived: false });
        }
        else if (is_archived === true || is_archived === 'true') {
            conditions.push({ is_archived: true });
        }
        if (fuel_type_id)
            conditions.push({ fuel_type_id });
        if (transmission_type)
            conditions.push({ transmission_type });
        if (min_price !== undefined || max_price !== undefined) {
            const pf = {};
            if (min_price !== undefined)
                pf.$gte = Number(min_price);
            if (max_price !== undefined)
                pf.$lte = Number(max_price);
            conditions.push({ $or: [{ ex_showroom_price: pf }, { expected_price: pf }] });
        }
        // Search: match variant name OR car name
        if (q) {
            const regex = new RegExp(String(q), 'i');
            const matchingCars = await car_model_1.Car.find({ name: regex, is_deleted: false })
                .select('car_id')
                .lean();
            const carIdsByName = matchingCars.map((c) => c.car_id);
            const orTerms = [{ variant_name: regex }, { slug: regex }];
            if (carIdsByName.length > 0)
                orTerms.push({ car_id: { $in: carIdsByName } });
            conditions.push({ $or: orTerms });
        }
        const variantMatchFilter = conditions.length === 1 ? conditions[0] : { $and: conditions };
        // Find which cars have matching variants
        const matchingCarIds = await car_variant_model_1.CarVariant.distinct('car_id', variantMatchFilter);
        if (matchingCarIds.length === 0) {
            return { groups: [], pagination: pagination_util_1.PaginationUtil.createPaginationMeta(page, limit, 0) };
        }
        // Load car metadata, applying optional brand/body_type filters
        const carFilter = { car_id: { $in: matchingCarIds }, is_deleted: false };
        if (brand_id)
            carFilter.brand_id = brand_id;
        if (body_type_id)
            carFilter.body_type_id = body_type_id;
        const totalCars = await car_model_1.Car.countDocuments(carFilter);
        const { skip, limit: validatedLimit } = pagination_util_1.PaginationUtil.getPaginationParams(page, limit);
        const cars = await car_model_1.Car.find(carFilter)
            .select('car_id name slug brand_id body_type_id body_type_name')
            .sort({ name: sortOrder === 'desc' ? -1 : 1 })
            .skip(skip)
            .limit(validatedLimit)
            .lean();
        if (cars.length === 0) {
            return { groups: [], pagination: pagination_util_1.PaginationUtil.createPaginationMeta(page, validatedLimit, totalCars) };
        }
        // Fetch ALL non-deleted variants for the paginated cars (not filtered)
        // so counts reflect true state and all variants are visible in the group
        const pageCarIds = cars.map((c) => c.car_id);
        const allVariants = await car_variant_model_1.CarVariant.find({ car_id: { $in: pageCarIds }, is_deleted: { $ne: true } })
            .select('variant_id car_id variant_name slug model_year fuel_type_id transmission_type drivetrain seating_capacity ex_showroom_price expected_price is_published is_archived is_deleted is_upcoming is_featured variant_status publish_status market_status variant_rank trim_name edition_name created_at updated_at')
            .sort({ variant_rank: 1, variant_name: 1 })
            .lean();
        const transformedVariants = await variant_response_transformer_1.VariantResponseTransformer.transformBatch(allVariants);
        variant_response_transformer_1.VariantResponseTransformer.clearCache();
        // Group transformed variants by car_id
        const variantsByCarId = new Map();
        transformedVariants.forEach((v) => {
            if (!variantsByCarId.has(v.car_id))
                variantsByCarId.set(v.car_id, []);
            variantsByCarId.get(v.car_id).push(v);
        });
        const groups = cars.map((car) => {
            const variants = variantsByCarId.get(car.car_id) || [];
            const first = variants[0];
            return {
                car_id: car.car_id,
                car_name: first?.car_name || car.name,
                car_slug: first?.car_slug || car.slug,
                brand_id: car.brand_id,
                brand_name: first?.brand_name || '—',
                body_type_id: car.body_type_id,
                body_type_name: first?.body_type_name || car.body_type_name || '—',
                variant_count_total: variants.length,
                variant_count_live: variants.filter((v) => v.is_published).length,
                variant_count_hidden: variants.filter((v) => !v.is_published && v.publish_status === 'hidden').length,
                variant_count_draft: variants.filter((v) => !v.is_published && v.publish_status !== 'hidden').length,
                variants,
            };
        });
        return { groups, pagination: pagination_util_1.PaginationUtil.createPaginationMeta(page, validatedLimit, totalCars) };
    }
    static async createVariant(variantData, actor = null) {
        const car = await car_model_1.Car.findOne({ car_id: variantData.car_id, is_deleted: false }).lean();
        if (!car) {
            throw new app_error_util_1.AppError(`Car not found or deleted for car_id: ${variantData.car_id}`, 404, {
                userMessage: errorMessages_1.USER_MESSAGES.CAR_NOT_FOUND,
                errorCode: errorMessages_1.ERROR_CODES.CAR_NOT_FOUND,
                details: {
                    field: 'car_id',
                    reason: 'The car does not exist, is deleted, or the wrong ID type was sent.',
                },
            });
        }
        // fuel_type_id is now optional - only validate if provided
        if (variantData.fuel_type_id) {
            const fuelType = await fuel_type_model_1.FuelType.findOne({ fuel_type_id: variantData.fuel_type_id, is_deleted: false }).lean();
            if (!fuelType) {
                throw new app_error_util_1.AppError(`Fuel type not found or deleted for fuel_type_id: ${variantData.fuel_type_id}`, 404, {
                    userMessage: errorMessages_1.USER_MESSAGES.FUEL_TYPE_NOT_FOUND,
                    errorCode: errorMessages_1.ERROR_CODES.FUEL_TYPE_NOT_FOUND,
                    details: {
                        field: 'fuel_type_id',
                        reason: 'The fuel type does not exist, is deleted, or the wrong ID type was sent.',
                    },
                });
            }
        }
        // Phase 2: Enhance with normalization before creating
        variantData = await this.enhanceVariantWithNormalization(variantData, variantData.fuel_type_id);
        const variant_id = (0, uuid_1.v4)();
        const slug = slug_util_1.SlugUtil.generate(variantData.variant_name);
        const existingSlug = await car_variant_model_1.CarVariant.findOne({ slug, is_deleted: false });
        if (existingSlug) {
            const baseSlug = slug;
            const pattern = new RegExp(`^${baseSlug}(-\\d+)?$`);
            const matchingSlugs = (await car_variant_model_1.CarVariant.find({ slug: pattern, is_deleted: false }).select('slug').lean()).map((v) => v.slug);
            const uniqueSlug = slug_util_1.SlugUtil.generateUnique(variantData.variant_name, matchingSlugs);
            variantData.slug = uniqueSlug;
        }
        else {
            variantData.slug = slug;
        }
        const variant = {
            variant_id,
            car_id: variantData.car_id,
            variant_name: variantData.variant_name,
            slug: variantData.slug,
            model_year: variantData.model_year,
            fuel_type_id: variantData.fuel_type_id,
            transmission_type: variantData.transmission_type,
            drivetrain: variantData.drivetrain,
            seating_capacity: variantData.seating_capacity,
            body_type: variantData.body_type,
            ex_showroom_price: variantData.ex_showroom_price,
            expected_price: variantData.expected_price,
            expected_launch_date: variantData.expected_launch_date,
            variant_rank: variantData.variant_rank,
            trim_name: variantData.trim_name,
            edition_name: variantData.edition_name,
            on_road_price: variantData.on_road_price,
            emi_estimate: variantData.emi_estimate,
            value_for_money_tag: variantData.value_for_money_tag ?? false,
            best_for_tags: variantData.best_for_tags || [],
            variant_highlights: variantData.variant_highlights || [],
            market_status: variantData.market_status,
            specs_normalized: variantData.specs_normalized,
            hidden_spec_keys: variantData.hidden_spec_keys || [],
            hidden_sections: variantData.hidden_sections || [],
            is_published: variantData.is_published || false,
            is_deleted: false,
            is_archived: false,
            // Powertrain detection flags (from normalization engine)
            has_engine: variantData.has_engine !== undefined ? Boolean(variantData.has_engine) : false,
            has_battery: variantData.has_battery !== undefined ? Boolean(variantData.has_battery) : false,
            has_motor: variantData.has_motor !== undefined ? Boolean(variantData.has_motor) : false,
            has_external_charging: variantData.has_external_charging !== undefined ? Boolean(variantData.has_external_charging) : false,
            powertrain_detection_confidence: variantData.powertrain_detection_confidence !== undefined ? Number(variantData.powertrain_detection_confidence) : 0,
        };
        const created = await car_variant_model_1.CarVariant.create(variant);
        await mileage_recompute_service_1.MileageRecomputeService.recomputeVariant(created.variant_id);
        await car_aggregation_service_1.CarAggregationService.recomputeFullAggregates(created.car_id);
        // Phase 5: Auto-wire SEO connections for enabled features
        try {
            await seo_auto_wiring_service_1.SEOAutoWiringService.autoWireVariant(created.variant_id, created.car_id, created.specs_normalized);
        }
        catch (err) {
            console.warn(`Failed to auto-wire SEO for variant ${created.variant_id}: ${err instanceof Error ? err.message : String(err)}`);
        }
        await audit_util_1.AuditUtil.recordEvent({
            entity_type: 'variant',
            entity_id: created.variant_id,
            action: 'create',
            actor,
            new_value: { variant_id: created.variant_id, variant_name: created.variant_name, car_id: created.car_id },
        });
        return created;
    }
    static async cloneVariant(sourceVariantId, overrides = {}, actor = null) {
        const source = await car_variant_model_1.CarVariant.findOne({ variant_id: sourceVariantId, is_deleted: { $ne: true } }).lean();
        if (!source) {
            throw new app_error_util_1.AppError(`Variant not found for clone: ${sourceVariantId}`, 404, {
                userMessage: errorMessages_1.USER_MESSAGES.VARIANT_NOT_FOUND,
                errorCode: errorMessages_1.ERROR_CODES.VARIANT_NOT_FOUND,
            });
        }
        const baseName = overrides.variant_name || `${source.variant_name} Copy`;
        const baseSlug = slug_util_1.SlugUtil.generate(baseName);
        const pattern = new RegExp(`^${baseSlug}(-\\d+)?$`);
        const existingSlugs = (await car_variant_model_1.CarVariant.find({ slug: pattern, is_deleted: { $ne: true } }).select('slug').lean()).map((v) => v.slug);
        const uniqueSlug = existingSlugs.length > 0
            ? slug_util_1.SlugUtil.generateUnique(baseName, existingSlugs)
            : baseSlug;
        const cloneData = {
            ...source,
            variant_id: (0, uuid_1.v4)(),
            variant_name: baseName,
            slug: uniqueSlug,
            is_published: false,
            is_deleted: false,
            is_archived: false,
            publish_status: 'draft',
            published_at: undefined,
        };
        delete cloneData._id;
        delete cloneData.__v;
        delete cloneData.created_at;
        delete cloneData.updated_at;
        const cloned = await car_variant_model_1.CarVariant.create(cloneData);
        await car_aggregation_service_1.CarAggregationService.recomputeFullAggregates(cloned.car_id);
        await audit_util_1.AuditUtil.recordEvent({
            entity_type: 'variant',
            entity_id: cloned.variant_id,
            action: 'clone',
            actor,
            new_value: { variant_id: cloned.variant_id, cloned_from: sourceVariantId },
        });
        return cloned;
    }
    static async updateVariant(variantId, variantData, actor = null) {
        const updateData = {};
        const before = await car_variant_model_1.CarVariant.findOne({ variant_id: variantId, is_deleted: false }).lean();
        // Phase 2: Enhance with normalization before processing
        variantData = await this.enhanceVariantWithNormalization(variantData, variantData.fuel_type_id);
        if (variantData.variant_name !== undefined) {
            updateData.variant_name = variantData.variant_name;
            const newSlug = slug_util_1.SlugUtil.generate(variantData.variant_name);
            const existingSlug = await car_variant_model_1.CarVariant.findOne({ slug: newSlug, variant_id: { $ne: variantId }, is_deleted: false });
            if (!existingSlug) {
                updateData.slug = newSlug;
            }
        }
        if (variantData.car_id !== undefined) {
            const car = await car_model_1.Car.findOne({ car_id: variantData.car_id, is_deleted: false }).lean();
            if (!car) {
                throw new app_error_util_1.AppError(`Car not found or deleted for car_id: ${variantData.car_id}`, 404, {
                    userMessage: errorMessages_1.USER_MESSAGES.CAR_NOT_FOUND,
                    errorCode: errorMessages_1.ERROR_CODES.CAR_NOT_FOUND,
                    details: {
                        field: 'car_id',
                        reason: 'The car does not exist, is deleted, or the wrong ID type was sent.',
                    },
                });
            }
            updateData.car_id = variantData.car_id;
        }
        if (variantData.model_year !== undefined)
            updateData.model_year = variantData.model_year;
        if (variantData.body_type !== undefined)
            updateData.body_type = variantData.body_type;
        if (variantData.fuel_type_id !== undefined) {
            // fuel_type_id is now optional - only validate if provided and not empty
            if (variantData.fuel_type_id) {
                const fuelType = await fuel_type_model_1.FuelType.findOne({ fuel_type_id: variantData.fuel_type_id, is_deleted: false }).lean();
                if (!fuelType) {
                    throw new app_error_util_1.AppError(`Fuel type not found or deleted for fuel_type_id: ${variantData.fuel_type_id}`, 404, {
                        userMessage: errorMessages_1.USER_MESSAGES.FUEL_TYPE_NOT_FOUND,
                        errorCode: errorMessages_1.ERROR_CODES.FUEL_TYPE_NOT_FOUND,
                        details: {
                            field: 'fuel_type_id',
                            reason: 'The fuel type does not exist, is deleted, or the wrong ID type was sent.',
                        },
                    });
                }
            }
            updateData.fuel_type_id = variantData.fuel_type_id;
        }
        if (variantData.transmission_type !== undefined)
            updateData.transmission_type = variantData.transmission_type;
        if (variantData.drivetrain !== undefined)
            updateData.drivetrain = variantData.drivetrain;
        if (variantData.seating_capacity !== undefined)
            updateData.seating_capacity = variantData.seating_capacity;
        if (variantData.ex_showroom_price !== undefined)
            updateData.ex_showroom_price = variantData.ex_showroom_price;
        if (variantData.expected_price !== undefined)
            updateData.expected_price = variantData.expected_price;
        if (variantData.expected_launch_date !== undefined)
            updateData.expected_launch_date = variantData.expected_launch_date;
        if (variantData.specs_normalized !== undefined)
            updateData.specs_normalized = variantData.specs_normalized;
        if (variantData.hidden_spec_keys !== undefined)
            updateData.hidden_spec_keys = variantData.hidden_spec_keys;
        if (variantData.hidden_sections !== undefined)
            updateData.hidden_sections = variantData.hidden_sections;
        if (variantData.is_published !== undefined)
            updateData.is_published = variantData.is_published;
        if (variantData.editor_user_id !== undefined)
            updateData.editor_user_id = variantData.editor_user_id || null;
        if (variantData.seo_owner_user_id !== undefined)
            updateData.seo_owner_user_id = variantData.seo_owner_user_id || null;
        if (variantData.reviewer_user_id !== undefined)
            updateData.reviewer_user_id = variantData.reviewer_user_id || null;
        if (variantData.variant_rank !== undefined)
            updateData.variant_rank = variantData.variant_rank;
        if (variantData.trim_name !== undefined)
            updateData.trim_name = variantData.trim_name;
        if (variantData.edition_name !== undefined)
            updateData.edition_name = variantData.edition_name;
        if (variantData.on_road_price !== undefined)
            updateData.on_road_price = variantData.on_road_price;
        if (variantData.emi_estimate !== undefined)
            updateData.emi_estimate = variantData.emi_estimate;
        if (variantData.value_for_money_tag !== undefined)
            updateData.value_for_money_tag = variantData.value_for_money_tag;
        if (variantData.best_for_tags !== undefined)
            updateData.best_for_tags = variantData.best_for_tags;
        if (variantData.variant_highlights !== undefined)
            updateData.variant_highlights = variantData.variant_highlights;
        if (variantData.market_status !== undefined)
            updateData.market_status = variantData.market_status;
        // Powertrain flags from normalization
        if (variantData.has_engine !== undefined)
            updateData.has_engine = Boolean(variantData.has_engine);
        if (variantData.has_battery !== undefined)
            updateData.has_battery = Boolean(variantData.has_battery);
        if (variantData.has_motor !== undefined)
            updateData.has_motor = Boolean(variantData.has_motor);
        if (variantData.has_external_charging !== undefined)
            updateData.has_external_charging = Boolean(variantData.has_external_charging);
        if (variantData.powertrain_detection_confidence !== undefined)
            updateData.powertrain_detection_confidence = Number(variantData.powertrain_detection_confidence);
        // Validate automotive constraints before saving
        const validationResult = await variant_integrity_service_1.VariantIntegrityService.validateAutomotiveConstraints({
            ...before,
            ...updateData,
        });
        if (!validationResult.isValid) {
            throw new app_error_util_1.AppError(`Validation failed: ${validationResult.errors.map((e) => e.message).join('; ')}`, 400);
        }
        const variant = await car_variant_model_1.CarVariant.findOneAndUpdate({ variant_id: variantId, is_deleted: false }, updateData, { returnDocument: 'after' });
        if (!variant) {
            throw new app_error_util_1.AppError(`Variant not found or deleted for variant_id: ${variantId}`, 404, {
                userMessage: errorMessages_1.USER_MESSAGES.VARIANT_NOT_FOUND,
                errorCode: errorMessages_1.ERROR_CODES.VARIANT_NOT_FOUND,
                details: {
                    field: 'variant_id',
                    reason: 'The variant does not exist or has been deleted.',
                },
            });
        }
        // Record change history for manual edits
        if (before) {
            try {
                await variant_integrity_service_1.VariantIntegrityService.recordVariantChanges(variantId, before, variant.toObject(), actor?.email || 'system', 'manual_edit');
            }
            catch (changeTrackingError) {
                // Log warning but don't fail the update
                console.warn(`Failed to record change history for variant ${variantId}: ${changeTrackingError?.message || changeTrackingError}`);
            }
        }
        // Reclassify the variant when classification inputs changed; always recompute
        // the parent car aggregates because variant-level price/transmission/drive/rank
        // edits all change the model-level rollup.
        const classificationInputsChanged = variantData.specs_normalized !== undefined ||
            variantData.fuel_type_id !== undefined ||
            variantData.car_id !== undefined ||
            variantData.body_type !== undefined;
        if (classificationInputsChanged) {
            await mileage_recompute_service_1.MileageRecomputeService.recomputeVariant(variant.variant_id);
        }
        await car_aggregation_service_1.CarAggregationService.recomputeFullAggregates(variant.car_id);
        await audit_util_1.AuditUtil.recordChanges({
            entity_type: 'variant',
            entity_id: variant.variant_id,
            before,
            after: variant.toObject(),
            fieldsToTrack: audit_util_1.VARIANT_AUDIT_FIELDS,
            actor,
        });
        // Emit a marker row when the specs blob was modified — the diff for the full
        // nested object is too noisy to store per-field but we still want to surface
        // "specs were edited" in the timeline.
        if (variantData.specs_normalized !== undefined) {
            await audit_util_1.AuditUtil.recordEvent({
                entity_type: 'variant',
                entity_id: variant.variant_id,
                action: 'update',
                field: 'specs_normalized',
                new_value: { changed: true },
                actor,
            });
            // Phase 5: Update SEO wiring when specs change
            try {
                await seo_auto_wiring_service_1.SEOAutoWiringService.updateWiringForVariant(variant.variant_id, variant.car_id, variant.specs_normalized);
            }
            catch (err) {
                console.warn(`Failed to update SEO wiring for variant ${variant.variant_id}: ${err instanceof Error ? err.message : String(err)}`);
            }
        }
        return variant;
    }
    static async deleteVariant(variantId, actor = null) {
        const variant = await car_variant_model_1.CarVariant.findOneAndUpdate({ variant_id: variantId, is_deleted: false }, { is_deleted: true }, { returnDocument: 'after' });
        if (!variant) {
            throw new app_error_util_1.AppError(`Variant not found or deleted for variant_id: ${variantId}`, 404, {
                userMessage: errorMessages_1.USER_MESSAGES.VARIANT_NOT_FOUND,
                errorCode: errorMessages_1.ERROR_CODES.VARIANT_NOT_FOUND,
                details: {
                    field: 'variant_id',
                    reason: 'The variant does not exist or has already been deleted.',
                },
            });
        }
        await car_aggregation_service_1.CarAggregationService.recomputeFullAggregates(variant.car_id);
        await audit_util_1.AuditUtil.recordEvent({
            entity_type: 'variant',
            entity_id: variant.variant_id,
            action: 'delete',
            actor,
        });
        return variant;
    }
    static async restoreVariant(variantId, actor = null) {
        const variant = await car_variant_model_1.CarVariant.findOneAndUpdate({ variant_id: variantId, is_deleted: true }, { is_deleted: false }, { returnDocument: 'after' });
        if (!variant) {
            throw new app_error_util_1.AppError(`Variant not found for variant_id: ${variantId}`, 404, {
                userMessage: errorMessages_1.USER_MESSAGES.VARIANT_NOT_FOUND,
                errorCode: errorMessages_1.ERROR_CODES.VARIANT_NOT_FOUND,
                details: {
                    field: 'variant_id',
                    reason: 'The variant does not exist in the deleted records.',
                },
            });
        }
        await car_aggregation_service_1.CarAggregationService.recomputeFullAggregates(variant.car_id);
        await audit_util_1.AuditUtil.recordEvent({
            entity_type: 'variant',
            entity_id: variant.variant_id,
            action: 'restore',
            actor,
        });
        return variant;
    }
    static async togglePublish(variantId, actor = null) {
        const variant = await car_variant_model_1.CarVariant.findOne({ variant_id: variantId, is_deleted: false });
        if (!variant) {
            throw new app_error_util_1.AppError(`Variant not found or deleted for variant_id: ${variantId}`, 404, {
                userMessage: errorMessages_1.USER_MESSAGES.VARIANT_NOT_FOUND,
                errorCode: errorMessages_1.ERROR_CODES.VARIANT_NOT_FOUND,
                details: {
                    field: 'variant_id',
                    reason: 'The variant does not exist or has been deleted.',
                },
            });
        }
        const previous = variant.is_published;
        variant.is_published = !variant.is_published;
        await variant.save();
        await audit_util_1.AuditUtil.recordEvent({
            entity_type: 'variant',
            entity_id: variant.variant_id,
            action: variant.is_published ? 'publish' : 'unpublish',
            field: 'is_published',
            old_value: previous,
            new_value: variant.is_published,
            actor,
        });
        return variant;
    }
    static async publishVariant(variantId, actor = null) {
        const variant = await car_variant_model_1.CarVariant.findOneAndUpdate({ variant_id: variantId, is_deleted: false }, { is_published: true }, { returnDocument: 'after' });
        if (!variant) {
            throw new app_error_util_1.AppError(`Variant not found or deleted for variant_id: ${variantId}`, 404, {
                userMessage: errorMessages_1.USER_MESSAGES.VARIANT_NOT_FOUND,
                errorCode: errorMessages_1.ERROR_CODES.VARIANT_NOT_FOUND,
                details: {
                    field: 'variant_id',
                    reason: 'The variant does not exist or has been deleted.',
                },
            });
        }
        await audit_util_1.AuditUtil.recordEvent({
            entity_type: 'variant',
            entity_id: variant.variant_id,
            action: 'publish',
            field: 'is_published',
            new_value: true,
            actor,
        });
        return variant;
    }
    static async unpublishVariant(variantId, actor = null) {
        const variant = await car_variant_model_1.CarVariant.findOneAndUpdate({ variant_id: variantId, is_deleted: false }, { is_published: false }, { returnDocument: 'after' });
        if (!variant) {
            throw new app_error_util_1.AppError(`Variant not found or deleted for variant_id: ${variantId}`, 404, {
                userMessage: errorMessages_1.USER_MESSAGES.VARIANT_NOT_FOUND,
                errorCode: errorMessages_1.ERROR_CODES.VARIANT_NOT_FOUND,
                details: {
                    field: 'variant_id',
                    reason: 'The variant does not exist or has been deleted.',
                },
            });
        }
        await audit_util_1.AuditUtil.recordEvent({
            entity_type: 'variant',
            entity_id: variant.variant_id,
            action: 'unpublish',
            field: 'is_published',
            new_value: false,
            actor,
        });
        return variant;
    }
    static async archiveVariant(variantId, archivedBy, actor = null) {
        const variant = await car_variant_model_1.CarVariant.findOneAndUpdate({ variant_id: variantId, is_deleted: false, is_archived: false }, {
            is_archived: true,
            archived_at: new Date(),
            archived_by: archivedBy
        }, { returnDocument: 'after' });
        if (!variant) {
            throw new app_error_util_1.AppError(`Variant not found, deleted, or already archived for variant_id: ${variantId}`, 404, {
                userMessage: errorMessages_1.USER_MESSAGES.VARIANT_NOT_FOUND,
                errorCode: errorMessages_1.ERROR_CODES.VARIANT_NOT_FOUND,
                details: {
                    field: 'variant_id',
                    reason: 'The variant does not exist, is deleted, or is already archived.',
                },
            });
        }
        await car_aggregation_service_1.CarAggregationService.recomputeFullAggregates(variant.car_id);
        await audit_util_1.AuditUtil.recordEvent({
            entity_type: 'variant',
            entity_id: variant.variant_id,
            action: 'archive',
            field: 'is_archived',
            new_value: true,
            actor,
        });
        return variant;
    }
    static async unarchiveVariant(variantId, actor = null) {
        const variant = await car_variant_model_1.CarVariant.findOneAndUpdate({ variant_id: variantId, is_deleted: false, is_archived: true }, {
            is_archived: false,
            archived_at: null,
            archived_by: null
        }, { returnDocument: 'after' });
        if (!variant) {
            throw new app_error_util_1.AppError(`Variant not found, deleted, or not archived for variant_id: ${variantId}`, 404, {
                userMessage: errorMessages_1.USER_MESSAGES.VARIANT_NOT_FOUND,
                errorCode: errorMessages_1.ERROR_CODES.VARIANT_NOT_FOUND,
                details: {
                    field: 'variant_id',
                    reason: 'The variant does not exist, is deleted, or is not archived.',
                },
            });
        }
        await car_aggregation_service_1.CarAggregationService.recomputeFullAggregates(variant.car_id);
        await audit_util_1.AuditUtil.recordEvent({
            entity_type: 'variant',
            entity_id: variant.variant_id,
            action: 'unarchive',
            field: 'is_archived',
            new_value: false,
            actor,
        });
        return variant;
    }
    /**
     * Phase 2: Enhance variant data with normalization and powertrain detection.
     * Auto-normalize specs if specs_raw is provided, update powertrain flags.
     */
    static async enhanceVariantWithNormalization(variantData, fuel_type_id) {
        try {
            const specs_raw = variantData.specs_raw;
            if (!specs_raw || Object.keys(specs_raw).length === 0) {
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
}
exports.CarVariantService = CarVariantService;
//# sourceMappingURL=car-variant.service.js.map