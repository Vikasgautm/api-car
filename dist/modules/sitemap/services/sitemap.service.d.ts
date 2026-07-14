interface SitemapUrl {
    loc: string;
    lastmod?: string;
    changefreq: string;
    priority: number;
}
export declare class SitemapService {
    private static getCanonicalDomain;
    static buildSitemapUrls(): Promise<SitemapUrl[]>;
    static buildXml(): Promise<string>;
}
export {};
