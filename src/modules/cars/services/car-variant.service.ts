import { v4 as uuidv4 } from "uuid";
import { ERROR_CODES, USER_MESSAGES } from "../../../constants/errorMessages";
import { CarVariant, ICarVariant, SpecsNormalized } from "../../../models/car-variant.model";
import { Car } from "../../../models/car.model";
import { FuelType } from "../../../models/fuel-type.model";
import { CarAggregationService } from "../../../shared/services/car-aggregation.service";
import { MileageRecomputeService } from "../../../shared/services/mileage-recompute.service";
import { AppError } from "../../../shared/utils/app-error.util";
import { AuditActor, AuditUtil, VARIANT_AUDIT_FIELDS } from "../../../shared/utils/audit.util";
import { FilterUtil } from "../../../shared/utils/filter.util";
import { PaginationUtil } from "../../../shared/utils/pagination.util";
import { SlugUtil } from "../../../shared/utils/slug.util";
import { VariantIntegrityService } from "../../variants/services/variant-integrity.service";
import { VariantResponseTransformer } from "../../../shared/transformers/variant-response.transformer";
import { ImportNormalizerService } from "../../imports/services/import-normalizer.service";
import { PowertrainDetectorService } from "../../variants/services/powertrain-detector.service";
import { SEOAutoWiringService } from "../../imports/services/seo-auto-wiring.service";

// ── Fuel-type visibility rules (mirrors variantSpecConfig.ts FuelVisibilityMap) ──
// Maps section key → field key → which fuel types should hide that field.
// Only 'hide' entries are listed — absent means show.
type NormalizedFuel = 'ice' | 'cng' | 'ev' | 'hybrid';

interface FieldRule {
  hideFor: NormalizedFuel[];
  replaceValue?: { [fuel in NormalizedFuel]?: string };
}

const FUEL_SPEC_RULES: Record<keyof SpecsNormalized, Record<string, FieldRule>> = {
  engine_performance: {
    engine_type:          { hideFor: ['ev'] },
    displacement:         { hideFor: ['ev'] },
    max_power:            { hideFor: ['ev'] },
    max_torque:           { hideFor: ['ev'] },
    cylinders:            { hideFor: ['ev'] },
    valves_per_cylinder:  { hideFor: ['ev'] },
    turbocharger:         { hideFor: ['ev'] },
    fuel_system:          { hideFor: ['ev'] },
    cng_power_torque:     { hideFor: ['ice', 'ev', 'hybrid'] },
    electric_assist:      { hideFor: ['ice', 'cng', 'ev'] },
    idle_start_stop:      { hideFor: ['ev'] },
  },
  mileage_range: {
    arai_mileage:         { hideFor: ['ev'] },
    real_mileage:         { hideFor: ['ev'] },
    city_mileage:         { hideFor: ['ev'] },
    highway_mileage:      { hideFor: ['ev'] },
    fuel_tank_capacity:   { hideFor: ['ev'] },
    emission_standard:    { hideFor: ['ev'] },
    e20_compatibility:    { hideFor: ['ev'] },
    cng_mileage:          { hideFor: ['ice', 'ev', 'hybrid'] },
    cng_tank_capacity:    { hideFor: ['ice', 'ev', 'hybrid'] },
  },
  battery_charging: {
    motor_type:           { hideFor: ['ice', 'cng'] },
    motor_power_kw:       { hideFor: ['ice', 'cng'] },
    motor_torque_nm:      { hideFor: ['ice', 'cng'] },
    number_of_motors:     { hideFor: ['ice', 'cng'] },
    ev_mode:              { hideFor: ['ice', 'cng', 'ev'] },
    battery_wltp_km:      { hideFor: ['ice', 'cng', 'hybrid'] },
    real_world_range:     { hideFor: ['ice', 'cng'] },
    battery_capacity:     { hideFor: ['ice', 'cng'] },
    battery_type:         { hideFor: ['ice', 'cng'] },
    charging_port_type:   { hideFor: ['ice', 'cng', 'hybrid'] },
    ac_charging_time:     { hideFor: ['ice', 'cng', 'hybrid'] },
    dc_fast_charging_time:{ hideFor: ['ice', 'cng', 'hybrid'] },
    fast_charge_0_80:     { hideFor: ['ice', 'cng', 'hybrid'] },
    charging_time_7kw:    { hideFor: ['ice', 'cng', 'hybrid'] },
    charging_time_50kw:   { hideFor: ['ice', 'cng', 'hybrid'] },
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
    battery_warranty_km:    { hideFor: ['ice', 'cng'] },
  },
  storage_cabin_practicality: {},
  driver_display_controls: {
    paddle_shifters: { hideFor: ['ev'] },
  },
};

// Fields whose value should be overridden for specific fuel types
const FUEL_VALUE_OVERRIDES: Partial<Record<keyof SpecsNormalized, Record<string, Partial<Record<NormalizedFuel, string>>>>> = {};
// Transmission/gearbox overrides live at the variant top level, handled separately in the controller.

const normalizeFuel = (fuelNameOrSlug: string): NormalizedFuel => {
  const lower = (fuelNameOrSlug || '').toLowerCase();
  if (lower.includes('electric') || lower === 'ev' || lower === 'bev') return 'ev';
  if (lower.includes('cng') || lower.includes('natural gas') || lower.includes('compressed')) return 'cng';
  if (lower.includes('hybrid')) return 'hybrid';
  return 'ice';
};

export class CarVariantService {
  private static SECTION_NAME_TO_KEY_MAP: Record<string, keyof SpecsNormalized> = {
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

  static removeHiddenSpecKeys(specs_normalized: SpecsNormalized | undefined, hidden_spec_keys: string[] = []): SpecsNormalized | undefined {
    if (!specs_normalized || !hidden_spec_keys || hidden_spec_keys.length === 0) {
      return specs_normalized;
    }

    const result = JSON.parse(JSON.stringify(specs_normalized)) as SpecsNormalized;

    hidden_spec_keys.forEach(keyPath => {
      const keys = keyPath.split('.');
      let current: any = result;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (current && current[keys[i]] !== undefined) {
          current = current[keys[i]];
        } else {
          return;
        }
      }
      
      if (current && current[keys[keys.length - 1]] !== undefined) {
        delete current[keys[keys.length - 1]];
      }
    });

    return result;
  }

  static removeHiddenSections(specs_normalized: SpecsNormalized | undefined, hidden_sections: string[] | undefined): SpecsNormalized | undefined {
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
      } else if (!key) {
        console.warn(`Unknown section name in hidden_sections: ${sectionName}`);
      }
    }

    return result;
  }

  // Step 1 — remove fields that should be hidden for the variant's fuel type.
  // fuel_type_ref may be a raw UUID string, a slug/name string, or a Mongoose-populated
  // object {name, slug} — all three are handled.
  static applyFuelTypeFilter(
    specs_normalized: SpecsNormalized | undefined,
    fuel_type_ref: string | { name?: string; slug?: string } | any,
  ): SpecsNormalized | undefined {
    if (!specs_normalized) return specs_normalized;

    let fuelIdentifier: string;
    if (typeof fuel_type_ref === 'string') {
      fuelIdentifier = fuel_type_ref;
    } else if (fuel_type_ref && typeof fuel_type_ref === 'object') {
      // Populated Mongoose document: prefer slug, fall back to name
      fuelIdentifier = fuel_type_ref.slug || fuel_type_ref.name || '';
    } else {
      fuelIdentifier = '';
    }

    const fuel = normalizeFuel(fuelIdentifier);
    const result = JSON.parse(JSON.stringify(specs_normalized)) as SpecsNormalized;

    for (const sectionKey of Object.keys(FUEL_SPEC_RULES) as (keyof SpecsNormalized)[]) {
      const section = result[sectionKey] as Record<string, any> | undefined;
      if (!section) continue;

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
  static removeEmptyValues(specs_normalized: SpecsNormalized | undefined): SpecsNormalized | undefined {
    if (!specs_normalized) return specs_normalized;

    const result: any = {};
    for (const [sectionKey, section] of Object.entries(specs_normalized)) {
      if (!section || typeof section !== 'object') continue;
      const cleaned: Record<string, any> = {};
      for (const [k, v] of Object.entries(section as Record<string, any>)) {
        if (v !== null && v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0)) {
          cleaned[k] = v;
        }
      }
      if (Object.keys(cleaned).length > 0) {
        result[sectionKey] = cleaned;
      }
    }
    return result as SpecsNormalized;
  }

  // Step 3 — remove entire sections where all fields were removed by steps 1+2
  static autoHideEmptySections(specs_normalized: SpecsNormalized | undefined): SpecsNormalized | undefined {
    if (!specs_normalized) return specs_normalized;

    const result: any = {};
    for (const [sectionKey, section] of Object.entries(specs_normalized)) {
      if (section && typeof section === 'object' && Object.keys(section).length > 0) {
        result[sectionKey] = section;
      }
    }
    return result as SpecsNormalized;
  }

  static async getAllVariants(filterDto: any, includeDeleted: boolean = false) {
    try {
      const {
        page = 1,
        limit = 10,
        q,
        car_id,
        fuel_type_id,
        transmission_type,
        model_year,
        is_published,
        is_archived,
        is_deleted,
        min_price,
        max_price,
        min_model_year,
        max_model_year,
        sortBy = 'variant_name',
        sortOrder = 'asc',
      } = filterDto;

      const filter: Record<string, unknown> = {};

      if (is_deleted === 'true' || is_deleted === true) {
        filter.is_deleted = true;
      } else if (!includeDeleted) {
        filter.is_deleted = false;
      }

      // By default, exclude archived variants unless explicitly requested.
      // Accept boolean (from JSON callers) AND string ("true"/"false"/"all" from
      // query-string callers). Previously the boolean `false` fell through both
      // branches and silently disabled the filter — admins saw archived rows mixed
      // into the active list.
      if (is_archived === undefined || is_archived === false || is_archived === 'false') {
        filter.is_archived = false;
      } else if (is_archived === true || is_archived === 'true') {
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
      } else {
        if (min_model_year !== undefined || max_model_year !== undefined) {
          const yearFilter: Record<string, unknown> = {};
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
      const priceFilter: Record<string, unknown> = {};
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
        const searchFilter = FilterUtil.buildSearchFilter(['variant_name'], q);
        Object.assign(filter, searchFilter);
      }

      const { skip, limit: validatedLimit } = PaginationUtil.getPaginationParams(page, limit, { maxLimit: 500 });
      const sortFilter = FilterUtil.buildSortFilter(sortBy, sortOrder);

      const variants = await CarVariant.find(filter)
        .select('variant_id car_id variant_name slug model_year fuel_type_id transmission_type drivetrain seating_capacity ex_showroom_price expected_price is_published is_archived is_deleted is_upcoming is_featured variant_status publish_status market_status variant_rank trim_name edition_name created_at updated_at')
        .sort(sortFilter)
        .skip(skip)
        .limit(validatedLimit)
        .lean();

      const total = await CarVariant.countDocuments(filter);
      const paginationMeta = PaginationUtil.createPaginationMeta(page, validatedLimit, total);

      return { variants, pagination: paginationMeta };
    } catch (error) {
      console.error('Error in getAllVariants:', error);
      throw new AppError(
        'Failed to fetch variants',
        500,
        {
          userMessage: USER_MESSAGES.INTERNAL_SERVER_ERROR,
          errorCode: ERROR_CODES.INTERNAL_SERVER_ERROR,
          details: {
            reason: error instanceof Error ? error.message : 'Unknown error',
          },
        }
      );
    }
  }

  static async getVariantById(variantId: string) {
    return await CarVariant.findOne({ variant_id: variantId, is_deleted: false });
  }

  static async getVariantBySlug(slug: string) {
    return await CarVariant.findOne({ slug, is_deleted: false });
  }

  // Returns variants grouped by parent car, paginating at the car level.
  // Counts (total/live/hidden/draft) reflect ALL non-deleted variants for the car,
  // independent of any applied filter — so the UI always shows the true picture.
  static async getGroupedVariants(filterDto: any) {
    const {
      page = 1,
      limit = 25,
      q,
      brand_id,
      body_type_id,
      fuel_type_id,
      transmission_type,
      is_archived,
      is_deleted,
      min_price,
      max_price,
      sortOrder = 'asc',
    } = filterDto;

    // Build variant match conditions as an $and array to support multiple $or clauses
    const conditions: Record<string, any>[] = [];

    if (is_deleted === 'true' || is_deleted === true) {
      conditions.push({ is_deleted: true });
    } else {
      conditions.push({ is_deleted: false });
    }

    if (is_archived === undefined || is_archived === false || is_archived === 'false') {
      conditions.push({ is_archived: false });
    } else if (is_archived === true || is_archived === 'true') {
      conditions.push({ is_archived: true });
    }

    if (fuel_type_id) conditions.push({ fuel_type_id });
    if (transmission_type) conditions.push({ transmission_type });

    if (min_price !== undefined || max_price !== undefined) {
      const pf: Record<string, number> = {};
      if (min_price !== undefined) pf.$gte = Number(min_price);
      if (max_price !== undefined) pf.$lte = Number(max_price);
      conditions.push({ $or: [{ ex_showroom_price: pf }, { expected_price: pf }] });
    }

    // Search: match variant name OR car name
    if (q) {
      const regex = new RegExp(String(q), 'i');
      const matchingCars = await Car.find({ name: regex, is_deleted: false })
        .select('car_id')
        .lean();
      const carIdsByName = matchingCars.map((c: any) => c.car_id);
      const orTerms: any[] = [{ variant_name: regex }, { slug: regex }];
      if (carIdsByName.length > 0) orTerms.push({ car_id: { $in: carIdsByName } });
      conditions.push({ $or: orTerms });
    }

    const variantMatchFilter = conditions.length === 1 ? conditions[0] : { $and: conditions };

    // Find which cars have matching variants
    const matchingCarIds = await CarVariant.distinct('car_id', variantMatchFilter);
    if (matchingCarIds.length === 0) {
      return { groups: [], pagination: PaginationUtil.createPaginationMeta(page, limit, 0) };
    }

    // Load car metadata, applying optional brand/body_type filters
    const carFilter: Record<string, any> = { car_id: { $in: matchingCarIds }, is_deleted: false };
    if (brand_id) carFilter.brand_id = brand_id;
    if (body_type_id) carFilter.body_type_id = body_type_id;

    const totalCars = await Car.countDocuments(carFilter);
    const { skip, limit: validatedLimit } = PaginationUtil.getPaginationParams(page, limit);

    const cars = await Car.find(carFilter)
      .select('car_id name slug brand_id body_type_id body_type_name')
      .sort({ name: sortOrder === 'desc' ? -1 : 1 })
      .skip(skip)
      .limit(validatedLimit)
      .lean();

    if (cars.length === 0) {
      return { groups: [], pagination: PaginationUtil.createPaginationMeta(page, validatedLimit, totalCars) };
    }

    // Fetch ALL non-deleted variants for the paginated cars (not filtered)
    // so counts reflect true state and all variants are visible in the group
    const pageCarIds = (cars as any[]).map((c) => c.car_id);
    const allVariants = await CarVariant.find({ car_id: { $in: pageCarIds }, is_deleted: false })
      .select('variant_id car_id variant_name slug model_year fuel_type_id transmission_type drivetrain seating_capacity ex_showroom_price expected_price is_published is_archived is_deleted is_upcoming is_featured variant_status publish_status market_status variant_rank trim_name edition_name created_at updated_at')
      .sort({ variant_rank: 1, variant_name: 1 })
      .lean();

    const transformedVariants = await VariantResponseTransformer.transformBatch(allVariants);
    VariantResponseTransformer.clearCache();

    // Group transformed variants by car_id
    const variantsByCarId = new Map<string, any[]>();
    transformedVariants.forEach((v: any) => {
      if (!variantsByCarId.has(v.car_id)) variantsByCarId.set(v.car_id, []);
      variantsByCarId.get(v.car_id)!.push(v);
    });

    const groups = (cars as any[]).map((car: any) => {
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

    return { groups, pagination: PaginationUtil.createPaginationMeta(page, validatedLimit, totalCars) };
  }

  static async createVariant(variantData: any, actor: AuditActor | null = null) {
    const car = await Car.findOne({ car_id: variantData.car_id, is_deleted: false }).lean();
    if (!car) {
      throw new AppError(
        `Car not found or deleted for car_id: ${variantData.car_id}`,
        404,
        {
          userMessage: USER_MESSAGES.CAR_NOT_FOUND,
          errorCode: ERROR_CODES.CAR_NOT_FOUND,
          details: {
            field: 'car_id',
            reason: 'The car does not exist, is deleted, or the wrong ID type was sent.',
          },
        }
      );
    }

    // fuel_type_id is now optional - only validate if provided
    if (variantData.fuel_type_id) {
      const fuelType = await FuelType.findOne({ fuel_type_id: variantData.fuel_type_id, is_deleted: false }).lean();
      if (!fuelType) {
        throw new AppError(
          `Fuel type not found or deleted for fuel_type_id: ${variantData.fuel_type_id}`,
          404,
          {
            userMessage: USER_MESSAGES.FUEL_TYPE_NOT_FOUND,
            errorCode: ERROR_CODES.FUEL_TYPE_NOT_FOUND,
            details: {
              field: 'fuel_type_id',
              reason: 'The fuel type does not exist, is deleted, or the wrong ID type was sent.',
            },
          }
        );
      }
    }

    // Phase 2: Enhance with normalization before creating
    variantData = await this.enhanceVariantWithNormalization(variantData, variantData.fuel_type_id);

    const variant_id = uuidv4();
    const slug = SlugUtil.generate(variantData.variant_name);

    const existingSlug = await CarVariant.findOne({ slug, is_deleted: false });
    if (existingSlug) {
      const baseSlug = slug;
      const pattern = new RegExp(`^${baseSlug}(-\\d+)?$`);
      const matchingSlugs = (
        await CarVariant.find({ slug: pattern, is_deleted: false }).select('slug').lean()
      ).map((v: any) => v.slug);
      const uniqueSlug = SlugUtil.generateUnique(variantData.variant_name, matchingSlugs);
      variantData.slug = uniqueSlug;
    } else {
      variantData.slug = slug;
    }

    const variant: Partial<ICarVariant> = {
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

    const created = await CarVariant.create(variant);
    await MileageRecomputeService.recomputeVariant(created.variant_id);
    await CarAggregationService.recomputeFullAggregates(created.car_id);

    // Phase 5: Auto-wire SEO connections for enabled features
    try {
      await SEOAutoWiringService.autoWireVariant(
        created.variant_id,
        created.car_id,
        created.specs_normalized
      );
    } catch (err) {
      console.warn(`Failed to auto-wire SEO for variant ${created.variant_id}: ${err instanceof Error ? err.message : String(err)}`);
    }

    await AuditUtil.recordEvent({
      entity_type: 'variant',
      entity_id: created.variant_id,
      action: 'create',
      actor,
      new_value: { variant_id: created.variant_id, variant_name: created.variant_name, car_id: created.car_id },
    });
    return created;
  }

  static async updateVariant(variantId: string, variantData: any, actor: AuditActor | null = null) {
    const updateData: Partial<ICarVariant> = {};
    const before = await CarVariant.findOne({ variant_id: variantId, is_deleted: false }).lean();

    // Phase 2: Enhance with normalization before processing
    variantData = await this.enhanceVariantWithNormalization(variantData, variantData.fuel_type_id);

    if (variantData.variant_name !== undefined) {
      updateData.variant_name = variantData.variant_name;
      const newSlug = SlugUtil.generate(variantData.variant_name);
      const existingSlug = await CarVariant.findOne({ slug: newSlug, variant_id: { $ne: variantId }, is_deleted: false });
      if (!existingSlug) {
        updateData.slug = newSlug;
      }
    }

    if (variantData.car_id !== undefined) {
      const car = await Car.findOne({ car_id: variantData.car_id, is_deleted: false }).lean();
      if (!car) {
        throw new AppError(
          `Car not found or deleted for car_id: ${variantData.car_id}`,
          404,
          {
            userMessage: USER_MESSAGES.CAR_NOT_FOUND,
            errorCode: ERROR_CODES.CAR_NOT_FOUND,
            details: {
              field: 'car_id',
              reason: 'The car does not exist, is deleted, or the wrong ID type was sent.',
            },
          }
        );
      }
      updateData.car_id = variantData.car_id;
    }
    if (variantData.model_year !== undefined) updateData.model_year = variantData.model_year;
    if (variantData.body_type !== undefined) updateData.body_type = variantData.body_type;
    if (variantData.fuel_type_id !== undefined) {
      // fuel_type_id is now optional - only validate if provided and not empty
      if (variantData.fuel_type_id) {
        const fuelType = await FuelType.findOne({ fuel_type_id: variantData.fuel_type_id, is_deleted: false }).lean();
        if (!fuelType) {
          throw new AppError(
            `Fuel type not found or deleted for fuel_type_id: ${variantData.fuel_type_id}`,
            404,
            {
              userMessage: USER_MESSAGES.FUEL_TYPE_NOT_FOUND,
              errorCode: ERROR_CODES.FUEL_TYPE_NOT_FOUND,
              details: {
                field: 'fuel_type_id',
                reason: 'The fuel type does not exist, is deleted, or the wrong ID type was sent.',
              },
            }
          );
        }
      }
      updateData.fuel_type_id = variantData.fuel_type_id;
    }
    if (variantData.transmission_type !== undefined) updateData.transmission_type = variantData.transmission_type;
    if (variantData.drivetrain !== undefined) updateData.drivetrain = variantData.drivetrain;
    if (variantData.seating_capacity !== undefined) updateData.seating_capacity = variantData.seating_capacity;
    if (variantData.ex_showroom_price !== undefined) updateData.ex_showroom_price = variantData.ex_showroom_price;
    if (variantData.expected_price !== undefined) updateData.expected_price = variantData.expected_price;
    if (variantData.expected_launch_date !== undefined) updateData.expected_launch_date = variantData.expected_launch_date;
    if (variantData.specs_normalized !== undefined) updateData.specs_normalized = variantData.specs_normalized;
    if (variantData.hidden_spec_keys !== undefined) updateData.hidden_spec_keys = variantData.hidden_spec_keys;
    if (variantData.hidden_sections !== undefined) updateData.hidden_sections = variantData.hidden_sections;
    if (variantData.is_published !== undefined) updateData.is_published = variantData.is_published;
    if (variantData.editor_user_id !== undefined) updateData.editor_user_id = variantData.editor_user_id || null;
    if (variantData.seo_owner_user_id !== undefined) updateData.seo_owner_user_id = variantData.seo_owner_user_id || null;
    if (variantData.reviewer_user_id !== undefined) updateData.reviewer_user_id = variantData.reviewer_user_id || null;
    if (variantData.variant_rank !== undefined) updateData.variant_rank = variantData.variant_rank;
    if (variantData.trim_name !== undefined) updateData.trim_name = variantData.trim_name;
    if (variantData.edition_name !== undefined) updateData.edition_name = variantData.edition_name;
    if (variantData.on_road_price !== undefined) updateData.on_road_price = variantData.on_road_price;
    if (variantData.emi_estimate !== undefined) updateData.emi_estimate = variantData.emi_estimate;
    if (variantData.value_for_money_tag !== undefined) updateData.value_for_money_tag = variantData.value_for_money_tag;
    if (variantData.best_for_tags !== undefined) updateData.best_for_tags = variantData.best_for_tags;
    if (variantData.variant_highlights !== undefined) updateData.variant_highlights = variantData.variant_highlights;
    if (variantData.market_status !== undefined) updateData.market_status = variantData.market_status;
    // Powertrain flags from normalization
    if (variantData.has_engine !== undefined) updateData.has_engine = Boolean(variantData.has_engine);
    if (variantData.has_battery !== undefined) updateData.has_battery = Boolean(variantData.has_battery);
    if (variantData.has_motor !== undefined) updateData.has_motor = Boolean(variantData.has_motor);
    if (variantData.has_external_charging !== undefined) updateData.has_external_charging = Boolean(variantData.has_external_charging);
    if (variantData.powertrain_detection_confidence !== undefined) updateData.powertrain_detection_confidence = Number(variantData.powertrain_detection_confidence);

    // Validate automotive constraints before saving
    const validationResult = await VariantIntegrityService.validateAutomotiveConstraints({
      ...before,
      ...updateData,
    });
    if (!validationResult.isValid) {
      throw new AppError(
        `Validation failed: ${validationResult.errors.map((e: any) => e.message).join('; ')}`,
        400
      );
    }

    const variant = await CarVariant.findOneAndUpdate(
      { variant_id: variantId, is_deleted: false },
      updateData,
      { returnDocument: 'after' }
    );

    if (!variant) {
      throw new AppError(
        `Variant not found or deleted for variant_id: ${variantId}`,
        404,
        {
          userMessage: USER_MESSAGES.VARIANT_NOT_FOUND,
          errorCode: ERROR_CODES.VARIANT_NOT_FOUND,
          details: {
            field: 'variant_id',
            reason: 'The variant does not exist or has been deleted.',
          },
        }
      );
    }

    // Record change history for manual edits
    if (before) {
      try {
        await VariantIntegrityService.recordVariantChanges(
          variantId,
          before,
          variant.toObject(),
          actor?.email || 'system',
          'manual_edit'
        );
      } catch (changeTrackingError: any) {
        // Log warning but don't fail the update
        console.warn(
          `Failed to record change history for variant ${variantId}: ${changeTrackingError?.message || changeTrackingError}`
        );
      }
    }

    // Reclassify the variant when classification inputs changed; always recompute
    // the parent car aggregates because variant-level price/transmission/drive/rank
    // edits all change the model-level rollup.
    const classificationInputsChanged =
      variantData.specs_normalized !== undefined ||
      variantData.fuel_type_id !== undefined ||
      variantData.car_id !== undefined ||
      variantData.body_type !== undefined;
    if (classificationInputsChanged) {
      await MileageRecomputeService.recomputeVariant(variant.variant_id);
    }
    await CarAggregationService.recomputeFullAggregates(variant.car_id);

    await AuditUtil.recordChanges({
      entity_type: 'variant',
      entity_id: variant.variant_id,
      before,
      after: variant.toObject(),
      fieldsToTrack: VARIANT_AUDIT_FIELDS,
      actor,
    });

    // Emit a marker row when the specs blob was modified — the diff for the full
    // nested object is too noisy to store per-field but we still want to surface
    // "specs were edited" in the timeline.
    if (variantData.specs_normalized !== undefined) {
      await AuditUtil.recordEvent({
        entity_type: 'variant',
        entity_id: variant.variant_id,
        action: 'update',
        field: 'specs_normalized',
        new_value: { changed: true },
        actor,
      });

      // Phase 5: Update SEO wiring when specs change
      try {
        await SEOAutoWiringService.updateWiringForVariant(
          variant.variant_id,
          variant.car_id,
          variant.specs_normalized
        );
      } catch (err) {
        console.warn(`Failed to update SEO wiring for variant ${variant.variant_id}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    return variant;
  }

  static async deleteVariant(variantId: string, actor: AuditActor | null = null) {
    const variant = await CarVariant.findOneAndUpdate(
      { variant_id: variantId, is_deleted: false },
      { is_deleted: true },
      { returnDocument: 'after' }
    );

    if (!variant) {
      throw new AppError(
        `Variant not found or deleted for variant_id: ${variantId}`,
        404,
        {
          userMessage: USER_MESSAGES.VARIANT_NOT_FOUND,
          errorCode: ERROR_CODES.VARIANT_NOT_FOUND,
          details: {
            field: 'variant_id',
            reason: 'The variant does not exist or has already been deleted.',
          },
        }
      );
    }

    await CarAggregationService.recomputeFullAggregates(variant.car_id);
    await AuditUtil.recordEvent({
      entity_type: 'variant',
      entity_id: variant.variant_id,
      action: 'delete',
      actor,
    });
    return variant;
  }

  static async restoreVariant(variantId: string, actor: AuditActor | null = null) {
    const variant = await CarVariant.findOneAndUpdate(
      { variant_id: variantId, is_deleted: true },
      { is_deleted: false },
      { returnDocument: 'after' }
    );

    if (!variant) {
      throw new AppError(
        `Variant not found for variant_id: ${variantId}`,
        404,
        {
          userMessage: USER_MESSAGES.VARIANT_NOT_FOUND,
          errorCode: ERROR_CODES.VARIANT_NOT_FOUND,
          details: {
            field: 'variant_id',
            reason: 'The variant does not exist in the deleted records.',
          },
        }
      );
    }

    await CarAggregationService.recomputeFullAggregates(variant.car_id);
    await AuditUtil.recordEvent({
      entity_type: 'variant',
      entity_id: variant.variant_id,
      action: 'restore',
      actor,
    });
    return variant;
  }

  static async togglePublish(variantId: string, actor: AuditActor | null = null) {
    const variant = await CarVariant.findOne({ variant_id: variantId, is_deleted: false });
    if (!variant) {
      throw new AppError(
        `Variant not found or deleted for variant_id: ${variantId}`,
        404,
        {
          userMessage: USER_MESSAGES.VARIANT_NOT_FOUND,
          errorCode: ERROR_CODES.VARIANT_NOT_FOUND,
          details: {
            field: 'variant_id',
            reason: 'The variant does not exist or has been deleted.',
          },
        }
      );
    }

    const previous = variant.is_published;
    variant.is_published = !variant.is_published;
    await variant.save();

    await AuditUtil.recordEvent({
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

  static async publishVariant(variantId: string, actor: AuditActor | null = null) {
    const variant = await CarVariant.findOneAndUpdate(
      { variant_id: variantId, is_deleted: false },
      { is_published: true },
      { returnDocument: 'after' }
    );

    if (!variant) {
      throw new AppError(
        `Variant not found or deleted for variant_id: ${variantId}`,
        404,
        {
          userMessage: USER_MESSAGES.VARIANT_NOT_FOUND,
          errorCode: ERROR_CODES.VARIANT_NOT_FOUND,
          details: {
            field: 'variant_id',
            reason: 'The variant does not exist or has been deleted.',
          },
        }
      );
    }

    await AuditUtil.recordEvent({
      entity_type: 'variant',
      entity_id: variant.variant_id,
      action: 'publish',
      field: 'is_published',
      new_value: true,
      actor,
    });
    return variant;
  }

  static async unpublishVariant(variantId: string, actor: AuditActor | null = null) {
    const variant = await CarVariant.findOneAndUpdate(
      { variant_id: variantId, is_deleted: false },
      { is_published: false },
      { returnDocument: 'after' }
    );

    if (!variant) {
      throw new AppError(
        `Variant not found or deleted for variant_id: ${variantId}`,
        404,
        {
          userMessage: USER_MESSAGES.VARIANT_NOT_FOUND,
          errorCode: ERROR_CODES.VARIANT_NOT_FOUND,
          details: {
            field: 'variant_id',
            reason: 'The variant does not exist or has been deleted.',
          },
        }
      );
    }

    await AuditUtil.recordEvent({
      entity_type: 'variant',
      entity_id: variant.variant_id,
      action: 'unpublish',
      field: 'is_published',
      new_value: false,
      actor,
    });
    return variant;
  }

  static async archiveVariant(variantId: string, archivedBy?: string, actor: AuditActor | null = null) {
    const variant = await CarVariant.findOneAndUpdate(
      { variant_id: variantId, is_deleted: false, is_archived: false },
      {
        is_archived: true,
        archived_at: new Date(),
        archived_by: archivedBy
      },
      { returnDocument: 'after' }
    );

    if (!variant) {
      throw new AppError(
        `Variant not found, deleted, or already archived for variant_id: ${variantId}`,
        404,
        {
          userMessage: USER_MESSAGES.VARIANT_NOT_FOUND,
          errorCode: ERROR_CODES.VARIANT_NOT_FOUND,
          details: {
            field: 'variant_id',
            reason: 'The variant does not exist, is deleted, or is already archived.',
          },
        }
      );
    }

    await CarAggregationService.recomputeFullAggregates(variant.car_id);
    await AuditUtil.recordEvent({
      entity_type: 'variant',
      entity_id: variant.variant_id,
      action: 'archive',
      field: 'is_archived',
      new_value: true,
      actor,
    });
    return variant;
  }

  static async unarchiveVariant(variantId: string, actor: AuditActor | null = null) {
    const variant = await CarVariant.findOneAndUpdate(
      { variant_id: variantId, is_deleted: false, is_archived: true },
      {
        is_archived: false,
        archived_at: null,
        archived_by: null
      },
      { returnDocument: 'after' }
    );

    if (!variant) {
      throw new AppError(
        `Variant not found, deleted, or not archived for variant_id: ${variantId}`,
        404,
        {
          userMessage: USER_MESSAGES.VARIANT_NOT_FOUND,
          errorCode: ERROR_CODES.VARIANT_NOT_FOUND,
          details: {
            field: 'variant_id',
            reason: 'The variant does not exist, is deleted, or is not archived.',
          },
        }
      );
    }

    await CarAggregationService.recomputeFullAggregates(variant.car_id);
    await AuditUtil.recordEvent({
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
  private static async enhanceVariantWithNormalization(
    variantData: any,
    fuel_type_id: string | undefined
  ): Promise<any> {
    try {
      const specs_raw = variantData.specs_raw as Record<string, any> | undefined;
      if (!specs_raw || Object.keys(specs_raw).length === 0) {
        return variantData; // Nothing to normalize
      }

      // Get fuel_type slug for powertrain detection
      let fuel_type_slug = 'petrol'; // default
      if (fuel_type_id) {
        const fuelType = await FuelType.findOne({ fuel_type_id, is_deleted: false });
        if (fuelType?.slug) {
          fuel_type_slug = fuelType.slug;
        }
      }

      // Run normalization engine on specs_raw
      const normalizationReport = ImportNormalizerService.normalize(specs_raw);

      // Detect powertrain capabilities from normalized specs
      const powertrainFlags = PowertrainDetectorService.detect(
        normalizationReport.specs_normalized,
        fuel_type_slug
      );

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
    } catch (error) {
      // Log but don't fail — normalization is an enhancement, not a requirement
      console.warn(
        `Failed to enhance variant with normalization: ${error instanceof Error ? error.message : String(error)}`
      );
      return variantData;
    }
  }
}
