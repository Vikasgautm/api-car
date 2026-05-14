import { BodyType } from '../../../models/body-type.model';
import { Brand } from '../../../models/brand.model';
import { CarVariant } from '../../../models/car-variant.model';
import { Car } from '../../../models/car.model';
import { FuelType } from '../../../models/fuel-type.model';
import { Tag } from '../../../models/tag.model';
import { TagCategory } from '../../../models/tag-category.model';
import { MileageClass } from '../../../constants/mileage-benchmarks';
import { PaginationUtil } from '../../../shared/utils/pagination.util';

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
          'redirect_to_slug archived_at disabled_at discontinued_at meta_title meta_description'
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
    };

    await Promise.all(
      dims.map(async dim => {
        const facetFilter = this.buildCarFilter(resolved, variantMatchedCarIds, dim.key);
        const pipeline: any[] = [{ $match: facetFilter }];
        if (dim.unwind) pipeline.push({ $unwind: dim.unwind });
        pipeline.push({ $group: { _id: dim.groupBy, count: { $sum: 1 } } });
        pipeline.push({ $sort: { count: -1 as const } });
        pipeline.push({ $limit: 50 });

        const rows = await Car.aggregate(pipeline);
        out[dim.key] = rows
          .filter(r => r._id !== null && r._id !== undefined && r._id !== '')
          .map(r => ({ value: String(r._id), count: r.count }));
      })
    );

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
}

// Re-export the class type alias for backend convenience.
export type DiscoveryMileageClass = MileageClass;
