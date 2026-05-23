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
exports.BlogRelationshipService = void 0;
const blog_model_1 = require("../../../models/blog.model");
const app_error_util_1 = require("../../../shared/utils/app-error.util");
class BlogRelationshipService {
    static async updateConnections(blogId, connections) {
        const update = {};
        if (connections.connected_cars !== undefined)
            update.connected_cars = connections.connected_cars;
        if (connections.connected_variants !== undefined)
            update.connected_variants = connections.connected_variants;
        if (connections.connected_brands !== undefined)
            update.connected_brands = connections.connected_brands;
        if (connections.connected_body_types !== undefined)
            update.connected_body_types = connections.connected_body_types;
        if (connections.connected_fuel_types !== undefined)
            update.connected_fuel_types = connections.connected_fuel_types;
        if (connections.connected_comparisons !== undefined)
            update.connected_comparisons = connections.connected_comparisons;
        if (connections.connected_collections !== undefined)
            update.connected_collections = connections.connected_collections;
        const blog = await blog_model_1.Blog.findOneAndUpdate({ blog_id: blogId, is_deleted: false }, { $set: update }, { returnDocument: 'after' }).lean();
        if (!blog) {
            throw new app_error_util_1.AppError('Blog not found', 404);
        }
        return blog;
    }
    static async getConnections(blogId) {
        const blog = await blog_model_1.Blog.findOne({ blog_id: blogId, is_deleted: false })
            .select('blog_id connected_cars connected_variants connected_brands connected_body_types connected_fuel_types connected_comparisons connected_collections')
            .lean();
        if (!blog) {
            throw new app_error_util_1.AppError('Blog not found', 404);
        }
        return blog;
    }
    static async getRelatedEntityNames(blogId) {
        const Car = (await Promise.resolve().then(() => __importStar(require('../../../models/car.model')))).Car;
        const Brand = (await Promise.resolve().then(() => __importStar(require('../../../models/brand.model')))).Brand;
        const blog = await blog_model_1.Blog.findOne({ blog_id: blogId, is_deleted: false })
            .select('connected_cars connected_brands connected_collections')
            .lean();
        if (!blog) {
            throw new app_error_util_1.AppError('Blog not found', 404);
        }
        const [cars, brands] = await Promise.all([
            blog.connected_cars?.length
                ? Car.find({ car_id: { $in: blog.connected_cars } }).select('car_id name slug').lean()
                : [],
            blog.connected_brands?.length
                ? Brand.find({ brand_id: { $in: blog.connected_brands } }).select('brand_id name slug').lean()
                : [],
        ]);
        return {
            cars,
            brands,
            connections: blog,
        };
    }
}
exports.BlogRelationshipService = BlogRelationshipService;
//# sourceMappingURL=blog-relationship.service.js.map