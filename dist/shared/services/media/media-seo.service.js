"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaSeoService = void 0;
const media_constants_1 = require("./media-constants");
class MediaSeoService {
    /**
     * Auto-generates image_title: "{Car Name} {Subcategory Display Name}"
     * e.g. "Hyundai Creta Front Left View"
     */
    static generateTitle(carName, subCategory) {
        const subcatLabel = media_constants_1.SUBCATEGORY_DISPLAY_NAMES[subCategory] || subCategory;
        return `${carName} ${subcatLabel}`;
    }
    /**
     * Auto-generates alt_text: "View of {Car Name} {Subcategory Display Name}"
     * e.g. "View of Hyundai Creta Dashboard Interior"
     */
    static generateAltText(carName, subCategory) {
        const subcatLabel = media_constants_1.SUBCATEGORY_DISPLAY_NAMES[subCategory] || subCategory;
        return `View of ${carName} ${subcatLabel}`;
    }
    /**
     * Returns both title and alt_text; respects manually provided values.
     */
    static buildSeoFields(carName, subCategory, existingAlt, existingTitle) {
        return {
            alt_text: existingAlt?.trim() || this.generateAltText(carName, subCategory),
            image_title: existingTitle?.trim() || this.generateTitle(carName, subCategory),
        };
    }
}
exports.MediaSeoService = MediaSeoService;
//# sourceMappingURL=media-seo.service.js.map