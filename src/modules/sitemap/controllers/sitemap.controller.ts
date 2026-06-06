import { Request, Response, NextFunction } from 'express';
import { SitemapService } from '../services/sitemap.service';
import { ResponseUtil } from '../../../shared/utils/response.util';

export class SitemapController {
  static async getXml(req: Request, res: Response, next: NextFunction) {
    try {
      const xml = await SitemapService.buildXml();
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=3600'); // 1-hour CDN cache
      res.status(200).send(xml);
    } catch (err) {
      next(err);
    }
  }

  static async getUrls(req: Request, res: Response, next: NextFunction) {
    try {
      const urls = await SitemapService.buildSitemapUrls();
      return ResponseUtil.success(res, { count: urls.length, urls }, 'Sitemap URLs');
    } catch (err) {
      next(err);
    }
  }
}
