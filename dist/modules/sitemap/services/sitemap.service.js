"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SitemapService = void 0;
const car_model_1 = require("../../../models/car.model");
const seo_collection_model_1 = require("../../../models/seo-collection.model");
const comparison_model_1 = require("../../../models/comparison.model");
const platform_settings_service_1 = require("../../settings/services/platform-settings.service");
class SitemapService {
    static async getCanonicalDomain() {
        try {
            const settings = await platform_settings_service_1.PlatformSettingsService.getSettingsByGroup('general');
            const domain = settings?.canonical_domain;
            if (domain && typeof domain === 'string')
                return domain.replace(/\/$/, '');
        }
        catch {
            // fall through to default
        }
        return 'https://carsalahakar.com';
    }
    static async buildSitemapUrls() {
        const [domain, cars, collections, comparisons] = await Promise.all([
            this.getCanonicalDomain(),
            car_model_1.Car.find({ is_published: true, is_deleted: false, redirect_to_slug: null })
                .select('slug status is_current is_upcoming updated_at')
                .lean(),
            seo_collection_model_1.SeoCollection.find({ status: 'published', seo_index_status: 'index' })
                .select('slug health_score updated_at')
                .lean(),
            comparison_model_1.Comparison.find({ status: 'published', is_published: true, is_deleted: false })
                .select('slug updated_at')
                .lean(),
        ]);
        const urls = [];
        for (const car of cars) {
            const rawDate = car.updatedAt || car.updated_at;
            const lastmod = rawDate ? new Date(rawDate).toISOString().split('T')[0] : undefined;
            let priority = 0.5;
            let changefreq = 'monthly';
            if (car.status === 'launched' && car.is_current) {
                priority = 0.9;
                changefreq = 'weekly';
            }
            else if (car.is_upcoming || car.status === 'upcoming') {
                priority = 0.7;
                changefreq = 'monthly';
            }
            else if (car.status === 'archived' || car.status === 'discontinued') {
                priority = 0.3;
                changefreq = 'yearly';
            }
            else if (car.status === 'launched') {
                priority = 0.7;
                changefreq = 'weekly';
            }
            urls.push({ loc: `${domain}/cars/${car.slug}`, lastmod, changefreq, priority });
        }
        for (const col of collections) {
            const colDate = col.updatedAt || col.updated_at;
            const lastmod = colDate ? new Date(colDate).toISOString().split('T')[0] : undefined;
            const priority = (col.health_score ?? 0) > 70 ? 0.7 : 0.5;
            urls.push({ loc: `${domain}/collections/${col.slug}`, lastmod, changefreq: 'daily', priority });
        }
        for (const comp of comparisons) {
            const compDate = comp.updatedAt || comp.updated_at;
            const lastmod = compDate ? new Date(compDate).toISOString().split('T')[0] : undefined;
            urls.push({ loc: `${domain}/comparison/${comp.slug}`, lastmod, changefreq: 'weekly', priority: 0.6 });
        }
        return urls;
    }
    static async buildXml() {
        const urls = await this.buildSitemapUrls();
        const urlElements = urls
            .map(u => {
            const lastmodLine = u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : '';
            return `  <url>\n    <loc>${u.loc}</loc>${lastmodLine}\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`;
        })
            .join('\n');
        return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlElements}\n</urlset>`;
    }
}
exports.SitemapService = SitemapService;
