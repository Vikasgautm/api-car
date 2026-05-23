"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlogLinkingService = void 0;
const blog_model_1 = require("../../../models/blog.model");
class BlogLinkingService {
    static async suggestLinks(content) {
        if (!content || content.length < 10)
            return [];
        const plainText = content.replace(/<[^>]+>/g, ' ').toLowerCase();
        const suggestions = [];
        const [Car, Brand, FuelType] = await Promise.all([
            Promise.resolve().then(() => __importStar(require('../../../models/car.model'))).then((m) => m.Car),
            Promise.resolve().then(() => __importStar(require('../../../models/brand.model'))).then((m) => m.Brand),
            Promise.resolve().then(() => __importStar(require('../../../models/fuel-type.model'))).then((m) => m.FuelType),
        ]);
        const [cars, brands, fuels] = await Promise.all([
            Car.find({ is_deleted: false, is_published: true }).select('car_id name slug').limit(200).lean(),
            Brand.find({ is_deleted: false }).select('brand_id name slug').limit(100).lean(),
            FuelType.find({}).select('fuel_type_id name slug').limit(20).lean(),
        ]);
        for (const car of cars) {
            if (plainText.includes(car.name.toLowerCase())) {
                suggestions.push({
                    text: car.name,
                    url: `/cars/${car.slug}`,
                    type: 'car',
                    entity_id: car.car_id,
                });
            }
        }
        for (const brand of brands) {
            if (plainText.includes(brand.name.toLowerCase())) {
                suggestions.push({
                    text: brand.name,
                    url: `/brands/${brand.slug}`,
                    type: 'brand',
                    entity_id: brand.brand_id,
                });
            }
        }
        for (const fuel of fuels) {
            if (plainText.includes(fuel.name.toLowerCase())) {
                suggestions.push({
                    text: fuel.name,
                    url: `/fuel-types/${fuel.slug}`,
                    type: 'fuel',
                    entity_id: fuel.fuel_type_id,
                });
            }
        }
        // Deduplicate by entity_id
        const seen = new Set();
        return suggestions.filter((s) => {
            if (seen.has(s.entity_id))
                return false;
            seen.add(s.entity_id);
            return true;
        });
    }
    static async searchEntities(query, entityType) {
        if (!query || query.length < 2)
            return [];
        const q = new RegExp(query, 'i');
        if (entityType === 'car') {
            const Car = (await Promise.resolve().then(() => __importStar(require('../../../models/car.model')))).Car;
            return Car.find({ name: q, is_deleted: false }).select('car_id name slug').limit(10).lean();
        }
        if (entityType === 'brand') {
            const Brand = (await Promise.resolve().then(() => __importStar(require('../../../models/brand.model')))).Brand;
            return Brand.find({ name: q, is_deleted: false }).select('brand_id name slug').limit(10).lean();
        }
        if (entityType === 'fuel_type') {
            const FuelType = (await Promise.resolve().then(() => __importStar(require('../../../models/fuel-type.model')))).FuelType;
            return FuelType.find({ name: q }).select('fuel_type_id name slug').limit(10).lean();
        }
        if (entityType === 'body_type') {
            const BodyType = (await Promise.resolve().then(() => __importStar(require('../../../models/body-type.model')))).BodyType;
            return BodyType.find({ name: q }).select('body_type_id name slug').limit(10).lean();
        }
        if (entityType === 'comparison') {
            const Comparison = (await Promise.resolve().then(() => __importStar(require('../../../models/comparison.model')))).Comparison;
            return Comparison.find({ title: q, is_deleted: false }).select('comparison_id title slug').limit(10).lean();
        }
        if (entityType === 'collection') {
            const SeoCollection = (await Promise.resolve().then(() => __importStar(require('../../../models/seo-collection.model')))).SeoCollection;
            return SeoCollection.find({ title: q, is_deleted: false }).select('collection_id title slug').limit(10).lean();
        }
        if (entityType === 'blog') {
            return blog_model_1.Blog.find({ title: q, is_deleted: false, is_published: true }).select('blog_id title slug').limit(10).lean();
        }
        return [];
    }
}
exports.BlogLinkingService = BlogLinkingService;
//# sourceMappingURL=blog-linking.service.js.map