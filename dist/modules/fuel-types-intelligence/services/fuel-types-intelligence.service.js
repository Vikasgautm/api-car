"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FuelTypesIntelligenceService = void 0;
const car_variant_model_1 = require("../../../models/car-variant.model");
const car_model_1 = require("../../../models/car.model");
const fuel_type_model_1 = require("../../../models/fuel-type.model");
const brand_model_1 = require("../../../models/brand.model");
const body_type_model_1 = require("../../../models/body-type.model");
// Only count variants that are active (published, not deleted, not archived)
const ACTIVE_MATCH = { is_published: true, is_deleted: false, is_archived: false };
// Centralised budget slabs — mirrors frontend shared/constants/budget-slabs.ts
const BUDGET_SLABS = [
    { label: 'Under 5L', min: 0, max: 500000 },
    { label: '5–10L', min: 500000, max: 1000000 },
    { label: '10–15L', min: 1000000, max: 1500000 },
    { label: '15–20L', min: 1500000, max: 2000000 },
    { label: '20–30L', min: 2000000, max: 3000000 },
    { label: '30–50L', min: 3000000, max: 5000000 },
    { label: '50L–1Cr', min: 5000000, max: 10000000 },
    { label: 'Above 1Cr', min: 10000000, max: null },
];
const SLAB_LABELS = BUDGET_SLABS.map((s) => s.label);
function budgetSlabSwitch() {
    return {
        $switch: {
            branches: BUDGET_SLABS.filter((s) => s.max !== null).map((s) => ({
                case: { $and: [{ $gte: ['$car_price', s.min] }, { $lt: ['$car_price', s.max] }] },
                then: s.label,
            })),
            default: 'Above 1Cr',
        },
    };
}
function now() {
    return new Date().toISOString();
}
class FuelTypesIntelligenceService {
    static async getSummary() {
        const fuelTypes = await fuel_type_model_1.FuelType.find({ is_published: true, is_deleted: false })
            .select('fuel_type_id name slug')
            .lean();
        if (!fuelTypes.length) {
            return { items: [], total_cars: 0, generated_at: now() };
        }
        // Group by (car_id, fuel_type_id) first for distinct pairs, then lookup car for brand_id,
        // then group by fuel_type_id. Avoids array-localField $lookup which has unreliable semantics.
        const rows = await car_variant_model_1.CarVariant.aggregate([
            { $match: { ...ACTIVE_MATCH, fuel_type_id: { $exists: true, $ne: null } } },
            { $group: { _id: { car_id: '$car_id', fuel_type_id: '$fuel_type_id' } } },
            {
                $lookup: {
                    from: 'cars',
                    localField: '_id.car_id',
                    foreignField: 'car_id',
                    as: 'car_doc',
                    pipeline: [{ $match: { is_deleted: false } }, { $project: { brand_id: 1 } }],
                },
            },
            { $unwind: { path: '$car_doc', preserveNullAndEmptyArrays: false } },
            {
                $group: {
                    _id: '$_id.fuel_type_id',
                    car_ids: { $addToSet: '$_id.car_id' },
                    brand_ids: { $addToSet: '$car_doc.brand_id' },
                },
            },
            {
                $project: {
                    fuel_type_id: '$_id',
                    car_count: { $size: '$car_ids' },
                    brand_count: { $size: '$brand_ids' },
                },
            },
        ]);
        const rowMap = {};
        for (const r of rows) {
            rowMap[r.fuel_type_id] = { car_count: r.car_count, brand_count: r.brand_count };
        }
        const totalCars = Object.values(rowMap).reduce((sum, r) => sum + r.car_count, 0);
        const items = fuelTypes.map((ft) => {
            const stats = rowMap[ft.fuel_type_id] || { car_count: 0, brand_count: 0 };
            return {
                fuel_type_id: ft.fuel_type_id,
                name: ft.name,
                slug: ft.slug,
                total_cars: stats.car_count,
                total_brands: stats.brand_count,
                inventory_pct: totalCars > 0 ? Math.round((stats.car_count / totalCars) * 100 * 10) / 10 : 0,
            };
        });
        return { items, total_cars: totalCars, generated_at: now() };
    }
    static async getBrands() {
        const [fuelTypes, brands] = await Promise.all([
            fuel_type_model_1.FuelType.find({ is_published: true, is_deleted: false }).select('fuel_type_id name slug').lean(),
            brand_model_1.Brand.find({ is_deleted: false }).select('brand_id name slug').lean(),
        ]);
        const brandMap = {};
        for (const b of brands)
            brandMap[b.brand_id] = { name: b.name, slug: b.slug };
        const fuelMap = {};
        for (const ft of fuelTypes)
            fuelMap[ft.fuel_type_id] = { name: ft.name, slug: ft.slug };
        // Aggregate: per (car_id, fuel_type_id) → distinct, then lookup brand via Car
        const agg = await car_variant_model_1.CarVariant.aggregate([
            { $match: { ...ACTIVE_MATCH, fuel_type_id: { $exists: true, $ne: null } } },
            { $group: { _id: { car_id: '$car_id', fuel_type_id: '$fuel_type_id' } } },
            {
                $lookup: {
                    from: 'cars',
                    localField: '_id.car_id',
                    foreignField: 'car_id',
                    as: 'car_doc',
                    pipeline: [{ $match: { is_deleted: false } }, { $project: { brand_id: 1 } }],
                },
            },
            { $unwind: { path: '$car_doc', preserveNullAndEmptyArrays: false } },
            {
                $group: {
                    _id: { brand_id: '$car_doc.brand_id', fuel_type_id: '$_id.fuel_type_id' },
                    car_count: { $sum: 1 },
                },
            },
        ]);
        // Pivot into brand rows
        const brandRows = {};
        for (const row of agg) {
            const bid = row._id.brand_id;
            const fid = row._id.fuel_type_id;
            const fslug = fuelMap[fid]?.slug ?? fid;
            if (!brandRows[bid])
                brandRows[bid] = { fuels: {}, total: 0 };
            brandRows[bid].fuels[fslug] = (brandRows[bid].fuels[fslug] || 0) + row.car_count;
            brandRows[bid].total += row.car_count;
        }
        const rows = Object.entries(brandRows)
            .map(([bid, data]) => ({
            brand_id: bid,
            brand_name: brandMap[bid]?.name ?? bid,
            brand_slug: brandMap[bid]?.slug ?? bid,
            fuels: data.fuels,
            total: data.total,
        }))
            .sort((a, b) => b.total - a.total);
        return {
            fuel_types: fuelTypes.map((ft) => ({ id: ft.fuel_type_id, name: ft.name, slug: ft.slug })),
            rows,
            generated_at: now(),
        };
    }
    static async getBodyTypes() {
        const [fuelTypes, bodyTypes] = await Promise.all([
            fuel_type_model_1.FuelType.find({ is_published: true, is_deleted: false }).select('fuel_type_id name slug').lean(),
            body_type_model_1.BodyType.find({ is_deleted: false }).select('body_type_id name slug').lean(),
        ]);
        const bodyMap = {};
        for (const bt of bodyTypes)
            bodyMap[bt.body_type_id] = { name: bt.name, slug: bt.slug };
        const fuelMap = {};
        for (const ft of fuelTypes)
            fuelMap[ft.fuel_type_id] = { name: ft.name, slug: ft.slug };
        const agg = await car_variant_model_1.CarVariant.aggregate([
            { $match: { ...ACTIVE_MATCH, fuel_type_id: { $exists: true, $ne: null } } },
            { $group: { _id: { car_id: '$car_id', fuel_type_id: '$fuel_type_id' } } },
            {
                $lookup: {
                    from: 'cars',
                    localField: '_id.car_id',
                    foreignField: 'car_id',
                    as: 'car_doc',
                    pipeline: [{ $match: { is_deleted: false } }, { $project: { body_type_id: 1 } }],
                },
            },
            { $unwind: { path: '$car_doc', preserveNullAndEmptyArrays: false } },
            {
                $group: {
                    _id: { fuel_type_id: '$_id.fuel_type_id', body_type_id: '$car_doc.body_type_id' },
                    car_count: { $sum: 1 },
                },
            },
        ]);
        const fuelRows = {};
        for (const ft of fuelTypes)
            fuelRows[ft.fuel_type_id] = {};
        for (const row of agg) {
            const fid = row._id.fuel_type_id;
            const bid = row._id.body_type_id;
            const bslug = bodyMap[bid]?.slug ?? bid;
            if (!fuelRows[fid])
                fuelRows[fid] = {};
            fuelRows[fid][bslug] = (fuelRows[fid][bslug] || 0) + row.car_count;
        }
        const rows = fuelTypes.map((ft) => ({
            fuel_type_id: ft.fuel_type_id,
            fuel_name: ft.name,
            fuel_slug: ft.slug,
            body_types: fuelRows[ft.fuel_type_id] || {},
        }));
        return {
            body_type_list: bodyTypes.map((bt) => ({ id: bt.body_type_id, name: bt.name, slug: bt.slug })),
            rows,
            generated_at: now(),
        };
    }
    static async getBudget() {
        const fuelTypes = await fuel_type_model_1.FuelType.find({ is_published: true, is_deleted: false })
            .select('fuel_type_id name slug')
            .lean();
        const fuelMap = {};
        for (const ft of fuelTypes)
            fuelMap[ft.fuel_type_id] = { name: ft.name, slug: ft.slug };
        const agg = await car_variant_model_1.CarVariant.aggregate([
            { $match: { ...ACTIVE_MATCH, fuel_type_id: { $exists: true, $ne: null } } },
            { $group: { _id: { car_id: '$car_id', fuel_type_id: '$fuel_type_id' } } },
            {
                $lookup: {
                    from: 'cars',
                    localField: '_id.car_id',
                    foreignField: 'car_id',
                    as: 'car_doc',
                    pipeline: [
                        { $match: { is_deleted: false } },
                        { $project: { min_variant_price: 1, ex_showroom_price: 1 } },
                    ],
                },
            },
            { $unwind: { path: '$car_doc', preserveNullAndEmptyArrays: false } },
            {
                $addFields: {
                    car_price: {
                        $ifNull: ['$car_doc.min_variant_price', '$car_doc.ex_showroom_price'],
                    },
                },
            },
            { $match: { car_price: { $gt: 0 } } },
            {
                $addFields: {
                    budget_slab: budgetSlabSwitch(),
                },
            },
            {
                $group: {
                    _id: { fuel_type_id: '$_id.fuel_type_id', budget_slab: '$budget_slab' },
                    car_count: { $sum: 1 },
                },
            },
        ]);
        const fuelSlabs = {};
        for (const ft of fuelTypes)
            fuelSlabs[ft.fuel_type_id] = {};
        for (const row of agg) {
            const fid = row._id.fuel_type_id;
            if (!fuelSlabs[fid])
                fuelSlabs[fid] = {};
            fuelSlabs[fid][row._id.budget_slab] = (fuelSlabs[fid][row._id.budget_slab] || 0) + row.car_count;
        }
        const items = fuelTypes.map((ft) => ({
            fuel_type_id: ft.fuel_type_id,
            fuel_name: ft.name,
            fuel_slug: ft.slug,
            slabs: SLAB_LABELS.map((label) => ({
                label,
                count: fuelSlabs[ft.fuel_type_id]?.[label] ?? 0,
            })),
        }));
        return { items, slab_labels: SLAB_LABELS, generated_at: now() };
    }
    static async getBrandBodyBudget() {
        const [fuelTypes, brands, bodyTypes] = await Promise.all([
            fuel_type_model_1.FuelType.find({ is_published: true, is_deleted: false }).select('fuel_type_id name slug').lean(),
            brand_model_1.Brand.find({ is_deleted: false }).select('brand_id name slug').lean(),
            body_type_model_1.BodyType.find({ is_deleted: false }).select('body_type_id name slug').lean(),
        ]);
        const fuelMap = {};
        for (const ft of fuelTypes)
            fuelMap[ft.fuel_type_id] = { name: ft.name, slug: ft.slug };
        const brandMap = {};
        for (const b of brands)
            brandMap[b.brand_id] = { name: b.name, slug: b.slug };
        const bodyMap = {};
        for (const bt of bodyTypes)
            bodyMap[bt.body_type_id] = { name: bt.name, slug: bt.slug };
        const agg = await car_variant_model_1.CarVariant.aggregate([
            { $match: { ...ACTIVE_MATCH, fuel_type_id: { $exists: true, $ne: null } } },
            { $group: { _id: { car_id: '$car_id', fuel_type_id: '$fuel_type_id' } } },
            {
                $lookup: {
                    from: 'cars',
                    localField: '_id.car_id',
                    foreignField: 'car_id',
                    as: 'car_doc',
                    pipeline: [
                        { $match: { is_deleted: false } },
                        { $project: { brand_id: 1, body_type_id: 1, min_variant_price: 1, ex_showroom_price: 1 } },
                    ],
                },
            },
            { $unwind: { path: '$car_doc', preserveNullAndEmptyArrays: false } },
            {
                $addFields: {
                    car_price: { $ifNull: ['$car_doc.min_variant_price', '$car_doc.ex_showroom_price'] },
                },
            },
            {
                $addFields: {
                    budget_slab: {
                        $cond: {
                            if: { $gt: ['$car_price', 0] },
                            then: budgetSlabSwitch(),
                            else: 'Unpriced',
                        },
                    },
                },
            },
            {
                $group: {
                    _id: {
                        brand_id: '$car_doc.brand_id',
                        fuel_type_id: '$_id.fuel_type_id',
                        body_type_id: '$car_doc.body_type_id',
                        budget_slab: '$budget_slab',
                    },
                    car_count: { $sum: 1 },
                },
            },
        ]);
        const tree = {};
        for (const row of agg) {
            const { brand_id, fuel_type_id, body_type_id, budget_slab } = row._id;
            if (!tree[brand_id])
                tree[brand_id] = {};
            if (!tree[brand_id][fuel_type_id])
                tree[brand_id][fuel_type_id] = {};
            if (!tree[brand_id][fuel_type_id][body_type_id])
                tree[brand_id][fuel_type_id][body_type_id] = {};
            const cur = tree[brand_id][fuel_type_id][body_type_id][budget_slab] || 0;
            tree[brand_id][fuel_type_id][body_type_id][budget_slab] = cur + row.car_count;
        }
        const brandResults = Object.entries(tree)
            .map(([bid, fuels]) => {
            let brandTotal = 0;
            const fuelEntries = Object.entries(fuels).map(([fid, bodies]) => {
                let fuelTotal = 0;
                const bodyEntries = Object.entries(bodies).map(([btid, slabMap]) => {
                    const slabTotal = Object.values(slabMap).reduce((s, c) => s + c, 0);
                    fuelTotal += slabTotal;
                    return {
                        body_type_slug: bodyMap[btid]?.slug ?? btid,
                        body_type_name: bodyMap[btid]?.name ?? btid,
                        slabs: SLAB_LABELS.map((l) => ({ label: l, count: slabMap[l] ?? 0 })),
                        total: slabTotal,
                    };
                });
                brandTotal += fuelTotal;
                return {
                    fuel_slug: fuelMap[fid]?.slug ?? fid,
                    fuel_name: fuelMap[fid]?.name ?? fid,
                    body_types: bodyEntries.sort((a, b) => b.total - a.total),
                    total: fuelTotal,
                };
            });
            return {
                brand_id: bid,
                brand_name: brandMap[bid]?.name ?? bid,
                brand_slug: brandMap[bid]?.slug ?? bid,
                fuels: fuelEntries.sort((a, b) => b.total - a.total),
                total: brandTotal,
            };
        })
            .sort((a, b) => b.total - a.total);
        return { brands: brandResults, slab_labels: SLAB_LABELS, generated_at: now() };
    }
    static async getSeating() {
        const fuelTypes = await fuel_type_model_1.FuelType.find({ is_published: true, is_deleted: false })
            .select('fuel_type_id name slug')
            .lean();
        const fuelMap = {};
        for (const ft of fuelTypes)
            fuelMap[ft.fuel_type_id] = { name: ft.name, slug: ft.slug };
        const agg = await car_variant_model_1.CarVariant.aggregate([
            {
                $match: {
                    ...ACTIVE_MATCH,
                    fuel_type_id: { $exists: true, $ne: null },
                    seating_capacity: { $exists: true, $gt: 0 },
                },
            },
            {
                $group: {
                    _id: { car_id: '$car_id', fuel_type_id: '$fuel_type_id', seating: '$seating_capacity' },
                },
            },
            {
                $group: {
                    _id: { fuel_type_id: '$_id.fuel_type_id', seating: '$_id.seating' },
                    car_count: { $sum: 1 },
                },
            },
        ]);
        const allSeating = new Set();
        const fuelSeating = {};
        for (const row of agg) {
            const fid = row._id.fuel_type_id;
            const seat = row._id.seating;
            allSeating.add(seat);
            if (!fuelSeating[fid])
                fuelSeating[fid] = {};
            fuelSeating[fid][String(seat)] = (fuelSeating[fid][String(seat)] || 0) + row.car_count;
        }
        const seatingCapacities = Array.from(allSeating).sort((a, b) => a - b);
        const rows = fuelTypes.map((ft) => ({
            fuel_type_id: ft.fuel_type_id,
            fuel_name: ft.name,
            fuel_slug: ft.slug,
            seating: fuelSeating[ft.fuel_type_id] || {},
        }));
        return { seating_capacities: seatingCapacities, rows, generated_at: now() };
    }
    static async getLifecycle() {
        const fuelTypes = await fuel_type_model_1.FuelType.find({ is_published: true, is_deleted: false })
            .select('fuel_type_id name slug')
            .lean();
        const fuelMap = {};
        for (const ft of fuelTypes)
            fuelMap[ft.fuel_type_id] = { name: ft.name, slug: ft.slug };
        const agg = await car_variant_model_1.CarVariant.aggregate([
            { $match: { ...ACTIVE_MATCH, fuel_type_id: { $exists: true, $ne: null } } },
            { $group: { _id: { car_id: '$car_id', fuel_type_id: '$fuel_type_id' } } },
            {
                $lookup: {
                    from: 'cars',
                    localField: '_id.car_id',
                    foreignField: 'car_id',
                    as: 'car_doc',
                    pipeline: [
                        { $match: { is_deleted: false } },
                        { $project: { status: 1, entity_lifecycle_state: 1 } },
                    ],
                },
            },
            { $unwind: { path: '$car_doc', preserveNullAndEmptyArrays: false } },
            {
                $addFields: {
                    lifecycle: { $ifNull: ['$car_doc.entity_lifecycle_state', '$car_doc.status'] },
                },
            },
            {
                $group: {
                    _id: { lifecycle: '$lifecycle', fuel_type_id: '$_id.fuel_type_id' },
                    car_count: { $sum: 1 },
                },
            },
        ]);
        const lifecycleMap = {};
        for (const row of agg) {
            const lc = row._id.lifecycle ?? 'unknown';
            const fid = row._id.fuel_type_id;
            const fslug = fuelMap[fid]?.slug ?? fid;
            if (!lifecycleMap[lc])
                lifecycleMap[lc] = {};
            lifecycleMap[lc][fslug] = (lifecycleMap[lc][fslug] || 0) + row.car_count;
        }
        const rows = Object.entries(lifecycleMap).map(([lc, fuels]) => ({
            lifecycle: lc,
            fuels,
            total: Object.values(fuels).reduce((s, c) => s + c, 0),
        }));
        return {
            fuel_types: fuelTypes.map((ft) => ({ id: ft.fuel_type_id, name: ft.name, slug: ft.slug })),
            rows,
            generated_at: now(),
        };
    }
    static async getHealth() {
        const issues = [];
        // 1. Published, non-deleted cars with no published active variants
        const carsNoVariants = await car_model_1.Car.aggregate([
            { $match: { is_deleted: false, is_published: true } },
            {
                $lookup: {
                    from: 'carvariants',
                    localField: 'car_id',
                    foreignField: 'car_id',
                    as: 'active_variants',
                    pipeline: [{ $match: ACTIVE_MATCH }],
                },
            },
            { $match: { active_variants: { $size: 0 } } },
            { $project: { car_id: 1, name: 1, slug: 1 } },
            { $limit: 200 },
        ]);
        for (const c of carsNoVariants) {
            issues.push({
                car_id: c.car_id,
                car_name: c.name,
                car_slug: c.slug,
                issue: 'Published car has no active variants',
                issue_code: 'NO_ACTIVE_VARIANTS',
                severity: 'critical',
            });
        }
        // 2. Variants with no fuel_type_id (active only)
        const variantsNoFuel = await car_variant_model_1.CarVariant.find({
            ...ACTIVE_MATCH,
            $or: [{ fuel_type_id: { $exists: false } }, { fuel_type_id: null }, { fuel_type_id: '' }],
        })
            .select('car_id variant_name')
            .lean()
            .limit(200);
        const carIds = [...new Set(variantsNoFuel.map((v) => v.car_id))];
        const carDocs = await car_model_1.Car.find({ car_id: { $in: carIds } })
            .select('car_id name slug')
            .lean();
        const carDocMap = {};
        for (const c of carDocs)
            carDocMap[c.car_id] = { name: c.name, slug: c.slug };
        const seenNoFuel = new Set();
        for (const v of variantsNoFuel) {
            if (seenNoFuel.has(v.car_id))
                continue;
            seenNoFuel.add(v.car_id);
            const car = carDocMap[v.car_id];
            issues.push({
                car_id: v.car_id,
                car_name: car?.name ?? v.car_id,
                car_slug: car?.slug ?? v.car_id,
                issue: 'Active variant(s) missing fuel type assignment',
                issue_code: 'VARIANT_NO_FUEL_TYPE',
                severity: 'high',
            });
        }
        // 3. Cars missing body_type_id
        const carsNoBodyType = await car_model_1.Car.find({
            is_deleted: false,
            is_published: true,
            $or: [{ body_type_id: { $exists: false } }, { body_type_id: null }, { body_type_id: '' }],
        })
            .select('car_id name slug')
            .lean()
            .limit(200);
        for (const c of carsNoBodyType) {
            issues.push({
                car_id: c.car_id,
                car_name: c.name,
                car_slug: c.slug,
                issue: 'Published car missing body type',
                issue_code: 'NO_BODY_TYPE',
                severity: 'high',
            });
        }
        // 4. Published non-upcoming cars with no price on any active variant
        const carsNoPrice = await car_model_1.Car.aggregate([
            { $match: { is_deleted: false, is_published: true, is_upcoming: false } },
            {
                $lookup: {
                    from: 'carvariants',
                    localField: 'car_id',
                    foreignField: 'car_id',
                    as: 'priced_variants',
                    pipeline: [
                        { $match: { ...ACTIVE_MATCH, ex_showroom_price: { $gt: 0 } } },
                    ],
                },
            },
            { $match: { priced_variants: { $size: 0 } } },
            { $project: { car_id: 1, name: 1, slug: 1 } },
            { $limit: 200 },
        ]);
        for (const c of carsNoPrice) {
            issues.push({
                car_id: c.car_id,
                car_name: c.name,
                car_slug: c.slug,
                issue: 'Launched car has no priced variants',
                issue_code: 'NO_PRICED_VARIANTS',
                severity: 'medium',
            });
        }
        return { issues, total: issues.length, generated_at: now() };
    }
    static async getMultiFuel() {
        const brands = await brand_model_1.Brand.find({ is_deleted: false }).select('brand_id name slug').lean();
        const brandMap = {};
        for (const b of brands)
            brandMap[b.brand_id] = { name: b.name, slug: b.slug };
        // Cars with more than 1 distinct fuel type across active variants
        const agg = await car_variant_model_1.CarVariant.aggregate([
            { $match: { ...ACTIVE_MATCH, fuel_type_id: { $exists: true, $ne: null } } },
            {
                $group: {
                    _id: '$car_id',
                    fuel_type_ids: { $addToSet: '$fuel_type_id' },
                },
            },
            {
                $lookup: {
                    from: 'cars',
                    localField: '_id',
                    foreignField: 'car_id',
                    as: 'car_doc',
                    pipeline: [{ $match: { is_deleted: false } }, { $project: { brand_id: 1 } }],
                },
            },
            { $unwind: { path: '$car_doc', preserveNullAndEmptyArrays: false } },
            {
                $group: {
                    _id: '$car_doc.brand_id',
                    total_models: { $sum: 1 },
                    multi_fuel_models: {
                        $sum: {
                            $cond: [{ $gt: [{ $size: '$fuel_type_ids' }, 1] }, 1, 0],
                        },
                    },
                },
            },
            { $sort: { multi_fuel_models: -1 } },
        ]);
        const totalMultiFuelCars = agg.reduce((sum, r) => sum + r.multi_fuel_models, 0);
        const rows = agg
            .filter((r) => r.multi_fuel_models > 0)
            .map((r) => ({
            brand_id: r._id,
            brand_name: brandMap[r._id]?.name ?? r._id,
            brand_slug: brandMap[r._id]?.slug ?? r._id,
            multi_fuel_models: r.multi_fuel_models,
            total_models: r.total_models,
        }));
        return { rows, total_multi_fuel_cars: totalMultiFuelCars, generated_at: now() };
    }
}
exports.FuelTypesIntelligenceService = FuelTypesIntelligenceService;
