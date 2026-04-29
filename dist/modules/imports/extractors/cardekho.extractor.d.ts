import { ExtractedCarData, ExtractedVariantData } from '../types/import.types';
export declare class CarDekhoExtractor {
    private static readonly TIMEOUT;
    private static readonly USER_AGENT;
    private static fetchHtml;
    private static cleanText;
    private static parsePrice;
    private static extractPriceRange;
    private static slugify;
    static extractCarData(url: string): Promise<ExtractedCarData>;
    static extractVariantData(url: string): Promise<ExtractedVariantData>;
}
//# sourceMappingURL=cardekho.extractor.d.ts.map