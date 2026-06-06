import { Car } from '../../../models/car.model';
import { SeoCollection } from '../../../models/seo-collection.model';
import { Comparison } from '../../../models/comparison.model';
import { PlatformSettingsService } from '../../settings/services/platform-settings.service';

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq: string;
  priority: number;
}

export class SitemapService {
  private static async getCanonicalDomain(): Promise<string> {
    try {
      const settings = await PlatformSettingsService.getSettingsByGroup('general');
      const domain = (settings as any)?.canonical_domain;
      if (domain && typeof domain === 'string') return domain.replace(/\/$/, '');
    } catch {
      // fall through to default
    }
    return 'https://carsalahakar.com';
  }

  static async buildSitemapUrls(): Promise<SitemapUrl[]> {
    const [domain, cars, collections, comparisons] = await Promise.all([
      this.getCanonicalDomain(),
      Car.find({ is_published: true, is_deleted: false, redirect_to_slug: null })
        .select('slug status is_current is_upcoming updated_at')
        .lean(),
      SeoCollection.find({ status: 'published', seo_index_status: 'index' })
        .select('slug health_score updated_at')
        .lean(),
      Comparison.find({ status: 'published', is_published: true, is_deleted: false })
        .select('slug updated_at')
        .lean(),
    ]);

    const urls: SitemapUrl[] = [];

    for (const car of cars) {
      const rawDate = (car as any).updatedAt || (car as any).updated_at;
      const lastmod = rawDate ? new Date(rawDate).toISOString().split('T')[0] : undefined;
      let priority = 0.5;
      let changefreq = 'monthly';

      if (car.status === 'launched' && car.is_current) {
        priority = 0.9;
        changefreq = 'weekly';
      } else if (car.is_upcoming || car.status === 'upcoming') {
        priority = 0.7;
        changefreq = 'monthly';
      } else if (car.status === 'archived' || car.status === 'discontinued') {
        priority = 0.3;
        changefreq = 'yearly';
      } else if (car.status === 'launched') {
        priority = 0.7;
        changefreq = 'weekly';
      }

      urls.push({ loc: `${domain}/cars/${car.slug}`, lastmod, changefreq, priority });
    }

    for (const col of collections) {
      const colDate = (col as any).updatedAt || (col as any).updated_at;
      const lastmod = colDate ? new Date(colDate).toISOString().split('T')[0] : undefined;
      const priority = (col.health_score ?? 0) > 70 ? 0.7 : 0.5;
      urls.push({ loc: `${domain}/collections/${col.slug}`, lastmod, changefreq: 'daily', priority });
    }

    for (const comp of comparisons) {
      const compDate = (comp as any).updatedAt || comp.updated_at;
      const lastmod = compDate ? new Date(compDate).toISOString().split('T')[0] : undefined;
      urls.push({ loc: `${domain}/comparison/${comp.slug}`, lastmod, changefreq: 'weekly', priority: 0.6 });
    }

    return urls;
  }

  static async buildXml(): Promise<string> {
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
