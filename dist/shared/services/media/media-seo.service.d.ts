export declare class MediaSeoService {
    /**
     * Auto-generates image_title: "{Car Name} {Subcategory Display Name}"
     * e.g. "Hyundai Creta Front Left View"
     */
    static generateTitle(carName: string, subCategory: string): string;
    /**
     * Auto-generates alt_text: "View of {Car Name} {Subcategory Display Name}"
     * e.g. "View of Hyundai Creta Dashboard Interior"
     */
    static generateAltText(carName: string, subCategory: string): string;
    /**
     * Returns both title and alt_text; respects manually provided values.
     */
    static buildSeoFields(carName: string, subCategory: string, existingAlt?: string, existingTitle?: string): {
        alt_text: string;
        image_title: string;
    };
}
