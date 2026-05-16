import { ExtractedCarData, ExtractedVariantData } from '../types/import.types';
export declare class CarWaleExtractor {
    private static readonly TIMEOUT;
    private static readonly USER_AGENT;
    private static fetchHtml;
    private static cleanText;
    private static parsePrice;
    private static slugify;
    private static parseJsonLd;
    /**
     * Parse all spec/feature rows from [data-subcategoryid] sections.
     *
     * CarWale has three row shapes (all identified by [data-itemid]):
     *   1. No direct SVG child + <p> label → spec row:  label = p.text(), value = p.nextAll().text()
     *   2. Direct SVG child + sub-list (ul)            → complex feature: label from first labeled
     *      span, value = li texts joined with ", "
     *   3. Direct SVG child + single span text          → simple feature: text = label, value = "Yes"
     */
    private static parseSpecs;
    static extractCarData(url: string): Promise<ExtractedCarData>;
    static extractVariantData(url: string): Promise<ExtractedVariantData>;
}
//# sourceMappingURL=carwale.extractor.d.ts.map