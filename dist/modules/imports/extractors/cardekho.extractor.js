"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CarDekhoExtractor = void 0;
const axios_1 = __importDefault(require("axios"));
const cheerio = __importStar(require("cheerio"));
const app_error_util_1 = require("../../../shared/utils/app-error.util");
class CarDekhoExtractor {
    static TIMEOUT = 15000; // 15 seconds
    static USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
    static async fetchHtml(url) {
        try {
            if (!url.includes('cardekho.com')) {
                throw new app_error_util_1.AppError('Unsupported source. Only cardekho.com URLs are supported.', 400);
            }
            const response = await axios_1.default.get(url, {
                timeout: this.TIMEOUT,
                headers: {
                    'User-Agent': this.USER_AGENT,
                },
            });
            if (response.status !== 200) {
                throw new app_error_util_1.AppError(`Failed to fetch page. Status: ${response.status}`, 400);
            }
            return response.data;
        }
        catch (error) {
            if (error.code === 'ECONNABORTED') {
                throw new app_error_util_1.AppError('Request timeout. The page took too long to load.', 408);
            }
            if (error.response?.status === 404) {
                throw new app_error_util_1.AppError('Page not found. Please check the URL.', 404);
            }
            throw new app_error_util_1.AppError(`Failed to fetch page: ${error.message}`, 400);
        }
    }
    static cleanText(text) {
        return text
            .replace(/Image: space Image/g, '')
            .replace(/\*/g, '')
            .replace(/Currently Viewing/g, '')
            .replace(/EMI.*?₹/g, '')
            .replace(/Offer.*?₹/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }
    static parsePrice(priceText) {
        if (!priceText)
            return null;
        const cleaned = this.cleanText(priceText).toLowerCase();
        // Handle Lakh
        if (cleaned.includes('lakh')) {
            const match = cleaned.match(/[\d.]+/);
            if (match) {
                return Math.round(parseFloat(match[0]) * 100000);
            }
        }
        // Handle Crore
        if (cleaned.includes('cr') || cleaned.includes('crore')) {
            const match = cleaned.match(/[\d.]+/);
            if (match) {
                return Math.round(parseFloat(match[0]) * 10000000);
            }
        }
        // Handle plain numbers
        const match = cleaned.match(/[\d,]+/);
        if (match) {
            return parseInt(match[0].replace(/,/g, ''), 10);
        }
        return null;
    }
    static extractPriceRange(priceText) {
        if (!priceText)
            return null;
        const cleaned = this.cleanText(priceText);
        // Check for range like "Rs. 15.99 - 20.01 Lakh"
        if (cleaned.includes('-')) {
            const parts = cleaned.split('-');
            if (parts.length === 2) {
                const min = this.parsePrice(parts[0]);
                const max = this.parsePrice(parts[1]);
                if (min !== null && max !== null) {
                    return { min, max, text: cleaned };
                }
            }
        }
        // Single price
        const price = this.parsePrice(cleaned);
        if (price !== null) {
            return { min: price, max: price, text: cleaned };
        }
        return null;
    }
    static slugify(text) {
        return text
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
    }
    static async extractCarData(url) {
        const html = await this.fetchHtml(url);
        const $ = cheerio.load(html);
        const extracted = {
            name: '',
            brand: '',
            slug: '',
            source_url: url,
        };
        // Extract car name from title or h1
        const nameText = $('h1').first().text() || $('title').text();
        extracted.name = this.cleanText(nameText).replace(/CarDekho|Price|Specs|Overview/gi, '').trim();
        // Extract brand from URL or name
        const urlParts = url.split('/');
        extracted.brand = urlParts[3] || extracted.name.split(' ')[0];
        // Generate slug
        extracted.slug = this.slugify(extracted.name);
        // Extract description
        const description = $('.carDescription, .description, .overview-text').first().text();
        if (description) {
            extracted.description = this.cleanText(description);
        }
        // Extract price
        const priceElement = $('.price, .exshowroom-price, .price-section').first();
        const priceText = priceElement.text() || $('.priceValue').text();
        const priceRange = this.extractPriceRange(priceText);
        if (priceRange) {
            extracted.price_range_text = priceRange.text;
            extracted.min_price = priceRange.min;
            extracted.max_price = priceRange.max;
        }
        // Extract fuel type
        const fuelType = $('.fuel-type, .FuelType, [data-label*="Fuel"]').first().text();
        if (fuelType) {
            extracted.fuel_type = this.cleanText(fuelType);
        }
        // Extract body type
        const bodyType = $('.body-type, .BodyType, [data-label*="Body"]').first().text();
        if (bodyType) {
            extracted.body_type = this.cleanText(bodyType);
        }
        // Extract key specs
        const specs = $('.keySpec, .key-spec, .overview-spec li');
        specs.each((_, el) => {
            const label = $(el).find('.label, .spec-label').text();
            const value = $(el).find('.value, .spec-value').text();
            const cleanLabel = this.cleanText(label).toLowerCase();
            const cleanValue = this.cleanText(value);
            if (cleanLabel.includes('range') && cleanValue) {
                extracted.range = cleanValue;
            }
            else if (cleanLabel.includes('battery') && cleanValue) {
                extracted.battery_capacity = cleanValue;
            }
            else if (cleanLabel.includes('power') && cleanValue) {
                extracted.power = cleanValue;
            }
            else if (cleanLabel.includes('boot') && cleanValue) {
                extracted.boot_space = cleanValue;
            }
            else if (cleanLabel.includes('safety') && cleanValue) {
                extracted.safety_rating = cleanValue;
            }
        });
        // Extract colors
        const colors = [];
        $('.color-option, .color-name').each((_, el) => {
            const color = $(el).text();
            if (color) {
                colors.push(this.cleanText(color));
            }
        });
        if (colors.length > 0) {
            extracted.colors = colors;
        }
        // Extract variants
        const variants = [];
        $('.variant-name, .version-name').each((_, el) => {
            const variant = $(el).text();
            if (variant) {
                variants.push(this.cleanText(variant));
            }
        });
        if (variants.length > 0) {
            extracted.variants = variants;
        }
        return extracted;
    }
    static async extractVariantData(url) {
        const html = await this.fetchHtml(url);
        const $ = cheerio.load(html);
        const extracted = {
            variant_name: '',
            full_name: '',
            price: 0,
            price_text: '',
            fuel_type: '',
            transmission: '',
            specs: [],
            source_url: url,
        };
        // Extract variant name from h1 or title
        const nameText = $('h1').first().text() || $('title').text();
        extracted.full_name = this.cleanText(nameText).replace(/CarDekho|Price|Specs|Overview/gi, '').trim();
        // Extract the last word as variant name or use full name
        const nameParts = extracted.full_name.split(' ');
        extracted.variant_name = nameParts[nameParts.length - 1] || extracted.full_name;
        // Extract price - try multiple selectors
        const priceSelectors = [
            '.price',
            '.exshowroom-price',
            '.priceValue',
            '[class*="price"]',
            '#price',
        ];
        let priceText = '';
        for (const selector of priceSelectors) {
            const element = $(selector).first();
            if (element.length && element.text().trim()) {
                priceText = element.text();
                break;
            }
        }
        // Also try to find price in text content
        if (!priceText) {
            const bodyText = $('body').text();
            const priceMatch = bodyText.match(/Rs\.\s*[\d.]+\s*Lakh/i);
            if (priceMatch) {
                priceText = priceMatch[0];
            }
        }
        extracted.price_text = this.cleanText(priceText);
        const price = this.parsePrice(priceText);
        if (price !== null) {
            extracted.price = price;
        }
        // Extract fuel type - try multiple selectors and patterns
        const fuelTypeSelectors = [
            '.fuel-type',
            '.FuelType',
            '[data-label*="Fuel"]',
            '[class*="fuel"]',
        ];
        let fuelType = '';
        for (const selector of fuelTypeSelectors) {
            const element = $(selector).first();
            if (element.length && element.text().trim()) {
                fuelType = element.text();
                break;
            }
        }
        // Also try to find fuel type in text content
        if (!fuelType) {
            const bodyText = $('body').text();
            const fuelMatch = bodyText.match(/(Diesel|Petrol|Electric|CNG|Hybrid)/i);
            if (fuelMatch) {
                fuelType = fuelMatch[0];
            }
        }
        if (fuelType) {
            extracted.fuel_type = this.cleanText(fuelType);
        }
        // Extract transmission - try multiple selectors and patterns
        const transmissionSelectors = [
            '.transmission',
            '.TransmissionType',
            '[data-label*="Transmission"]',
            '[class*="transmission"]',
        ];
        let transmission = '';
        for (const selector of transmissionSelectors) {
            const element = $(selector).first();
            if (element.length && element.text().trim()) {
                transmission = element.text();
                break;
            }
        }
        // Also try to find transmission in text content
        if (!transmission) {
            const bodyText = $('body').text();
            const transMatch = bodyText.match(/(Manual|Automatic|AMT|CVT|DCT|iMT)/i);
            if (transMatch) {
                transmission = transMatch[0];
            }
        }
        if (transmission) {
            extracted.transmission = this.cleanText(transmission);
        }
        // Extract specs from specification tables - try multiple selectors
        const specs = [];
        // Try different table structures
        const tableSelectors = [
            '.spec-section',
            '.specification-section',
            '.specs-table',
            '#specs',
            '[class*="specification"]',
            '[class*="spec"]',
        ];
        for (const tableSelector of tableSelectors) {
            const sections = $(tableSelector);
            if (sections.length > 0) {
                sections.each((_, sectionEl) => {
                    const sectionName = $(sectionEl).find('.section-title, h2, h3, .heading').first().text();
                    const cleanSection = this.cleanText(sectionName) || 'General';
                    // Try different row structures
                    const rowSelectors = [
                        '.spec-row',
                        '.spec-item',
                        'tr',
                        '.row',
                        '[class*="row"]',
                    ];
                    for (const rowSelector of rowSelectors) {
                        $(sectionEl).find(rowSelector).each((_, rowEl) => {
                            const label = $(rowEl).find('.spec-label, .label, td:first-child, .key, [class*="label"]').first().text();
                            const value = $(rowEl).find('.spec-value, .value, td:last-child, .val, [class*="value"]').first().text();
                            const cleanLabel = this.cleanText(label);
                            const cleanValue = this.cleanText(value);
                            if (cleanLabel && cleanValue && cleanLabel.length < 100 && cleanValue.length < 200) {
                                specs.push({
                                    section: cleanSection,
                                    label: cleanLabel,
                                    value: cleanValue,
                                });
                            }
                        });
                    }
                });
                break; // Use first successful table structure
            }
        }
        // If no specs found in tables, try to extract from key specs list
        if (specs.length === 0) {
            $('.keySpec, .key-spec, .overview-spec li, .spec-list li').each((_, el) => {
                const text = $(el).text();
                const parts = text.split(':');
                if (parts.length === 2) {
                    const label = this.cleanText(parts[0]);
                    const value = this.cleanText(parts[1]);
                    if (label && value) {
                        specs.push({
                            section: 'Key Specs',
                            label: label,
                            value: value,
                        });
                    }
                }
            });
        }
        extracted.specs = specs;
        // Extract features
        const features = [];
        $('.feature-list li, .features li').each((_, el) => {
            const feature = $(el).text();
            if (feature) {
                features.push(this.cleanText(feature));
            }
        });
        if (features.length > 0) {
            extracted.features = features;
        }
        return extracted;
    }
}
exports.CarDekhoExtractor = CarDekhoExtractor;
//# sourceMappingURL=cardekho.extractor.js.map