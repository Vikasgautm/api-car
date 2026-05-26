/**
 * Variant Response Transformer
 * Transforms raw variant documents into display-ready flat objects
 * for admin frontend consumption
 */

import { Car } from '../../models/car.model';
import { Brand } from '../../models/brand.model';
import { BodyType } from '../../models/body-type.model';
import { FuelType } from '../../models/fuel-type.model';

export interface VariantDisplayDto {
  // Variant core
  variant_id: string;
  variant_name: string;
  slug: string;
  model_year: number;
  transmission_type: string;
  drivetrain?: string;
  seating_capacity?: number;

  // Pricing
  ex_showroom_price?: number;
  expected_price?: number;

  // Status
  is_published: boolean;
  is_archived: boolean;
  is_deleted: boolean;
  is_upcoming: boolean;
  is_featured?: boolean;
  variant_status?: string;
  publish_status?: string;
  market_status?: string;
  variant_rank?: number;
  trim_name?: string;
  edition_name?: string;

  // Car details (flattened from relationship)
  car_id: string;
  car_name: string;
  car_slug: string;
  brand_id: string;
  brand_name: string;
  body_type_id: string;
  body_type_name: string;

  // Fuel type
  fuel_type_id?: string;
  fuel_type_name?: string;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export class VariantResponseTransformer {
  // Cache to avoid repeated lookups
  private static carCache = new Map<string, any>();
  private static brandCache = new Map<string, any>();
  private static bodyTypeCache = new Map<string, any>();
  private static fuelTypeCache = new Map<string, any>();

  /**
   * Transform a single variant document into display-ready format
   */
  static async transform(variant: any): Promise<VariantDisplayDto> {
    // Get car if not already populated
    let car: any = variant.car_id;
    if (typeof car === 'string' || !car.car_id) {
      const carId = typeof car === 'string' ? car : car._id;
      car = await this.getCar(carId);
    }

    // Get brand
    const brandId = car?.brand_id || variant.brand_id;
    const brand = brandId ? await this.getBrand(brandId) : null;

    // Get body type
    const bodyTypeId = car?.body_type_id || variant.body_type_id;
    const bodyType = bodyTypeId ? await this.getBodyType(bodyTypeId) : null;

    // Get fuel type
    const fuelTypeId = variant.fuel_type_id;
    const fuelType = fuelTypeId ? await this.getFuelType(fuelTypeId) : null;

    return {
      variant_id: variant.variant_id,
      variant_name: variant.variant_name || 'Unknown Variant',
      slug: variant.slug || '',
      model_year: variant.model_year || 0,
      transmission_type: variant.transmission_type || '',
      drivetrain: variant.drivetrain,
      seating_capacity: variant.seating_capacity,
      ex_showroom_price: variant.ex_showroom_price,
      expected_price: variant.expected_price,
      is_published: variant.is_published || false,
      is_archived: variant.is_archived || false,
      is_deleted: variant.is_deleted || false,
      is_upcoming: variant.is_upcoming || false,
      is_featured: variant.is_featured,
      variant_status: variant.variant_status,
      publish_status: variant.publish_status,
      market_status: variant.market_status,
      variant_rank: variant.variant_rank,
      trim_name: variant.trim_name,
      edition_name: variant.edition_name,
      car_id: car?.car_id || variant.car_id?.toString() || '',
      car_name: car?.name || 'Unknown Car',
      car_slug: car?.slug || '',
      brand_id: brandId || '',
      brand_name: brand?.name || 'Unknown Brand',
      body_type_id: bodyTypeId || '',
      body_type_name: bodyType?.name || car?.body_type_name || 'Unknown',
      fuel_type_id: fuelTypeId,
      fuel_type_name: fuelType?.name || 'Unknown Fuel',
      created_at: variant.created_at?.toISOString?.() || variant.created_at || '',
      updated_at: variant.updated_at?.toISOString?.() || variant.updated_at || '',
    };
  }

  /**
   * Transform array of variants with minimal cache overhead
   */
  static async transformBatch(variants: any[]): Promise<VariantDisplayDto[]> {
    // Pre-load all unique car, brand, body type, and fuel type IDs to minimize queries
    const carIds = new Set<string>();
    const brandIds = new Set<string>();
    const bodyTypeIds = new Set<string>();
    const fuelTypeIds = new Set<string>();

    variants.forEach((v) => {
      const carId = typeof v.car_id === 'string' ? v.car_id : v.car_id?._id?.toString?.();
      if (carId) carIds.add(carId);
      if (v.fuel_type_id) fuelTypeIds.add(v.fuel_type_id);
    });

    // Load all cars in one query
    if (carIds.size > 0) {
      const cars = await Car.find({
        car_id: { $in: Array.from(carIds) },
      })
        .lean()
        .select('car_id name slug brand_id body_type_id body_type_name');

      cars.forEach((car) => {
        this.carCache.set(car.car_id, car);
        if (car.brand_id) brandIds.add(car.brand_id);
        if (car.body_type_id) bodyTypeIds.add(car.body_type_id);
      });
    }

    // Load all brands in one query
    if (brandIds.size > 0) {
      const brands = await Brand.find({ brand_id: { $in: Array.from(brandIds) } })
        .lean()
        .select('brand_id name');
      brands.forEach((b) => this.brandCache.set(b.brand_id, b));
    }

    // Load all body types in one query
    if (bodyTypeIds.size > 0) {
      const bodyTypes = await BodyType.find({
        body_type_id: { $in: Array.from(bodyTypeIds) },
      })
        .lean()
        .select('body_type_id name');
      bodyTypes.forEach((bt) => this.bodyTypeCache.set(bt.body_type_id, bt));
    }

    // Load all fuel types in one query
    if (fuelTypeIds.size > 0) {
      const fuelTypes = await FuelType.find({
        fuel_type_id: { $in: Array.from(fuelTypeIds) },
      })
        .lean()
        .select('fuel_type_id name');
      fuelTypes.forEach((ft) => this.fuelTypeCache.set(ft.fuel_type_id, ft));
    }

    // Transform all variants using cached data
    return Promise.all(variants.map((v) => this.transform(v)));
  }

  /**
   * Clear all caches (call after batch operations)
   */
  static clearCache(): void {
    this.carCache.clear();
    this.brandCache.clear();
    this.bodyTypeCache.clear();
    this.fuelTypeCache.clear();
  }

  private static async getCar(carId: string): Promise<any> {
    if (this.carCache.has(carId)) {
      return this.carCache.get(carId);
    }
    const car = await Car.findOne({ car_id: carId })
      .lean()
      .select('car_id name slug brand_id body_type_id body_type_name');
    if (car) {
      this.carCache.set(carId, car);
    }
    return car;
  }

  private static async getBrand(brandId: string): Promise<any> {
    if (this.brandCache.has(brandId)) {
      return this.brandCache.get(brandId);
    }
    const brand = await Brand.findOne({ brand_id: brandId })
      .lean()
      .select('brand_id name');
    if (brand) this.brandCache.set(brandId, brand);
    return brand;
  }

  private static async getBodyType(bodyTypeId: string): Promise<any> {
    if (this.bodyTypeCache.has(bodyTypeId)) {
      return this.bodyTypeCache.get(bodyTypeId);
    }
    const bodyType = await BodyType.findOne({ body_type_id: bodyTypeId })
      .lean()
      .select('body_type_id name');
    if (bodyType) this.bodyTypeCache.set(bodyTypeId, bodyType);
    return bodyType;
  }

  private static async getFuelType(fuelTypeId: string): Promise<any> {
    if (this.fuelTypeCache.has(fuelTypeId)) {
      return this.fuelTypeCache.get(fuelTypeId);
    }
    const fuelType = await FuelType.findOne({ fuel_type_id: fuelTypeId })
      .lean()
      .select('fuel_type_id name');
    if (fuelType) this.fuelTypeCache.set(fuelTypeId, fuelType);
    return fuelType;
  }
}
