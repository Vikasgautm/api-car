"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VariantPushService = void 0;
const VariantImportStaging_1 = require("../models/VariantImportStaging");
const ImportSession_1 = require("../models/ImportSession");
const car_variant_model_1 = require("../../../models/car-variant.model");
class VariantPushService {
    static async pushVariant(stagingId, pushedBy) {
        const staging = await VariantImportStaging_1.VariantImportStaging.findById(stagingId);
        if (!staging)
            return { staging_id: stagingId, success: false, error: 'Staging record not found', action: 'failed' };
        if (!staging.linked_car_id) {
            return { staging_id: stagingId, success: false, error: 'No linked car — link before pushing', action: 'failed' };
        }
        if (staging.import_status === 'pushed') {
            return { staging_id: stagingId, success: false, error: 'Already pushed', action: 'skipped' };
        }
        if (staging.import_status === 'rejected') {
            return { staging_id: stagingId, success: false, error: 'Variant is rejected', action: 'failed' };
        }
        try {
            const slug = this.buildSlug(staging);
            const existing = await car_variant_model_1.CarVariant.findOne({ slug });
            let variantId;
            if (existing) {
                // Update existing variant with imported specs (non-destructive merge)
                const update = {};
                if (staging.price)
                    update.ex_showroom_price = staging.price;
                if (staging.fuel_type)
                    update.fuel_type_id = staging.fuel_type;
                if (staging.transmission)
                    update.transmission_type = staging.transmission.toLowerCase().replace(/ /g, '_');
                if (Object.keys(staging.normalized_specs || {}).length > 0) {
                    update.specs_raw = { ...(existing.specs_raw || {}), ...staging.normalized_specs };
                }
                await car_variant_model_1.CarVariant.updateOne({ _id: existing._id }, { $set: update });
                variantId = String(existing._id);
            }
            else {
                const variantData = {
                    car_id: staging.linked_car_id,
                    variant_name: staging.variant_name,
                    slug,
                    is_published: false,
                    is_deleted: false,
                    ex_showroom_price: staging.price,
                    fuel_type_id: staging.fuel_type,
                    transmission_type: staging.transmission ? staging.transmission.toLowerCase().replace(/ /g, '_') : undefined,
                    specs_raw: staging.normalized_specs || {},
                };
                const variant = new car_variant_model_1.CarVariant(variantData);
                await variant.save();
                variantId = String(variant._id);
            }
            await VariantImportStaging_1.VariantImportStaging.updateOne({ _id: staging._id }, {
                $set: {
                    import_status: 'pushed',
                    pushed_variant_id: variantId,
                    pushed_by: pushedBy,
                },
            });
            // Update session counters
            if (staging.import_session_id) {
                await ImportSession_1.ImportSession.updateOne({ _id: staging.import_session_id }, { $inc: { pushed_variants: 1 } });
            }
            return { staging_id: stagingId, variant_id: variantId, success: true, action: 'created' };
        }
        catch (err) {
            await VariantImportStaging_1.VariantImportStaging.updateOne({ _id: staging._id }, { $set: { import_status: 'validation_failed' } });
            return { staging_id: stagingId, success: false, error: err.message, action: 'failed' };
        }
    }
    static async pushBulk(stagingIds, pushedBy) {
        const results = [];
        for (const id of stagingIds) {
            results.push(await this.pushVariant(id, pushedBy));
        }
        return results;
    }
    static async getDiff(stagingId) {
        const staging = await VariantImportStaging_1.VariantImportStaging.findById(stagingId);
        if (!staging || !staging.linked_car_id)
            return [];
        const slug = this.buildSlug(staging);
        const existing = await car_variant_model_1.CarVariant.findOne({ slug });
        if (!existing)
            return [];
        const diffs = [];
        const compareFields = [
            { key: 'ex_showroom_price', stagingKey: 'price' },
            { key: 'fuel_type_id', stagingKey: 'fuel_type' },
            { key: 'transmission_type', stagingKey: 'transmission' },
        ];
        for (const f of compareFields) {
            const existingVal = existing[f.key];
            const importedVal = staging[f.stagingKey];
            if (importedVal !== undefined && String(existingVal) !== String(importedVal)) {
                diffs.push({ field: f.key, existing: existingVal, imported: importedVal });
            }
        }
        const rawSpecs = staging.normalized_specs || {};
        const existingRaw = existing.specs_raw || {};
        for (const [key, val] of Object.entries(rawSpecs)) {
            if (existingRaw[key] !== undefined && String(existingRaw[key]) !== String(val)) {
                diffs.push({ field: key, existing: existingRaw[key], imported: val });
            }
        }
        return diffs;
    }
    static buildSlug(staging) {
        const carPart = (staging.linked_car_name || staging.source_car_name)
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, '-')
            .trim();
        const variantPart = staging.variant_name
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, '-')
            .trim();
        return `${carPart}-${variantPart}`;
    }
}
exports.VariantPushService = VariantPushService;
//# sourceMappingURL=VariantPushService.js.map