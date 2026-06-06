import { Router } from 'express';
import { SitemapController } from '../controllers/sitemap.controller';

const router = Router();

// JSON listing of all sitemap URLs (admin/debug use)
router.get('/urls', SitemapController.getUrls);

// XML sitemap (also mounted at root /sitemap.xml via app.ts)
router.get('/', SitemapController.getXml);

export default router;
