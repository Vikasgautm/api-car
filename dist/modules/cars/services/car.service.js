"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CarService = void 0;
const car_model_1 = require("../../../models/car.model");
const car_variant_model_1 = require("../../../models/car-variant.model");
const uuid_1 = require("uuid");
const slugify_1 = require("../../../utils/slugify");
const cloudinary_1 = require("cloudinary");
class CarService {
    static async getAllCars(query, fetchAsAdmin = false) {
        const { brand_id, body_type_id, page = 1, limit = 10, category, q } = query;
        const filter = { is_deleted: false };
        if (!fetchAsAdmin) {
            filter.is_published = true;
        }
        if (brand_id)
            filter.brand_id = brand_id;
        if (body_type_id)
            filter.body_type_id = body_type_id;
        if (q)
            filter.car_name = { $regex: q, $options: 'i' };
        if (category) {
            const categoryFields = {
                latest: 'latest',
                popular: 'popular',
                recommended: 'recommended',
                upcoming: 'upcoming',
                electric: 'electric',
            };
            if (categoryFields[category]) {
                filter[categoryFields[category]] = true;
            }
        }
        const skip = ((Number(page) || 1) - 1) * (Number(limit) || 10);
        const cars = await car_model_1.Car.find(filter)
            .populate('brand_id', 'brand_name brand_slug')
            .populate('body_type_id', 'name slug')
            .skip(skip)
            .limit(Number(limit) || 10)
            .sort({ createdAt: -1 });
        const total = await car_model_1.Car.countDocuments(filter);
        return { cars, total, page: Number(page) || 1, limit: Number(limit) || 10 };
    }
    static async getCarBySlug(slug) {
        const car = await car_model_1.Car.findOne({ slug, is_deleted: false })
            .populate('brand_id', 'brand_name brand_slug')
            .populate('body_type_id', 'name slug');
        if (!car)
            return null;
        const variants = await car_variant_model_1.CarVariant.find({ car_id: car.car_id, is_published: true });
        return { car, variants };
    }
    static async createCar(carData) {
        const car_id = (0, uuid_1.v4)();
        let slug = (0, slugify_1.generateSlug)(carData.car_name);
        const existing = await car_model_1.Car.findOne({ slug });
        if (existing) {
            slug = `${slug}-${Date.now()}`;
        }
        return await car_model_1.Car.create({
            ...carData,
            car_id,
            slug,
        });
    }
    static async updateCar(id, carData) {
        if (carData.car_name) {
            carData.slug = (0, slugify_1.generateSlug)(carData.car_name);
        }
        return await car_model_1.Car.findByIdAndUpdate(id, carData, { new: true });
    }
    static async deleteCar(id) {
        const car = await car_model_1.Car.findById(id);
        if (!car)
            return null;
        if (car.thumbnail?.preview) {
            const publicIdMatch = car.thumbnail.preview.match(/\/v\d+\/(.+?)\.\w+$/);
            if (publicIdMatch && publicIdMatch[1]) {
                try {
                    await cloudinary_1.v2.uploader.destroy(publicIdMatch[1]);
                }
                catch (e) { }
            }
        }
        if (car.images && car.images.length > 0) {
            for (const img of car.images) {
                const match = img.preview.match(/\/v\d+\/(.+?)\.\w+$/);
                if (match && match[1]) {
                    try {
                        await cloudinary_1.v2.uploader.destroy(match[1]);
                    }
                    catch (e) { }
                }
            }
        }
        return await car_model_1.Car.findByIdAndDelete(id);
    }
}
exports.CarService = CarService;
//# sourceMappingURL=car.service.js.map