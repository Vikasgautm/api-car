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
exports.CarWaleExtractor = void 0;
const axios_1 = __importDefault(require("axios"));
const cheerio = __importStar(require("cheerio"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const app_error_util_1 = require("../../../shared/utils/app-error.util");
class CarWaleExtractor {
    static TIMEOUT = 15000;
    static USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    static async fetchHtml(url) {
        if (!url.includes('carwale.com')) {
            throw new app_error_util_1.AppError('Unsupported source. Only carwale.com URLs are supported.', 400);
        }
        try {
            const response = await axios_1.default.get(url, {
                timeout: this.TIMEOUT,
                headers: {
                    'User-Agent': this.USER_AGENT,
                    Accept: 'text/html,application/xhtml+xml',
                    'Accept-Language': 'en-US,en;q=0.9',
                },
            });
            if (response.status !== 200) {
                throw new app_error_util_1.AppError(`Failed to fetch page. Status: ${response.status}`, 400);
            }
            return response.data;
        }
        catch (error) {
            if (error.code === 'ECONNABORTED')
                throw new app_error_util_1.AppError('Request timeout. The page took too long to load.', 408);
            if (error.response?.status === 404)
                throw new app_error_util_1.AppError('Page not found. Please check the URL.', 404);
            throw new app_error_util_1.AppError(`Failed to fetch page: ${error.message}`, 400);
        }
    }
    static cleanText(text) {
        return text.replace(/\s+/g, ' ').trim();
    }
    static parsePrice(priceText) {
        if (!priceText)
            return null;
        const cleaned = this.cleanText(priceText).toLowerCase();
        // Must start match on a digit to avoid matching the '.' in "Rs."
        if (cleaned.includes('lakh')) {
            const m = cleaned.match(/\d[\d.]*/);
            if (m)
                return Math.round(parseFloat(m[0]) * 100000);
        }
        if (cleaned.includes('crore') || cleaned.includes(' cr')) {
            const m = cleaned.match(/\d[\d.]*/);
            if (m)
                return Math.round(parseFloat(m[0]) * 10000000);
        }
        const m = cleaned.match(/\d[\d,]*/);
        if (m)
            return parseInt(m[0].replace(/,/g, ''), 10);
        return null;
    }
    static slugify(text) {
        return text
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
    }
    // Parse first JSON-LD Car node from page HTML.
    static parseJsonLd(html) {
        const matches = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g) || [];
        for (const m of matches) {
            const inner = m.replace(/<script[^>]*>/, '').replace(/<\/script>/, '');
            try {
                const data = JSON.parse(inner);
                const nodes = data['@graph'] ? data['@graph'] : [data];
                const carNode = nodes.find((n) => n['@type'] === 'Car');
                if (carNode)
                    return carNode;
            }
            catch { }
        }
        return null;
    }
    /**
     * Parse all spec/feature rows from [data-subcategoryid] sections.
     *
     * CarWale has three row shapes (all identified by [data-itemid]):
     *   1. No direct SVG child + <p> label → spec row:  label = p.text(), value = p.nextAll().text()
     *   2. Direct SVG child + sub-list (ul)            → complex feature: label from first labeled
     *      span, value = li texts joined with ", "
     *   3. Direct SVG child + single span text          → simple feature: text = label, value = "Yes"
     */
    static parseSpecs($) {
        const specs = [];
        const seen = new Set();
        const addSpec = (section, label, value) => {
            label = this.cleanText(label);
            value = this.cleanText(value);
            if (!label || !value || label.length > 150)
                return;
            // ── CarWale-specific label normalisations ───────────────────────────
            // 1. "Feature-No" suffix — CarWale appends "-No" when a feature is absent.
            //    Strip the suffix and set value="No" so SPEC_LABEL_MAP boolean parsing
            //    correctly resolves it to false.
            const noSuffixMatch = label.match(/^(.+?)-No$/i);
            if (noSuffixMatch) {
                label = noSuffixMatch[1].trim();
                value = 'No';
            }
            // 2. "N Airbags" label (e.g. "6 Airbags") — count is in the label, not value.
            //    Emit as standard "Airbags" / count so SPEC_LABEL_MAP + deriveFeatureFlags work.
            const airbagCountMatch = label.match(/^(\d+)\s+airbags?$/i);
            if (airbagCountMatch) {
                const count = airbagCountMatch[1];
                const countKey = `${section}|||airbags`;
                if (!seen.has(countKey)) {
                    seen.add(countKey);
                    specs.push({ section, label: 'Airbags', value: count });
                }
                if (value !== 'Yes' && value !== 'No') {
                    const cfgKey = `${section}|||airbag configuration`;
                    if (!seen.has(cfgKey)) {
                        seen.add(cfgKey);
                        specs.push({ section, label: 'Airbag Configuration', value });
                    }
                }
                return;
            }
            // 3. "Android Auto ... & Apple CarPlay ..." combined — emit as two specs.
            if (/android auto.{0,20}apple carplay/i.test(label)) {
                for (const singleLabel of ['Android Auto', 'Apple CarPlay']) {
                    const sKey = `${section}|||${singleLabel.toLowerCase()}`;
                    if (!seen.has(sKey)) {
                        seen.add(sKey);
                        specs.push({ section, label: singleLabel, value: value === 'No' ? 'No' : 'Yes' });
                    }
                }
                return;
            }
            // 4. "N Speakers" / "N Speakers, M Tweeters" → map to a canonical "Speakers" label
            //    with a numeric value so the speaker count field stays useful.
            const speakerMatch = label.match(/^(\d+)\s+speakers?\b/i);
            if (speakerMatch) {
                const speakerKey = `${section}|||speakers`;
                if (!seen.has(speakerKey)) {
                    seen.add(speakerKey);
                    specs.push({ section, label: 'Speakers', value: speakerMatch[1] });
                }
                return;
            }
            // 5. "N-inch Touch-screen Display" / "N.N" screen → "Touchscreen Size"
            const screenMatch = label.match(/^([\d.]+)["”]?\s+touch[\s-]?screen\s+display$/i);
            if (screenMatch) {
                const screenKey = `${section}|||touchscreen`;
                if (!seen.has(screenKey)) {
                    seen.add(screenKey);
                    specs.push({ section, label: 'Touchscreen', value: `${screenMatch[1]} inch` });
                }
                return;
            }
            // 6. "Bootspace -N L..." → extract boot space number and emit as "Boot Space"
            const bootMatch = label.match(/^bootspace\s*-?\s*([\d,]+)\s*l\b/i);
            if (bootMatch) {
                const bootKey = `${section}|||boot space`;
                if (!seen.has(bootKey)) {
                    seen.add(bootKey);
                    specs.push({ section, label: 'Boot Space', value: `${bootMatch[1]} L` });
                }
                return;
            }
            // 7. "Wireless Charger (Front/Rear)" → canonical "Wireless Charger"
            if (/^wireless charger\s*\(/i.test(label)) {
                label = 'Wireless Charger';
            }
            // 8. "N Star (Bharat/Global NCAP) Rating" → normalize to "NCAP Rating"
            const ncapMatch = label.match(/^(\d+)\s+star\s+.*ncap.*rating/i);
            if (ncapMatch) {
                const ncapKey = `${section}|||ncap rating`;
                if (!seen.has(ncapKey)) {
                    seen.add(ncapKey);
                    specs.push({ section, label: 'NCAP Rating', value: `${ncapMatch[1]} Star` });
                }
                return;
            }
            // 9. Bluetooth compound labels (always maps to bluetooth: true/false)
            if (/^bluetooth compatibility/i.test(label)) {
                label = 'Bluetooth Compatibility';
            }
            // 10. Power-assisted steering variants → canonical "Power-assisted (X) Steering"
            //     Strip spoke count suffix so all map to the same key.
            if (/^power-assisted\s+\((?:electric|hydraulic)\)\s+steering/i.test(label)) {
                const steeringType = label.match(/\((electric|hydraulic)\)/i)?.[1] || 'Electric';
                label = `Power-assisted (${steeringType}) Steering`;
            }
            // 11. "Driver/Passenger/Second Row Seat Adjustment : N way X adjustable"
            //     → normalized seat key  (e.g. "Driver Seat Adjustment")
            const seatAdjMatch = label.match(/^(driver|front passenger|second row|third row)\s+seat adjustment\s*[:–\-]/i);
            if (seatAdjMatch) {
                const rowLabel = seatAdjMatch[1].replace(/\b\w/g, c => c.toUpperCase()) + ' Seat Adjustment';
                const seatKey = `${section}|||${rowLabel.toLowerCase()}`;
                if (!seen.has(seatKey)) {
                    seen.add(seatKey);
                    specs.push({ section, label: rowLabel, value: value === 'Yes' ? value : value });
                }
                return;
            }
            // 12. "N Cupholders in X" / "2 Cupholders in Front Only" → "Cupholders"
            if (/^\d+\s+cupholders?/i.test(label)) {
                label = 'Cup Holders';
            }
            // 13. Instrument cluster size-variants (e.g. "7-inch Digital Instrument Cluster",
            //     "Analogue - Digital Instrument Cluster with Adjustable Cluster Brightness")
            //     → canonical "Instrument Cluster" so the display type gets stored once.
            if (/instrument cluster/i.test(label) && label !== 'Instrument Cluster') {
                label = 'Instrument Cluster';
            }
            // 14. Cabin lamp variants → canonical "Cabin Lamp"
            if (/^(?:button controlled\s+)?(?:halogen|led)?\s*cabin lamp/i.test(label)) {
                label = 'Cabin Lamp';
            }
            const key = `${section}|||${label.toLowerCase()}`;
            if (seen.has(key))
                return;
            seen.add(key);
            specs.push({ section, label, value });
        };
        $('[data-subcategoryid]').each((_, sectionEl) => {
            const $section = $(sectionEl);
            // Section name: first <p> whose text matches "Section Name (N)" — strip the count.
            let sectionName = 'General';
            $section.find('p').each((_, pEl) => {
                const text = $(pEl).text().trim();
                const m = text.match(/^(.+?)\s*\(\d+\).*$/);
                if (m) {
                    sectionName = m[1].trim();
                    return false; // break
                }
            });
            $section.find('[data-itemid]').each((_, rowEl) => {
                const $row = $(rowEl);
                const hasDirectSvg = $row.children('svg').length > 0;
                if (!hasDirectSvg) {
                    // Shape 1 — spec row: <p> label + sibling value span
                    const $innerDiv = $row.children('div').first();
                    const $p = $innerDiv.children('p').first();
                    const label = $p.text();
                    if (!label)
                        return;
                    const value = $p.nextAll().first().text();
                    addSpec(sectionName, label, value);
                }
                else {
                    // Shapes 2 & 3 — feature row (SVG tick icon)
                    const $contentDiv = $row.children('div').first();
                    const $ul = $contentDiv.find('ul').first();
                    if ($ul.length) {
                        // Shape 2 — complex feature with sub-list values
                        const label = $contentDiv.find('div').first().find('span').first().text();
                        if (!label)
                            return;
                        const liTexts = [];
                        $ul.find('li').each((_, liEl) => {
                            // Each li: <span>•</span><span>value text</span> — take last span
                            const t = this.cleanText($(liEl).find('span').last().text());
                            if (t && t !== '•')
                                liTexts.push(t);
                        });
                        addSpec(sectionName, label, liTexts.join(', ') || 'Yes');
                    }
                    else {
                        // Shape 3 — simple feature: the text itself is the label, presence = "Yes"
                        const text = this.cleanText($contentDiv.text());
                        if (text && !text.toLowerCase().includes('available in next variant')) {
                            addSpec(sectionName, text, 'Yes');
                        }
                    }
                }
            });
        });
        return specs;
    }
    static async extractCarData(url) {
        const html = await this.fetchHtml(url);
        const $ = cheerio.load(html);
        const jsonLd = this.parseJsonLd(html);
        // Car name from h1
        const name = this.cleanText($('h1').first().text() || jsonLd?.name || '');
        // Brand from JSON-LD (either string or {name:string} object)
        const brandRaw = jsonLd?.brand;
        const brand = typeof brandRaw === 'string'
            ? brandRaw
            : typeof brandRaw?.name === 'string'
                ? brandRaw.name
                : '';
        // Slug from model name or URL last path segment
        const urlSlug = url.replace(/\/+$/, '').split('/').pop() || '';
        const model = jsonLd?.model || '';
        const slug = this.slugify(model || urlSlug || name);
        // Price range: "Rs. 8.26  - 13.01 Lakh" from body text
        const bodyText = $('body').text();
        const priceRangeMatch = bodyText.match(/Rs\.\s*([\d,.]+)\s*-\s*([\d,.]+)\s*Lakh/i);
        let minPrice;
        let maxPrice;
        let priceRangeText;
        if (priceRangeMatch) {
            priceRangeText = this.cleanText(priceRangeMatch[0]);
            minPrice = Math.round(parseFloat(priceRangeMatch[1].replace(/,/g, '')) * 100000);
            maxPrice = Math.round(parseFloat(priceRangeMatch[2].replace(/,/g, '')) * 100000);
        }
        // Body type from JSON-LD bodyType or description text
        let bodyType = jsonLd?.bodyType || '';
        if (!bodyType) {
            const descText = jsonLd?.description || bodyText;
            const m = descText.match(/\b(Sub-Compact SUV|Compact SUV|SUV|Sedan|Hatchback|MUV|MPV|Coupe|Convertible|Pickup Truck)\b/i);
            if (m)
                bodyType = m[1];
        }
        // Fuel type from JSON-LD or description (pick first mentioned)
        const fuelText = jsonLd?.description || bodyText;
        const fuelMatch = fuelText.match(/\b(Petrol|Diesel|Electric|CNG|Hybrid)\b/i);
        const fuelType = fuelMatch?.[1] || '';
        return {
            name,
            brand,
            slug,
            description: jsonLd?.description,
            price_range_text: priceRangeText,
            min_price: minPrice,
            max_price: maxPrice,
            fuel_type: fuelType,
            body_type: bodyType,
            source_url: url,
        };
    }
    static async extractVariantData(url) {
        const html = await this.fetchHtml(url);
        const $ = cheerio.load(html);
        const jsonLd = this.parseJsonLd(html);
        // Specific variant name from the "Variant: X" paragraph inside the specs section
        let variantName = '';
        $('[data-section-id="specs-features-section-v2"] p').each((_, pEl) => {
            const text = $(pEl).text();
            if (text.includes('Variant:')) {
                variantName = this.cleanText(text.replace(/Variant:\s*/, ''));
                return false; // break
            }
        });
        // Fallback: strip brand + model from JSON-LD name
        if (!variantName && jsonLd?.name) {
            const brandRaw = jsonLd?.brand;
            const brandStr = typeof brandRaw === 'string' ? brandRaw : brandRaw?.name || '';
            const modelStr = jsonLd?.model || '';
            variantName = this.cleanText(jsonLd.name.replace(brandStr, '').replace(modelStr, ''));
        }
        if (!variantName)
            variantName = this.cleanText($('h1').first().text());
        const fullName = this.cleanText(jsonLd?.name || $('h1').first().text() || variantName);
        // Price: first "Rs. X Lakh" in the raw HTML is the primary displayed on-road price.
        // JSON-LD offers.price may reference a different sub-variant within the trim group.
        let price = 0;
        let priceText = '';
        const rawPriceMatch = html.match(/Rs\.\s*([\d.]+)\s*Lakh/i);
        if (rawPriceMatch) {
            priceText = this.cleanText(rawPriceMatch[0]);
            price = this.parsePrice(priceText) || 0;
        }
        if (price === 0 && jsonLd?.offers?.price) {
            price = parseInt(String(jsonLd.offers.price), 10);
            priceText = `Rs. ${(price / 100000).toFixed(2)} Lakh`;
        }
        const specs = this.parseSpecs($);
        // Fuel type: prefer the "Fuel Type" spec row (reflects the variant shown on page)
        // over JSON-LD fuelType which may reference a different sub-variant in the trim group.
        const fuelTypeFromSpec = specs.find(s => s.label.toLowerCase() === 'fuel type')?.value || '';
        const fuelType = fuelTypeFromSpec || jsonLd?.fuelType || '';
        // Transmission: prefer spec row "Transmission" (e.g., "Manual - 5 Gears") then JSON-LD.
        const transmissionFromSpec = specs.find(s => s.label.toLowerCase() === 'transmission')?.value || '';
        const transmissionRaw = jsonLd?.vehicleTransmission;
        const transmissionFromJsonLd = typeof transmissionRaw === 'string'
            ? transmissionRaw
            : typeof transmissionRaw?.name === 'string'
                ? transmissionRaw.name
                : '';
        const transmission = transmissionFromSpec || transmissionFromJsonLd;
        // Write debug log
        const logDir = path.resolve(process.cwd(), 'logs', 'imports');
        fs.mkdirSync(logDir, { recursive: true });
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const logSlug = this.slugify(variantName).slice(0, 40);
        const logFile = path.join(logDir, `extracted-cw-${logSlug}-${timestamp}.json`);
        fs.writeFileSync(logFile, JSON.stringify({ url, variantName, fullName, price, priceText, fuelType, transmission, specs_count: specs.length, specs }, null, 2), 'utf-8');
        return {
            variant_name: variantName,
            full_name: fullName,
            price,
            price_text: priceText,
            fuel_type: fuelType,
            transmission,
            specs,
            source_url: url,
        };
    }
}
exports.CarWaleExtractor = CarWaleExtractor;
