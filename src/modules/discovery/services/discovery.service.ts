import { BodyType } from '../../../models/body-type.model';
import { Brand } from '../../../models/brand.model';
import { CarVariant } from '../../../models/car-variant.model';
import { Car } from '../../../models/car.model';
import { FuelType } from '../../../models/fuel-type.model';
import { Tag } from '../../../models/tag.model';
import { TagCategory } from '../../../models/tag-category.model';
import { MileageClass } from '../../../constants/mileage-benchmarks';
import { PaginationUtil } from '../../../shared/utils/pagination.util';
import { PlatformSettingsService } from '../../settings/services/platform-settings.service';

// Module-level facet cache. Key = stable JSON of resolved filters + variant IDs.
// Evicted when cache grows past 300 entries or when TTL expires per entry.
const _facetCache = new Map<string, { result: unknown; expiresAt: number }>();
const FACET_CACHE_MAX = 300;
const FACET_CACHE_DEFAULT_TTL_MS = 300_000; // 5 min — overridden by settings at runtime

/**
 * Discovery filter input. All keys are optional. Plural slug keys accept either
 * a CSV string from a query string or an actual array (when called from JSON
 * bodies, e.g. by the SeoPreset hydrator).
 *
 * Prices are stored in **rupees** (matching the Car/CarVariant model). The
 * frontend can convert from Lakhs (1 L = ₹100,000) before submitting.
 */
export interface DiscoveryFilters {
  q?: string;

  // Slug-based identity filters
  tags?: string | string[];
  intent?: string | string[];
  brand_slugs?: string | string[];
  body_type_slugs?: string | string[];
  fuel_type_slugs?: string | string[];

  // Tag matching mode: 'any' (default, OR) or 'all' (AND)
  tags_mode?: 'any' | 'all';

  // Price + spec
  min_price?: number | string;
  max_price?: number | string;
  seating_min?: number | string;
  seating_max?: number | string;
  transmission?: string | string[]; // csv: manual,automatic,cvt,dct,amt

  // Safety / ADAS
  safety_min_airbags?: number | string;
  adas?: boolean | string;

  // Intelligence
  mileage_class?: string | string[];
  range_class?: string | string[];

  // Status — defaults to public visible (excludes archived/disabled)
  status?: string | string[];
  is_electric?: boolean | string;

  // ── Batch 1+2 aggregate dimensions (cross-site connectivity) ──
  // Vehicle segment classification (manual).
  vehicle_segment?: string | string[];
  // Powertrain aggregates — buyer-facing labels (e.g. "Manual", "DCT", "AWD").
  transmission_types?: string | string[];
  drive_types?: string | string[];
  // Performance ranges from aggregated min/max fields.
  min_power_bhp?: number | string;
  max_power_bhp?: number | string;
  min_torque_nm?: number | string;
  max_torque_nm?: number | string;
  // Safety floor — min NCAP rating (uses best_ncap_rating field).
  min_ncap_rating?: number | string;
  // Feature availability booleans — at least one variant has this.
  has_sunroof?: boolean | string;
  has_panoramic_sunroof?: boolean | string;
  has_adas?: boolean | string;
  has_ventilated_seats?: boolean | string;
  has_camera_360?: boolean | string;
  has_connected_car?: boolean | string;
  has_wireless_charger?: boolean | string;
  has_air_purifier?: boolean | string;
  // AI intelligence booleans — rules+LLM derived.
  family_friendly?: boolean | string;
  city_friendly?: boolean | string;
  highway_friendly?: boolean | string;
  offroad_ready?: boolean | string;
  feature_loaded?: boolean | string;
  premium_cabin?: boolean | string;
  budget_friendly?: boolean | string;
  performance_focused?: boolean | string;

  // Pagination + sort
  page?: number | string;
  limit?: number | string;
  sortBy?: SortKey;
}

export type SortKey =
  | 'price_asc'
  | 'price_desc'
  | 'mileage'
  | 'range'
  | 'popularity'
  | 'newest'
  | 'name';

export interface DiscoveryFacetCount {
  value: string;
  label?: string;
  count: number;
}

export interface DiscoveryFacets {
  brand: DiscoveryFacetCount[];
  body_type: DiscoveryFacetCount[];
  fuel_type: DiscoveryFacetCount[];
  status: DiscoveryFacetCount[];
  mileage_class: DiscoveryFacetCount[];
  range_class: DiscoveryFacetCount[];
  is_electric: DiscoveryFacetCount[];
  tags: DiscoveryFacetCount[];
  // Batch 5 — feature availability + AI intelligence facets.
  vehicle_segment: DiscoveryFacetCount[];
  transmission_types: DiscoveryFacetCount[];
  drive_types: DiscoveryFacetCount[];
  features: DiscoveryFacetCount[];      // single combined facet: sunroof, ADAS, 360cam, etc.
  intelligence: DiscoveryFacetCount[];  // single combined facet: family_friendly, etc.
}

export interface ResolvedFilters {
  q?: string;
  tag_ids: string[];
  tag_match_mode: 'any' | 'all';
  brand_ids: string[];
  body_type_ids: string[];
  fuel_type_ids: string[];
  min_price?: number;
  max_price?: number;
  seating_min?: number;
  seating_max?: number;
  transmissions: string[];
  safety_min_airbags?: number;
  adas?: boolean;
  mileage_class: string[];
  range_class: string[];
  statuses: string[];
  is_electric?: boolean;
  // Whether the caller explicitly requested archived/disabled (admin) — if not,
  // we hide those statuses publicly.
  show_hidden_statuses: boolean;
  // ── Batch 5 — resolved cross-site aggregate filters ──
  vehicle_segments: string[];
  aggregated_transmission_types: string[];
  aggregated_drive_types: string[];
  min_power_bhp?: number;
  max_power_bhp?: number;
  min_torque_nm?: number;
  max_torque_nm?: number;
  min_ncap_rating?: number;
  // Feature availability — set means require true.
  feature_flags: Partial<{
    sunroof_available: boolean;
    panoramic_sunroof_available: boolean;
    adas_available: boolean;
    ventilated_seats_available: boolean;
    camera_360_available: boolean;
    connected_car_available: boolean;
    wireless_charger_available: boolean;
    air_purifier_available: boolean;
  }>;
  // AI intelligence — set means require true.
  intelligence_flags: Partial<{
    family_friendly: boolean;
    city_friendly: boolean;
    highway_friendly: boolean;
    offroad_ready: boolean;
    feature_loaded: boolean;
    premium_cabin: boolean;
    budget_friendly: boolean;
    performance_focused: boolean;
  }>;
}

function csvToArray(input: unknown): string[] {
  if (Array.isArray(input)) return input.map(String).map(s => s.trim()).filter(Boolean);
  if (typeof input === 'string' && input.length > 0) return input.split(',').map(s => s.trim()).filter(Boolean);
  return [];
}

function parseBoolean(input: unknown): boolean | undefined {
  if (input === undefined || input === null || input === '') return undefined;
  if (typeof input === 'boolean') return input;
  if (typeof input === 'string') {
    if (input === 'true' || input === '1') return true;
    if (input === 'false' || input === '0') return false;
  }
  return undefined;
}

function parseNumber(input: unknown): number | undefined {
  if (input === undefined || input === null || input === '') return undefined;
  const n = typeof input === 'number' ? input : Number(input);
  return Number.isFinite(n) ? n : undefined;
}

export class DiscoveryService {
  /**
   * Resolve the public-facing filter shape (slugs, csvs, etc.) into the
   * concrete id/value shape used by the Car/CarVariant queries. Done once per
   * request because every facet count re-uses the resolved set.
   */
  static async resolveFilters(filters: DiscoveryFilters): Promise<ResolvedFilters> {
    const brandSlugs = csvToArray(filters.brand_slugs);
    const bodyTypeSlugs = csvToArray(filters.body_type_slugs);
    const fuelTypeSlugs = csvToArray(filters.fuel_type_slugs);
    const tagSlugs = csvToArray(filters.tags);
    const intentSlugs = csvToArray(filters.intent);

    const tagMatchMode: 'any' | 'all' = filters.tags_mode === 'all' ? 'all' : 'any';

    const [brands, bodyTypes, fuelTypes, namedTags, intentCategory] = await Promise.all([
      brandSlugs.length ? Brand.find({ slug: { $in: brandSlugs }, is_deleted: false }).select('brand_id').lean() : Promise.resolve([] as Array<{ brand_id: string }>),
      bodyTypeSlugs.length ? BodyType.find({ slug: { $in: bodyTypeSlugs }, is_deleted: false }).select('body_type_id').lean() : Promise.resolve([] as Array<{ body_type_id: string }>),
      fuelTypeSlugs.length ? FuelType.find({ slug: { $in: fuelTypeSlugs }, is_deleted: false }).select('fuel_type_id').lean() : Promise.resolve([] as Array<{ fuel_type_id: string }>),
      tagSlugs.length ? Tag.find({ slug: { $in: tagSlugs }, is_deleted: false, is_published: true }).select('tag_id').lean() : Promise.resolve([] as Array<{ tag_id: string }>),
      intentSlugs.length ? TagCategory.findOne({ type: 'intent', is_deleted: false, is_published: true }).select('tag_category_id').lean() : Promise.resolve(null),
    ]);

    const tagIds = namedTags.map(t => t.tag_id);

    if (intentSlugs.length && intentCategory) {
      const intentTags = await Tag.find({
        slug: { $in: intentSlugs },
        tag_category_id: intentCategory.tag_category_id,
        is_deleted: false,
        is_published: true,
      }).select('tag_id').lean();
      tagIds.push(...intentTags.map(t => t.tag_id));
    }

    const statuses = csvToArray(filters.status);
    const showHidden = statuses.includes('archived') || statuses.includes('disabled');

    const transmissionsRaw = csvToArray(filters.transmission).map(s => s.toLowerCase());
    const allowedTransmissions = new Set(['manual', 'automatic', 'cvt', 'dct', 'amt']);
    const transmissions = transmissionsRaw.filter(t => allowedTransmissions.has(t));

    const mileageClassRaw = csvToArray(filters.mileage_class);
    const allowedClasses = new Set<string>(['weak', 'average', 'good', 'excellent']);
    const mileage_class = mileageClassRaw.filter(c => allowedClasses.has(c));
    const range_class = csvToArray(filters.range_class).filter(c => allowedClasses.has(c));

    // Batch 5 — aggregate dimensions.
    const vehicleSegments = csvToArray(filters.vehicle_segment);
    const aggregatedTransmissionTypes = csvToArray(filters.transmission_types);
    const aggregatedDriveTypes = csvToArray(filters.drive_types);

    const collectBoolean = (input: unknown): boolean | undefined => parseBoolean(input);

    const feature_flags: ResolvedFilters['feature_flags'] = {};
    const featureMap: Array<[keyof DiscoveryFilters, keyof ResolvedFilters['feature_flags']]> = [
      ['has_sunroof', 'sunroof_available'],
      ['has_panoramic_sunroof', 'panoramic_sunroof_available'],
      ['has_adas', 'adas_available'],
      ['has_ventilated_seats', 'ventilated_seats_available'],
      ['has_camera_360', 'camera_360_available'],
      ['has_connected_car', 'connected_car_available'],
      ['has_wireless_charger', 'wireless_charger_available'],
      ['has_air_purifier', 'air_purifier_available'],
    ];
    for (const [src, dst] of featureMap) {
      const v = collectBoolean(filters[src]);
      if (v !== undefined) feature_flags[dst] = v;
    }

    const intelligence_flags: ResolvedFilters['intelligence_flags'] = {};
    const intMap: Array<keyof ResolvedFilters['intelligence_flags']> = [
      'family_friendly',
      'city_friendly',
      'highway_friendly',
      'offroad_ready',
      'feature_loaded',
      'premium_cabin',
      'budget_friendly',
      'performance_focused',
    ];
    for (const key of intMap) {
      const v = collectBoolean(filters[key]);
      if (v !== undefined) intelligence_flags[key] = v;
    }

    return {
      q: filters.q,
      tag_ids: Array.from(new Set(tagIds)),
      tag_match_mode: tagMatchMode,
      brand_ids: brands.map(b => b.brand_id),
      body_type_ids: bodyTypes.map(b => b.body_type_id),
      fuel_type_ids: fuelTypes.map(f => f.fuel_type_id),
      min_price: parseNumber(filters.min_price),
      max_price: parseNumber(filters.max_price),
      seating_min: parseNumber(filters.seating_min),
      seating_max: parseNumber(filters.seating_max),
      transmissions,
      safety_min_airbags: parseNumber(filters.safety_min_airbags),
      adas: parseBoolean(filters.adas),
      mileage_class,
      range_class,
      statuses,
      is_electric: parseBoolean(filters.is_electric),
      show_hidden_statuses: showHidden,
      vehicle_segments: vehicleSegments,
      aggregated_transmission_types: aggregatedTransmissionTypes,
      aggregated_drive_types: aggregatedDriveTypes,
      min_power_bhp: parseNumber(filters.min_power_bhp),
      max_power_bhp: parseNumber(filters.max_power_bhp),
      min_torque_nm: parseNumber(filters.min_torque_nm),
      max_torque_nm: parseNumber(filters.max_torque_nm),
      min_ncap_rating: parseNumber(filters.min_ncap_rating),
      feature_flags,
      intelligence_flags,
    };
  }

  /**
   * Filter variants by the variant-level dimensions (price, transmission,
   * seating, safety, adas) and return the distinct car_ids they belong to.
   * Returns null when the caller passed no variant-level filters, so callers can
   * skip the secondary query entirely.
   */
  static async getCarIdsFromVariantFilters(resolved: ResolvedFilters): Promise<string[] | null> {
    const hasPrice = resolved.min_price !== undefined || resolved.max_price !== undefined;
    const hasSeating = resolved.seating_min !== undefined || resolved.seating_max !== undefined;
    const hasTransmission = resolved.transmissions.length > 0;
    const hasSafety = resolved.safety_min_airbags !== undefined;
    const hasAdas = resolved.adas !== undefined;

    if (!hasPrice && !hasSeating && !hasTransmission && !hasSafety && !hasAdas) {
      return null;
    }

    const filter: Record<string, unknown> = {
      is_deleted: false,
      is_archived: false,
    };

    if (hasPrice) {
      const range: Record<string, number> = {};
      if (resolved.min_price !== undefined) range.$gte = resolved.min_price;
      if (resolved.max_price !== undefined) range.$lte = resolved.max_price;
      filter.$or = [
        { ex_showroom_price: range },
        { expected_price: range },
      ];
    }

    if (hasSeating) {
      const range: Record<string, number> = {};
      if (resolved.seating_min !== undefined) range.$gte = resolved.seating_min;
      if (resolved.seating_max !== undefined) range.$lte = resolved.seating_max;
      filter.seating_capacity = range;
    }

    if (hasTransmission) {
      filter.transmission_type = { $in: resolved.transmissions };
    }

    if (hasSafety) {
      filter['specs_normalized.safety.airbags'] = { $gte: resolved.safety_min_airbags };
    }

    if (hasAdas !== undefined && resolved.adas !== undefined) {
      // ADAS "yes" → at least one ADAS field is truthy. We approximate this with
      // adaptive_cruise_control || lane_keep_assist (the spec's two strongest signals).
      if (resolved.adas) {
        filter['$or'] = [
          ...(Array.isArray(filter['$or']) ? (filter['$or'] as any[]) : []),
          { 'specs_normalized.adas.adaptive_cruise_control': true },
          { 'specs_normalized.adas.lane_keep_assist': true },
          { 'specs_normalized.adas.automatic_emergency_braking': true },
        ];
      }
    }

    return CarVariant.find(filter).distinct('car_id');
  }

  /**
   * Apply the car-level filters, returning the Mongo filter object.
   * `excludeDimension` lets the facet pipeline drop one dimension at a time so
   * each facet's counts reflect *everything except* that dimension.
   */
  static buildCarFilter(
    resolved: ResolvedFilters,
    variantMatchedCarIds: string[] | null,
    excludeDimension?: keyof DiscoveryFacets
  ): Record<string, unknown> {
    const filter: Record<string, unknown> = {
      is_deleted: false,
    };

    // Default to public-visible cars unless the caller asked for hidden statuses.
    if (resolved.statuses.length > 0) {
      filter.status = { $in: resolved.statuses };
    } else if (!resolved.show_hidden_statuses) {
      filter.status = { $nin: ['archived', 'disabled'] };
      // Public discovery should also be published only.
      filter.is_published = true;
    }

    if (resolved.q) {
      const safe = resolved.q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$and = [
        ...(Array.isArray(filter.$and) ? (filter.$and as any[]) : []),
        { $or: [{ name: { $regex: safe, $options: 'i' } }, { short_description: { $regex: safe, $options: 'i' } }] },
      ];
    }

    if (excludeDimension !== 'brand' && resolved.brand_ids.length > 0) {
      filter.brand_id = { $in: resolved.brand_ids };
    }
    if (excludeDimension !== 'body_type' && resolved.body_type_ids.length > 0) {
      filter.body_type_id = { $in: resolved.body_type_ids };
    }
    if (excludeDimension !== 'fuel_type' && resolved.fuel_type_ids.length > 0) {
      filter.fuel_type_id = { $in: resolved.fuel_type_ids };
    }
    if (excludeDimension !== 'mileage_class' && resolved.mileage_class.length > 0) {
      filter.best_mileage_class = { $in: resolved.mileage_class };
    }
    if (excludeDimension !== 'range_class' && resolved.range_class.length > 0) {
      filter.best_range_class = { $in: resolved.range_class };
    }
    if (excludeDimension !== 'is_electric' && resolved.is_electric !== undefined) {
      filter.is_electric = resolved.is_electric;
    }

    if (excludeDimension !== 'tags' && resolved.tag_ids.length > 0) {
      if (resolved.tag_match_mode === 'all') {
        filter.tag_ids = { $all: resolved.tag_ids };
      } else {
        filter.tag_ids = { $in: resolved.tag_ids };
      }
    }

    // ── Batch 5 — aggregate dimensions (cross-site connectivity) ──
    if (excludeDimension !== 'vehicle_segment' && resolved.vehicle_segments.length > 0) {
      filter.vehicle_segment = { $in: resolved.vehicle_segments };
    }
    if (excludeDimension !== 'transmission_types' && resolved.aggregated_transmission_types.length > 0) {
      filter.aggregated_transmission_types = { $in: resolved.aggregated_transmission_types };
    }
    if (excludeDimension !== 'drive_types' && resolved.aggregated_drive_types.length > 0) {
      filter.aggregated_drive_types = { $in: resolved.aggregated_drive_types };
    }
    if (resolved.min_power_bhp !== undefined || resolved.max_power_bhp !== undefined) {
      const range: Record<string, number> = {};
      if (resolved.min_power_bhp !== undefined) range.$gte = resolved.min_power_bhp;
      if (resolved.max_power_bhp !== undefined) range.$lte = resolved.max_power_bhp;
      // Match cars whose power range overlaps the requested range — use max_power_bhp
      // for the lower bound and min_power_bhp for the upper bound. Simpler: filter on
      // power_max_bhp >= min_requested AND power_min_bhp <= max_requested.
      const conditions: any[] = [];
      if (resolved.min_power_bhp !== undefined) conditions.push({ power_max_bhp: { $gte: resolved.min_power_bhp } });
      if (resolved.max_power_bhp !== undefined) conditions.push({ power_min_bhp: { $lte: resolved.max_power_bhp } });
      filter.$and = [...(Array.isArray(filter.$and) ? (filter.$and as any[]) : []), ...conditions];
    }
    if (resolved.min_torque_nm !== undefined || resolved.max_torque_nm !== undefined) {
      const conditions: any[] = [];
      if (resolved.min_torque_nm !== undefined) conditions.push({ torque_max_nm: { $gte: resolved.min_torque_nm } });
      if (resolved.max_torque_nm !== undefined) conditions.push({ torque_min_nm: { $lte: resolved.max_torque_nm } });
      filter.$and = [...(Array.isArray(filter.$and) ? (filter.$and as any[]) : []), ...conditions];
    }
    if (resolved.min_ncap_rating !== undefined) {
      filter.best_ncap_rating = { $gte: resolved.min_ncap_rating };
    }
    if (excludeDimension !== 'features') {
      for (const [key, value] of Object.entries(resolved.feature_flags)) {
        if (value !== undefined) filter[key] = value;
      }
    }
    if (excludeDimension !== 'intelligence') {
      for (const [key, value] of Object.entries(resolved.intelligence_flags)) {
        if (value !== undefined) filter[key] = value;
      }
    }

    if (variantMatchedCarIds !== null) {
      filter.car_id = { $in: variantMatchedCarIds };
    }

    return filter;
  }

  static getSortClause(sortBy: SortKey | undefined): Record<string, 1 | -1> {
    switch (sortBy) {
      case 'price_asc':
        // Cars store exshowroom_price for launched, expected_exshowroom_price for upcoming.
        // Mongo doesn't have a built-in coalesce in sort, so we sort by exshowroom_price
        // ascending and let documents without it land at the top with $exists handling
        // elsewhere — but for first cut, prefer the launched price column.
        return { exshowroom_price: 1, expected_exshowroom_price: 1 };
      case 'price_desc':
        return { exshowroom_price: -1, expected_exshowroom_price: -1 };
      case 'mileage':
        return { best_mileage_value: -1 };
      case 'range':
        return { best_range_value: -1 };
      case 'popularity':
        return { is_popular: -1, is_featured: -1, is_latest: -1, createdAt: -1 };
      case 'newest':
        return { createdAt: -1 };
      case 'name':
      default:
        return { name: 1 };
    }
  }

  /** Full discovery query: list + pagination + facet counts. */
  static async discover(filters: DiscoveryFilters) {
    const resolved = await this.resolveFilters(filters);
    const variantMatchedCarIds = await this.getCarIdsFromVariantFilters(resolved);

    // Fast-fail: variant filters were given but matched nothing → empty result.
    if (variantMatchedCarIds !== null && variantMatchedCarIds.length === 0) {
      return {
        cars: [],
        pagination: PaginationUtil.createPaginationMeta(1, 0, 0),
        facets: {
          brand: [],
          body_type: [],
          fuel_type: [],
          status: [],
          mileage_class: [],
          range_class: [],
          is_electric: [],
          tags: [],
          vehicle_segment: [],
          transmission_types: [],
          drive_types: [],
          features: [],
          intelligence: [],
        } as DiscoveryFacets,
        applied: resolved,
      };
    }

    const carFilter = this.buildCarFilter(resolved, variantMatchedCarIds);
    const pageNum = parseNumber(filters.page) ?? 1;
    const limitNum = parseNumber(filters.limit) ?? 10;
    const { skip, limit } = PaginationUtil.getPaginationParams(pageNum, limitNum);
    const sort = this.getSortClause(filters.sortBy);

    const [cars, total, facets] = await Promise.all([
      Car.find(carFilter)
        .select(
          'car_id name slug brand_id body_type_id fuel_type_id short_description thumbnail status ' +
          'is_upcoming is_launched expected_exshowroom_price exshowroom_price is_electric ' +
          'is_published is_featured is_popular is_recommended is_latest top_selling tag_ids ' +
          'best_mileage_class best_mileage_value best_range_class best_range_value ' +
          'redirect_to_slug archived_at disabled_at discontinued_at meta_title meta_description ' +
          // Batch 5 — include the aggregate fields so the public listing can render
          // "Cars with sunroof / family-friendly" badges without a second fetch.
          'vehicle_segment min_variant_price max_variant_price aggregated_fuel_types ' +
          'aggregated_transmission_types aggregated_drive_types ' +
          'power_min_bhp power_max_bhp torque_min_nm torque_max_nm ' +
          'sunroof_available adas_available camera_360_available ventilated_seats_available ' +
          'connected_car_available wireless_charger_available panoramic_sunroof_available ' +
          'best_ncap_rating max_airbags max_seating_capacity ' +
          'family_friendly city_friendly highway_friendly offroad_ready ' +
          'feature_loaded premium_cabin budget_friendly performance_focused'
        )
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Car.countDocuments(carFilter),
      this.buildFacets(resolved, variantMatchedCarIds),
    ]);

    return {
      cars,
      pagination: PaginationUtil.createPaginationMeta(pageNum, limit, total),
      facets,
      applied: resolved,
    };
  }

  /**
   * Build the facet count breakdowns. Each dimension is counted using the same
   * filter as the main query, minus that dimension — standard faceted search.
   */
  static async buildFacets(
    resolved: ResolvedFilters,
    variantMatchedCarIds: string[] | null
  ): Promise<DiscoveryFacets> {
    // Check facet cache first (keyed on stable JSON of inputs).
    const cacheKey = JSON.stringify({ resolved, vmIds: variantMatchedCarIds ? [...variantMatchedCarIds].sort() : null });
    const now = Date.now();
    const cached = _facetCache.get(cacheKey);
    if (cached && cached.expiresAt > now) return cached.result as DiscoveryFacets;

    const dims: Array<{
      key: keyof DiscoveryFacets;
      groupBy: string;
      unwind?: string;
    }> = [
      { key: 'brand', groupBy: '$brand_id' },
      { key: 'body_type', groupBy: '$body_type_id' },
      { key: 'fuel_type', groupBy: '$fuel_type_id' },
      { key: 'status', groupBy: '$status' },
      { key: 'mileage_class', groupBy: '$best_mileage_class' },
      { key: 'range_class', groupBy: '$best_range_class' },
      { key: 'is_electric', groupBy: '$is_electric' },
      { key: 'tags', groupBy: '$tag_ids', unwind: '$tag_ids' },
      // Batch 5 — aggregate dimensions
      { key: 'vehicle_segment', groupBy: '$vehicle_segment' },
      { key: 'transmission_types', groupBy: '$aggregated_transmission_types', unwind: '$aggregated_transmission_types' },
      { key: 'drive_types', groupBy: '$aggregated_drive_types', unwind: '$aggregated_drive_types' },
    ];

    const out: DiscoveryFacets = {
      brand: [],
      body_type: [],
      fuel_type: [],
      status: [],
      mileage_class: [],
      range_class: [],
      is_electric: [],
      tags: [],
      vehicle_segment: [],
      transmission_types: [],
      drive_types: [],
      features: [],
      intelligence: [],
    };

    // Consolidate all 11 facet dimensions into a single aggregation pipeline with $facet
    // This reduces 11 separate database queries to 1 query with 11 parallel facets
    const facetPipeline: Record<string, any[]> = {};
    for (const dim of dims) {
      const facetFilter = this.buildCarFilter(resolved, variantMatchedCarIds, dim.key);
      const subpipeline: any[] = [{ $match: facetFilter }];
      if (dim.unwind) subpipeline.push({ $unwind: dim.unwind });
      subpipeline.push({ $group: { _id: dim.groupBy, count: { $sum: 1 } } });
      subpipeline.push({ $sort: { count: -1 as const } });
      subpipeline.push({ $limit: 50 });
      facetPipeline[dim.key] = subpipeline;
    }

    const facetResults = await Car.aggregate([
      { $facet: facetPipeline }
    ]);

    if (facetResults.length > 0) {
      const result = facetResults[0];
      for (const dim of dims) {
        const rows = result[dim.key] || [];
        out[dim.key] = rows
          .filter((r: any) => r._id !== null && r._id !== undefined && r._id !== '')
          .map((r: any) => ({ value: String(r._id), count: r.count }));
      }
    }

    // Batch 5 — count cars per feature-availability flag and per AI-intelligence
    // flag. These are 8 boolean dimensions each, so we count them as a combined
    // facet (one entry per flag rather than per group-by value).
    const featureKeys: Array<keyof typeof out & string> = [];
    const featureFields = [
      { key: 'sunroof_available', label: 'Sunroof' },
      { key: 'panoramic_sunroof_available', label: 'Panoramic sunroof' },
      { key: 'adas_available', label: 'ADAS' },
      { key: 'ventilated_seats_available', label: 'Ventilated seats' },
      { key: 'camera_360_available', label: '360° camera' },
      { key: 'connected_car_available', label: 'Connected car' },
      { key: 'wireless_charger_available', label: 'Wireless charger' },
      { key: 'air_purifier_available', label: 'Air purifier' },
    ];
    const intelligenceFields = [
      { key: 'family_friendly', label: 'Family-friendly' },
      { key: 'city_friendly', label: 'City-friendly' },
      { key: 'highway_friendly', label: 'Highway-friendly' },
      { key: 'offroad_ready', label: 'Offroad-ready' },
      { key: 'feature_loaded', label: 'Feature-loaded' },
      { key: 'premium_cabin', label: 'Premium cabin' },
      { key: 'budget_friendly', label: 'Budget-friendly' },
      { key: 'performance_focused', label: 'Performance-focused' },
    ];

    const featureFacetFilter = this.buildCarFilter(resolved, variantMatchedCarIds, 'features');
    const intelligenceFacetFilter = this.buildCarFilter(resolved, variantMatchedCarIds, 'intelligence');

    // Single aggregation pipeline with $facet to count all boolean flags in 2 queries instead of 16
    const [featureAgg, intelligenceAgg] = await Promise.all([
      Car.aggregate([
        { $match: featureFacetFilter },
        {
          $facet: Object.fromEntries(
            featureFields.map(f => [
              f.key,
              [{ $match: { [f.key]: true } }, { $count: 'count' }],
            ]),
          ),
        },
      ]),
      Car.aggregate([
        { $match: intelligenceFacetFilter },
        {
          $facet: Object.fromEntries(
            intelligenceFields.map(f => [
              f.key,
              [{ $match: { [f.key]: true } }, { $count: 'count' }],
            ]),
          ),
        },
      ]),
    ]);

    const featureCountsArr = featureFields.map(f => ({
      ...f,
      count: featureAgg[0][f.key]?.[0]?.count ?? 0,
    }));
    const intelligenceCountsArr = intelligenceFields.map(f => ({
      ...f,
      count: intelligenceAgg[0][f.key]?.[0]?.count ?? 0,
    }));
    void featureKeys; // (lint silence) — kept for future per-flag exclusion granularity
    out.features = featureCountsArr.filter(f => f.count > 0).map(f => ({ value: f.key, label: f.label, count: f.count }));
    out.intelligence = intelligenceCountsArr.filter(f => f.count > 0).map(f => ({ value: f.key, label: f.label, count: f.count }));

    // Hydrate display labels for the slug-based facets so the frontend doesn't
    // have to re-query lookup tables.
    const [brands, bodyTypes, fuelTypes, tags] = await Promise.all([
      out.brand.length ? Brand.find({ brand_id: { $in: out.brand.map(b => b.value) } }).select('brand_id name slug').lean() : Promise.resolve([] as Array<any>),
      out.body_type.length ? BodyType.find({ body_type_id: { $in: out.body_type.map(b => b.value) } }).select('body_type_id name slug').lean() : Promise.resolve([] as Array<any>),
      out.fuel_type.length ? FuelType.find({ fuel_type_id: { $in: out.fuel_type.map(b => b.value) } }).select('fuel_type_id name slug').lean() : Promise.resolve([] as Array<any>),
      out.tags.length ? Tag.find({ tag_id: { $in: out.tags.map(t => t.value) } }).select('tag_id name slug').lean() : Promise.resolve([] as Array<any>),
    ]);

    const brandById = new Map(brands.map((b: any) => [b.brand_id, { name: b.name, slug: b.slug }]));
    const bodyTypeById = new Map(bodyTypes.map((b: any) => [b.body_type_id, { name: b.name, slug: b.slug }]));
    const fuelTypeById = new Map(fuelTypes.map((f: any) => [f.fuel_type_id, { name: f.name, slug: f.slug }]));
    const tagById = new Map(tags.map((t: any) => [t.tag_id, { name: t.name, slug: t.slug }]));

    out.brand = out.brand.map(f => ({ ...f, label: brandById.get(f.value)?.name, value: brandById.get(f.value)?.slug ?? f.value }));
    out.body_type = out.body_type.map(f => ({ ...f, label: bodyTypeById.get(f.value)?.name, value: bodyTypeById.get(f.value)?.slug ?? f.value }));
    out.fuel_type = out.fuel_type.map(f => ({ ...f, label: fuelTypeById.get(f.value)?.name, value: fuelTypeById.get(f.value)?.slug ?? f.value }));
    out.tags = out.tags.map(f => ({ ...f, label: tagById.get(f.value)?.name, value: tagById.get(f.value)?.slug ?? f.value }));

    // Store in cache with TTL from settings (falls back to module-level default).
    let ttlMs = FACET_CACHE_DEFAULT_TTL_MS;
    try {
      const perf = await PlatformSettingsService.getSettingsByGroup('performance') as Record<string, any>;
      if (typeof perf.discovery_cache_ttl_ms === 'number') ttlMs = perf.discovery_cache_ttl_ms;
    } catch { /* use default TTL */ }

    if (_facetCache.size >= FACET_CACHE_MAX) _facetCache.clear();
    _facetCache.set(cacheKey, { result: out, expiresAt: Date.now() + ttlMs });

    return out;
  }

  /** Lightweight count-only call used by SEO preset preview. */
  static async count(filters: DiscoveryFilters): Promise<number> {
    const resolved = await this.resolveFilters(filters);
    const variantMatchedCarIds = await this.getCarIdsFromVariantFilters(resolved);
    if (variantMatchedCarIds !== null && variantMatchedCarIds.length === 0) return 0;
    const carFilter = this.buildCarFilter(resolved, variantMatchedCarIds);
    return Car.countDocuments(carFilter);
  }

  /** Get available filters grouped by dimension. Returns facet counts for all dimensions. */
  static async getAvailableFilters(): Promise<{ [key: string]: DiscoveryFacetCount[] }> {
    const emptyFilters: DiscoveryFilters = { page: 1, limit: 20 };
    const result = await this.discover(emptyFilters);
    return {
      brands: result.facets.brand,
      body_types: result.facets.body_type,
      fuel_types: result.facets.fuel_type,
      vehicle_segments: result.facets.vehicle_segment,
      transmission_types: result.facets.transmission_types,
      drive_types: result.facets.drive_types,
      features: result.facets.features,
      intelligence: result.facets.intelligence,
      tags: result.facets.tags,
    };
  }

  /** Get all facet groups (categories for filtering). */
  static async getFacetGroups() {
    return [
      { name: 'Brands', key: 'brand', type: 'category' },
      { name: 'Body Type', key: 'body_type', type: 'category' },
      { name: 'Fuel Type', key: 'fuel_type', type: 'category' },
      { name: 'Vehicle Segment', key: 'vehicle_segment', type: 'category' },
      { name: 'Transmission', key: 'transmission_types', type: 'category' },
      { name: 'Drive Type', key: 'drive_types', type: 'category' },
      { name: 'Features', key: 'features', type: 'boolean' },
      { name: 'Intelligence', key: 'intelligence', type: 'boolean' },
      { name: 'Tags', key: 'tags', type: 'category' },
    ];
  }

  /** Get filter options for a specific dimension. */
  static async getFilterOptions(dimension: string): Promise<DiscoveryFacetCount[]> {
    const emptyFilters: DiscoveryFilters = { page: 1, limit: 20 };
    const result = await this.discover(emptyFilters);
    const facetMap: { [key: string]: DiscoveryFacetCount[] } = {
      brand: result.facets.brand,
      body_type: result.facets.body_type,
      fuel_type: result.facets.fuel_type,
      vehicle_segment: result.facets.vehicle_segment,
      transmission_types: result.facets.transmission_types,
      drive_types: result.facets.drive_types,
      features: result.facets.features,
      intelligence: result.facets.intelligence,
      tags: result.facets.tags,
    };
    return facetMap[dimension] || [];
  }
}

// Re-export the class type alias for backend convenience.
export type DiscoveryMileageClass = MileageClass;

/** Clears the in-memory facet cache. Called by the performance settings clear action. */
export function clearDiscoveryFacetCache(): void {
  _facetCache.clear();
}
