"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OwnershipService = void 0;
const brand_model_1 = require("../../../models/brand.model");
const user_model_1 = require("../../../models/user.model");
class OwnershipService {
    static async getUserBrands(userId) {
        const user = await user_model_1.User.findOne({ user_id: userId, is_deleted: false });
        if (!user || !user.assigned_brands?.length)
            return [];
        const brands = await brand_model_1.Brand.find({ brand_id: { $in: user.assigned_brands }, is_deleted: false });
        return brands;
    }
    static async getBrandOwners(brandId) {
        const owners = await user_model_1.User.find({
            assigned_brands: brandId,
            is_deleted: false,
            is_active: true,
        }).select('user_id user_name email governance_role assigned_brands assigned_domains');
        return owners;
    }
    static async assignBrand(userId, brandId) {
        await user_model_1.User.findOneAndUpdate({ user_id: userId, is_deleted: false }, { $addToSet: { assigned_brands: brandId } });
    }
    static async unassignBrand(userId, brandId) {
        await user_model_1.User.findOneAndUpdate({ user_id: userId, is_deleted: false }, { $pull: { assigned_brands: brandId } });
    }
    static async getOwnershipGrid() {
        const brands = await brand_model_1.Brand.find({ is_deleted: false }).select('brand_id name slug logo total_cars total_variants ev_count');
        const users = await user_model_1.User.find({ is_deleted: false, is_active: true }).select('user_id user_name email assigned_brands');
        const brandOwnerMap = {};
        for (const user of users) {
            for (const brandId of (user.assigned_brands || [])) {
                if (!brandOwnerMap[brandId]) {
                    brandOwnerMap[brandId] = {
                        user_id: user.user_id,
                        user_name: user.user_name,
                        email: user.email,
                    };
                }
            }
        }
        return brands.map((brand) => ({
            brand_id: brand.brand_id,
            brand_name: brand.name,
            brand_slug: brand.slug,
            logo: brand.logo,
            owner_id: brandOwnerMap[brand.brand_id]?.user_id,
            owner_name: brandOwnerMap[brand.brand_id]?.user_name,
            owner_email: brandOwnerMap[brand.brand_id]?.email,
            total_cars: brand.total_cars || 0,
            total_variants: brand.total_variants || 0,
            ev_count: brand.ev_count || 0,
        }));
    }
    static async getUnassignedBrands() {
        const brands = await brand_model_1.Brand.find({ is_deleted: false }).select('brand_id name slug');
        const usersWithBrands = await user_model_1.User.find({ is_deleted: false, 'assigned_brands.0': { $exists: true } }).select('assigned_brands');
        const assignedBrandIds = new Set();
        for (const user of usersWithBrands) {
            for (const bid of (user.assigned_brands || []))
                assignedBrandIds.add(bid);
        }
        return brands.filter((b) => !assignedBrandIds.has(b.brand_id));
    }
    static async getWorkloadSummaries() {
        const users = await user_model_1.User.find({ is_deleted: false, is_active: true }).select('user_id user_name email governance_role assigned_brands assigned_domains');
        return users.map((u) => {
            const brandCount = (u.assigned_brands || []).length;
            return {
                user_id: u.user_id,
                user_name: u.user_name,
                email: u.email,
                governance_role: u.governance_role,
                brand_count: brandCount,
                assigned_brands: u.assigned_brands || [],
                domain_count: (u.assigned_domains || []).length,
                is_overloaded: brandCount > 5,
            };
        });
    }
}
exports.OwnershipService = OwnershipService;
