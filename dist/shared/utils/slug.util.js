"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SlugUtil = void 0;
exports.generateSlugWithIncrement = generateSlugWithIncrement;
const slugify_1 = __importDefault(require("slugify"));
class SlugUtil {
    static generate(text) {
        if (!text)
            return '';
        return (0, slugify_1.default)(text, {
            lower: true,
            strict: true,
            trim: true,
            replacement: '-',
        });
    }
    static generateUnique(baseText, existingSlugs) {
        let slug = this.generate(baseText);
        let counter = 1;
        while (existingSlugs.includes(slug)) {
            slug = `${this.generate(baseText)}-${counter}`;
            counter++;
        }
        return slug;
    }
    static validate(slug) {
        return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
    }
    static sanitize(text) {
        if (!text)
            return '';
        return text
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
    }
    static fromId(id, prefix) {
        const base = prefix ? `${prefix}-` : '';
        return `${base}${id}`;
    }
}
exports.SlugUtil = SlugUtil;
async function generateSlugWithIncrement(baseSlug, Model, fieldName = 'slug') {
    let slug = baseSlug;
    let counter = 1;
    while (await Model.exists({ [fieldName]: slug })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
    }
    return slug;
}
//# sourceMappingURL=slug.util.js.map