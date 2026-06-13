import { ExtractedCarData, ExtractedVariantData } from '../types/import.types';
export declare class CarDekhoExtractor {
    private static readonly TIMEOUT;
    private static readonly USER_AGENT;
    private static fetchHtml;
    private static cleanText;
    /**
     * Derive the variant name by stripping the brand + model prefix.
     *
     * CarDekho URLs look like:
     *   .../overview/MG_Majestor/MG_Majestor_Savvy_4x2_6STR.htm
     * where the folder is "{Brand}_{Model}" and the file is
     * "{Brand}_{Model}_{Variant}.htm". Removing the folder prefix from the
     * filename yields the variant exactly: "Savvy_4x2_6STR" -> "Savvy 4x2 6STR".
     *
     * Falls back to stripping the brand/model words off the full title, and
     * finally to the full title — so we never collapse a multi-word variant
     * down to a single trailing token.
     */
    private static deriveVariantName;
    private static parsePrice;
    private static extractPriceRange;
    private static slugify;
    static extractCarData(url: string): Promise<ExtractedCarData>;
    static extractVariantData(url: string): Promise<ExtractedVariantData>;
}
//# sourceMappingURL=cardekho.extractor.d.ts.map