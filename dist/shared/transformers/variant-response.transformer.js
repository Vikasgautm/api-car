"use strict";
/**
 * Variant Response Transformer
 * Transforms raw variant documents into display-ready flat objects
 * for admin frontend consumption
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.VariantResponseTransformer = void 0;
const car_model_1 = require("../../models/car.model");
const brand_model_1 = require("../../models/brand.model");
const body_type_model_1 = require("../../models/body-type.model");
const fuel_type_model_1 = require("../../models/fuel-type.model");
class VariantResponseTransformer {
    // Cache to avoid repeated lookups
    static carCache = new Map();
    static brandCache = new Map();
    static bodyTypeCache = new Map();
    static fuelTypeCache = new Map();
    /**
     * Transform a single variant document into display-ready format
     */
    static async transform(variant) {
        // Get car if not already populated
        let car = variant.car_id;
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
    static async transformBatch(variants) {
        // Pre-load all unique car, brand, body type, and fuel type IDs to minimize queries
        const carIds = new Set();
        const brandIds = new Set();
        const bodyTypeIds = new Set();
        const fuelTypeIds = new Set();
        variants.forEach((v) => {
            const carId = typeof v.car_id === 'string' ? v.car_id : v.car_id?._id?.toString?.();
            if (carId)
                carIds.add(carId);
            if (v.fuel_type_id)
                fuelTypeIds.add(v.fuel_type_id);
        });
        // Load all cars in one query
        if (carIds.size > 0) {
            const cars = await car_model_1.Car.find({
                car_id: { $in: Array.from(carIds) },
            })
                .lean()
                .select('car_id name slug brand_id body_type_id body_type_name');
            cars.forEach((car) => {
                this.carCache.set(car.car_id, car);
                if (car.brand_id)
                    brandIds.add(car.brand_id);
                if (car.body_type_id)
                    bodyTypeIds.add(car.body_type_id);
            });
        }
        // Load all brands in one query
        if (brandIds.size > 0) {
            const brands = await brand_model_1.Brand.find({ brand_id: { $in: Array.from(brandIds) } })
                .lean()
                .select('brand_id name');
            brands.forEach((b) => this.brandCache.set(b.brand_id, b));
        }
        // Load all body types in one query
        if (bodyTypeIds.size > 0) {
            const bodyTypes = await body_type_model_1.BodyType.find({
                body_type_id: { $in: Array.from(bodyTypeIds) },
            })
                .lean()
                .select('body_type_id name');
            bodyTypes.forEach((bt) => this.bodyTypeCache.set(bt.body_type_id, bt));
        }
        // Load all fuel types in one query
        if (fuelTypeIds.size > 0) {
            const fuelTypes = await fuel_type_model_1.FuelType.find({
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
    static clearCache() {
        this.carCache.clear();
        this.brandCache.clear();
        this.bodyTypeCache.clear();
        this.fuelTypeCache.clear();
    }
    static async getCar(carId) {
        if (this.carCache.has(carId)) {
            return this.carCache.get(carId);
        }
        const car = await car_model_1.Car.findOne({ car_id: carId })
            .lean()
            .select('car_id name slug brand_id body_type_id body_type_name');
        if (car) {
            this.carCache.set(carId, car);
        }
        return car;
    }
    static async getBrand(brandId) {
        if (this.brandCache.has(brandId)) {
            return this.brandCache.get(brandId);
        }
        const brand = await brand_model_1.Brand.findOne({ brand_id: brandId })
            .lean()
            .select('brand_id name');
        if (brand)
            this.brandCache.set(brandId, brand);
        return brand;
    }
    static async getBodyType(bodyTypeId) {
        if (this.bodyTypeCache.has(bodyTypeId)) {
            return this.bodyTypeCache.get(bodyTypeId);
        }
        const bodyType = await body_type_model_1.BodyType.findOne({ body_type_id: bodyTypeId })
            .lean()
            .select('body_type_id name');
        if (bodyType)
            this.bodyTypeCache.set(bodyTypeId, bodyType);
        return bodyType;
    }
    static async getFuelType(fuelTypeId) {
        if (this.fuelTypeCache.has(fuelTypeId)) {
            return this.fuelTypeCache.get(fuelTypeId);
        }
        const fuelType = await fuel_type_model_1.FuelType.findOne({ fuel_type_id: fuelTypeId })
            .lean()
            .select('fuel_type_id name');
        if (fuelType)
            this.fuelTypeCache.set(fuelTypeId, fuelType);
        return fuelType;
    }
}
exports.VariantResponseTransformer = VariantResponseTransformer;
//# sourceMappingURL=variant-response.transformer.js.map