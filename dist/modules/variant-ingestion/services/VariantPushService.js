"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VariantPushService = void 0;
const VariantImportStaging_1 = require("../models/VariantImportStaging");
const ImportSession_1 = require("../models/ImportSession");
const car_variant_model_1 = require("../../../models/car-variant.model");
const fuel_type_model_1 = require("../../../models/fuel-type.model");
const uuid_1 = require("uuid");
const import_normalizer_service_1 = require("../../imports/services/import-normalizer.service");
const powertrain_detector_service_1 = require("../../variants/services/powertrain-detector.service");
const car_aggregation_service_1 = require("../../../shared/services/car-aggregation.service");
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
            // Resolve raw fuel type display name (e.g. 'Petrol') to the canonical UUID
            // (e.g. 'fuel_type_abc123') before saving. Storing raw names in fuel_type_id
            // corrupts the column and breaks all variant-by-fuel-type queries.
            let resolvedFuelTypeId;
            let fuelTypeSlug = 'petrol';
            if (staging.fuel_type) {
                const fuelTypeDoc = await fuel_type_model_1.FuelType.findOne({
                    $or: [
                        { name: { $regex: new RegExp(`^${staging.fuel_type}$`, 'i') } },
                        { fuel_type_id: staging.fuel_type }, // already a UUID — pass through
                    ],
                    is_deleted: false,
                }).lean();
                if (fuelTypeDoc) {
                    resolvedFuelTypeId = fuelTypeDoc.fuel_type_id;
                    fuelTypeSlug = fuelTypeDoc.slug || 'petrol';
                }
                // If no match, skip setting fuel_type_id rather than storing the raw name.
            }
            // Produce the nested SpecsNormalized structure from raw specs.
            // staging.normalized_specs is a flat cleaned record (SpecNormalizationService output)
            // and belongs in specs_raw. ImportNormalizerService maps flat raw → nested SpecsNormalized.
            const normReport = import_normalizer_service_1.ImportNormalizerService.normalize(staging.raw_specs || {});
            const powertrainFlags = powertrain_detector_service_1.PowertrainDetectorService.detect(normReport.specs_normalized, fuelTypeSlug);
            // Extract root-level fields from raw_specs (these are not in specs_normalized)
            const rootFields = this.extractRootFields(staging.raw_specs || {}, normReport.specs_normalized);
            const slug = this.buildSlug(staging);
            const existing = await car_variant_model_1.CarVariant.findOne({ slug });
            let variantId;
            if (existing) {
                // Non-destructive merge: fill gaps in specs_normalized per section, overwrite scalar fields
                const existingNormalized = existing.specs_normalized || {};
                const incomingNormalized = normReport.specs_normalized;
                const mergedNormalized = { ...existingNormalized };
                for (const [section, val] of Object.entries(incomingNormalized)) {
                    if (val && typeof val === 'object' && !Array.isArray(val)) {
                        mergedNormalized[section] = { ...(existingNormalized[section] || {}), ...val };
                    }
                    else if (val !== null && val !== undefined) {
                        mergedNormalized[section] = val;
                    }
                }
                const update = { specs_normalized: mergedNormalized };
                if (staging.price)
                    update.ex_showroom_price = staging.price;
                if (resolvedFuelTypeId)
                    update.fuel_type_id = resolvedFuelTypeId;
                if (staging.transmission)
                    update.transmission_type = staging.transmission.toLowerCase().replace(/ /g, '_');
                if (Object.keys(staging.raw_specs || {}).length > 0) {
                    update.specs_raw = { ...(existing.specs_raw || {}), ...staging.raw_specs };
                }
                update.has_engine = powertrainFlags.has_engine;
                update.has_battery = powertrainFlags.has_battery;
                update.has_motor = powertrainFlags.has_motor;
                update.has_external_charging = powertrainFlags.has_external_charging;
                // Merge root-level fields (only overwrite if not already set)
                if (rootFields.body_type && !existing.body_type)
                    update.body_type = rootFields.body_type;
                if (rootFields.trim_name && !existing.trim_name)
                    update.trim_name = rootFields.trim_name;
                if (rootFields.drivetrain && !existing.drivetrain)
                    update.drivetrain = rootFields.drivetrain;
                if (rootFields.seating_capacity && !existing.seating_capacity)
                    update.seating_capacity = rootFields.seating_capacity;
                await car_variant_model_1.CarVariant.updateOne({ _id: existing._id }, { $set: update });
                variantId = existing.variant_id;
            }
            else {
                const newVariantId = (0, uuid_1.v4)();
                const variantData = {
                    variant_id: newVariantId,
                    car_id: staging.linked_car_id,
                    variant_name: staging.variant_name,
                    slug,
                    model_year: this.extractModelYear(staging),
                    is_published: false,
                    is_deleted: false,
                    is_archived: false,
                    ex_showroom_price: staging.price,
                    ...(resolvedFuelTypeId ? { fuel_type_id: resolvedFuelTypeId } : {}),
                    transmission_type: staging.transmission ? staging.transmission.toLowerCase().replace(/ /g, '_') : undefined,
                    specs_normalized: normReport.specs_normalized,
                    specs_raw: staging.raw_specs || {},
                    has_engine: powertrainFlags.has_engine,
                    has_battery: powertrainFlags.has_battery,
                    has_motor: powertrainFlags.has_motor,
                    has_external_charging: powertrainFlags.has_external_charging,
                    // Root-level fields extracted from raw_specs
                    ...(rootFields.body_type ? { body_type: rootFields.body_type } : {}),
                    ...(rootFields.trim_name ? { trim_name: rootFields.trim_name } : {}),
                    ...(rootFields.drivetrain ? { drivetrain: rootFields.drivetrain } : {}),
                    ...(rootFields.seating_capacity ? { seating_capacity: rootFields.seating_capacity } : {}),
                };
                const variant = car_variant_model_1.CarVariant.createDraft(variantData);
                await variant.save();
                variantId = variant.variant_id;
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
            // Recompute car aggregates so price range, fuel types, and variant count stay current
            try {
                await car_aggregation_service_1.CarAggregationService.recomputeFullAggregates(staging.linked_car_id);
            }
            catch {
                // Non-fatal — aggregates will reconcile on next manual recompute
            }
            return { staging_id: stagingId, variant_id: variantId, success: true, action: 'created' };
        }
        catch (err) {
            await VariantImportStaging_1.VariantImportStaging.updateOne({ _id: staging._id }, { $set: { import_status: 'push_failed', push_error: err.message } });
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
        const rawSpecs = staging.raw_specs || {};
        const existingRaw = existing.specs_raw || {};
        for (const [key, val] of Object.entries(rawSpecs)) {
            if (existingRaw[key] !== undefined && String(existingRaw[key]) !== String(val)) {
                diffs.push({ field: key, existing: existingRaw[key], imported: val });
            }
        }
        return diffs;
    }
    static extractRootFields(rawSpecs, specsNormalized) {
        const raw = rawSpecs;
        const dims = (specsNormalized?.dimensions_practicality || {});
        // Helper to try multiple key variants from raw_specs
        const pick = (...keys) => {
            for (const k of keys) {
                const v = raw[k] ?? raw[k.toLowerCase()] ?? raw[k.replace(/_/g, ' ')];
                if (v !== undefined && v !== null && String(v).trim() !== '')
                    return String(v).trim();
            }
            return undefined;
        };
        const seatingRaw = pick('seating_capacity', 'seats', 'seating capacity', 'no of seats', 'number of seats')
            ?? (dims.seating_capacity ? String(dims.seating_capacity) : undefined);
        const seating = seatingRaw ? parseInt(seatingRaw, 10) : undefined;
        return {
            body_type: pick('body_type', 'body type', 'car body', 'car type'),
            trim_name: pick('trim_name', 'trim name', 'trim', 'grade'),
            drivetrain: pick('drivetrain', 'drive_type', 'drive type', '4wd', 'awd', 'fwd', 'rwd', 'drivewheel'),
            seating_capacity: seating && !isNaN(seating) ? seating : undefined,
        };
    }
    static extractModelYear(staging) {
        const specYear = staging.normalized_specs?.model_year ||
            staging.normalized_specs?.year ||
            staging.raw_specs?.model_year ||
            staging.raw_specs?.year;
        if (specYear) {
            const parsed = parseInt(String(specYear), 10);
            if (!isNaN(parsed) && parsed > 1900 && parsed < 2100) {
                return parsed;
            }
        }
        const yearRegex = /\b(19\d\d|20\d\d)\b/;
        const nameMatch = staging.variant_name?.match(yearRegex) ||
            staging.source_car_name?.match(yearRegex) ||
            (staging.normalized_car_name && staging.normalized_car_name.match(yearRegex));
        if (nameMatch) {
            return parseInt(nameMatch[1], 10);
        }
        return new Date().getFullYear();
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
