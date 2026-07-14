"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SitemapController = void 0;
const sitemap_service_1 = require("../services/sitemap.service");
const response_util_1 = require("../../../shared/utils/response.util");
class SitemapController {
    static async getXml(req, res, next) {
        try {
            const xml = await sitemap_service_1.SitemapService.buildXml();
            res.setHeader('Content-Type', 'application/xml; charset=utf-8');
            res.setHeader('Cache-Control', 'public, max-age=3600'); // 1-hour CDN cache
            res.status(200).send(xml);
        }
        catch (err) {
            next(err);
        }
    }
    static async getUrls(req, res, next) {
        try {
            const urls = await sitemap_service_1.SitemapService.buildSitemapUrls();
            return response_util_1.ResponseUtil.success(res, { count: urls.length, urls }, 'Sitemap URLs');
        }
        catch (err) {
            next(err);
        }
    }
}
exports.SitemapController = SitemapController;
