"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeoCollectionContentService = void 0;
const body_type_model_1 = require("../../../models/body-type.model");
const fuel_type_model_1 = require("../../../models/fuel-type.model");
class SeoCollectionContentService {
    static async buildContext(collection) {
        const ctx = { fuelNames: [], bodyNames: [] };
        if (collection.fuel_type_ids?.length) {
            const fuelTypes = await fuel_type_model_1.FuelType.find({ fuel_type_id: { $in: collection.fuel_type_ids } }).select('name').lean();
            ctx.fuelNames = fuelTypes.map((ft) => ft.name);
        }
        if (collection.body_type_ids?.length) {
            const bodyTypes = await body_type_model_1.BodyType.find({ body_type_id: { $in: collection.body_type_ids } }).select('name').lean();
            ctx.bodyNames = bodyTypes.map((bt) => bt.name);
        }
        ctx.budgetMax = collection.budget_max;
        ctx.budgetMin = collection.budget_min;
        ctx.transmission = collection.transmission_types;
        ctx.mileageClasses = collection.mileage_classes;
        return ctx;
    }
    static budgetLabel(amount) {
        if (amount >= 10000000)
            return `₹${(amount / 10000000).toFixed(1)} Cr`;
        return `₹${(amount / 100000).toFixed(0)} Lakh`;
    }
    static async generateH1(collection) {
        const ctx = await this.buildContext(collection);
        const fuel = ctx.fuelNames.join(' & ');
        const body = ctx.bodyNames.join(' & ');
        const txPrefix = ctx.transmission?.length === 1
            ? ` ${ctx.transmission[0].charAt(0).toUpperCase() + ctx.transmission[0].slice(1)}`
            : '';
        const budgetSuffix = ctx.budgetMax ? ` Under ${this.budgetLabel(ctx.budgetMax)}` : '';
        const mileagePrefix = ctx.mileageClasses?.includes('excellent') ? 'Best Mileage ' : 'Best';
        if (fuel && body)
            return `${mileagePrefix}${txPrefix} ${fuel} ${body} Cars in India${budgetSuffix}`;
        if (fuel)
            return `${mileagePrefix}${txPrefix} ${fuel} Cars in India${budgetSuffix}`;
        if (body)
            return `Best ${body} Cars in India${budgetSuffix}`;
        return 'Best Cars in India';
    }
    static async generateMetaTitle(collection) {
        const h1 = await this.generateH1(collection);
        const year = new Date().getFullYear();
        const title = `${h1} ${year} - Prices & Specs | CarSalahakar`;
        return title.length > 70 ? title.substring(0, 67) + '...' : title;
    }
    static async generateMetaDescription(collection) {
        const ctx = await this.buildContext(collection);
        const fuel = ctx.fuelNames.join(' & ') || '';
        const body = ctx.bodyNames.join(' & ') || '';
        const budget = ctx.budgetMax ? ` under ${this.budgetLabel(ctx.budgetMax)}` : '';
        const year = new Date().getFullYear();
        if (fuel && body) {
            return `Explore the best ${fuel} ${body} cars in India${budget}. Compare prices, specs, mileage, and features. Updated for ${year}.`;
        }
        if (fuel) {
            return `Compare all ${fuel} cars in India${budget}. Find the best mileage, price, specs and features. Updated for ${year}.`;
        }
        if (body) {
            return `Find the best ${body} cars in India${budget}. Compare prices, specs, and features. Updated for ${year}.`;
        }
        return `Find the best cars in India${budget}. Compare prices, specs and features.`;
    }
    static async generateIntro(collection) {
        const ctx = await this.buildContext(collection);
        const fuel = ctx.fuelNames.join(' and ') || 'petrol/diesel';
        const body = ctx.bodyNames.length ? ` ${ctx.bodyNames.join(' and ')}` : '';
        const budget = ctx.budgetMax ? ` under ${this.budgetLabel(ctx.budgetMax)}` : '';
        return `Looking for the best ${fuel}${body} cars in India${budget}? This page brings together all the top options available in the Indian market. Compare prices, mileage, specifications, and key features to find the right car for your needs. All data is regularly updated to reflect the latest prices and variants.`;
    }
    static async generateAll(collection) {
        const [h1, meta_title, meta_description, intro_content] = await Promise.all([
            this.generateH1(collection),
            this.generateMetaTitle(collection),
            this.generateMetaDescription(collection),
            this.generateIntro(collection),
        ]);
        return { h1, meta_title, meta_description, intro_content };
    }
}
exports.SeoCollectionContentService = SeoCollectionContentService;
//# sourceMappingURL=seo-collection-content.service.js.map