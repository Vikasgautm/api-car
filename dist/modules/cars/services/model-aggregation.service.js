"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelAggregationService = void 0;
const car_variant_model_1 = require("../../../models/car-variant.model");
const car_model_1 = require("../../../models/car.model");
class ModelAggregationService {
    /**
     * Aggregate all variant specs into model-level aggregates.
     * Used to populate summary cards and filter facets.
     */
    static async aggregateModelFromVariants(carId) {
        const car = await car_model_1.Car.findOne({ car_id: carId }).lean();
        if (!car)
            throw new Error(`Car not found: ${carId}`);
        const variants = await car_variant_model_1.CarVariant.find({
            car_id: carId,
            is_deleted: false,
            is_published: true,
        }).lean();
        if (variants.length === 0) {
            return {
                car_id: carId,
                car_name: car.name,
                brand_name: car.brand_id?.toString(),
                body_type: car.body_type_name || undefined,
                variant_count: 0,
                published_variant_count: 0,
            };
        }
        const aggregates = {
            car_id: carId,
            car_name: car.name,
            brand_name: car.brand_id?.toString(),
            body_type: car.body_type_name || undefined,
            variant_count: variants.length,
            published_variant_count: variants.length,
            available_fuel_types: [],
            available_transmissions: [],
            available_drivetrains: [],
        };
        const prices = [];
        const powers = [];
        const torques = [];
        const ranges = [];
        const seating = [];
        const ncapRatings = [];
        // Track which features are available (at least one variant has it)
        const featureFlags = {
            has_sunroof: false,
            has_panoramic_sunroof: false,
            has_adas: false,
            has_ventilated_seats: false,
            has_camera_360: false,
            has_connected_car: false,
            has_wireless_charger: false,
            has_android_auto: false,
            has_apple_carplay: false,
            has_led_headlights: false,
        };
        const fuelTypes = new Set();
        const transmissions = new Set();
        const drivetrains = new Set();
        for (const variant of variants) {
            // Collect prices
            if (variant.ex_showroom_price) {
                prices.push(variant.ex_showroom_price);
            }
            // Collect powertrain options
            if (variant.fuel_type_id) {
                fuelTypes.add(variant.fuel_type_id.toString());
            }
            if (variant.transmission_type) {
                transmissions.add(variant.transmission_type);
            }
            if (variant.drivetrain) {
                drivetrains.add(variant.drivetrain);
            }
            // Collect seating
            if (variant.seating_capacity) {
                seating.push(variant.seating_capacity);
            }
            const specs = variant.specs_normalized || {};
            // Engine performance
            const enginePerf = specs.engine_performance;
            if (enginePerf?.max_power)
                powers.push(Number(enginePerf.max_power));
            if (enginePerf?.max_torque)
                torques.push(Number(enginePerf.max_torque));
            // EV range
            const battery = specs.battery_charging;
            if (battery?.electric_range)
                ranges.push(Number(battery.electric_range));
            // NCAP rating
            const safety = specs.safety;
            if (safety?.ncap_rating)
                ncapRatings.push(safety.ncap_rating);
            if (safety?.bncap_rating)
                ncapRatings.push(safety.bncap_rating);
            if (safety?.global_ncap_rating)
                ncapRatings.push(safety.global_ncap_rating);
            // Feature availability (check if truthy)
            const interior = specs.interior;
            if (interior?.sunroof)
                featureFlags.has_sunroof = true;
            if (interior?.panoramic_sunroof === true)
                featureFlags.has_panoramic_sunroof = true;
            const comfort = specs.comfort_convenience;
            if (comfort?.ventilated_seats)
                featureFlags.has_ventilated_seats = true;
            const infotain = specs.infotainment_connectivity;
            if (infotain?.wireless_charging === true)
                featureFlags.has_wireless_charger = true;
            if (infotain?.android_auto === true)
                featureFlags.has_android_auto = true;
            if (infotain?.apple_carplay === true)
                featureFlags.has_apple_carplay = true;
            if (safety?.camera_360 === true)
                featureFlags.has_camera_360 = true;
            const adas = specs.adas;
            if (adas && Object.values(adas).some(v => v === true))
                featureFlags.has_adas = true;
            const connectedCar = specs.connected_car;
            if (connectedCar && Object.values(connectedCar).some(v => v === true))
                featureFlags.has_connected_car = true;
            const exterior = specs.exterior;
            if (exterior?.led_headlights === true)
                featureFlags.has_led_headlights = true;
        }
        // Set aggregates
        if (prices.length > 0) {
            aggregates.price_range_min = Math.min(...prices);
            aggregates.price_range_max = Math.max(...prices);
        }
        if (powers.length > 0) {
            aggregates.min_power_bhp = Math.min(...powers);
            aggregates.max_power_bhp = Math.max(...powers);
        }
        if (torques.length > 0) {
            aggregates.min_torque_nm = Math.min(...torques);
            aggregates.max_torque_nm = Math.max(...torques);
        }
        if (ranges.length > 0) {
            aggregates.min_range_km = Math.min(...ranges);
            aggregates.max_range_km = Math.max(...ranges);
        }
        if (seating.length > 0) {
            aggregates.min_seating_capacity = Math.min(...seating);
            aggregates.max_seating_capacity = Math.max(...seating);
        }
        if (ncapRatings.length > 0) {
            aggregates.best_ncap_rating = Math.max(...ncapRatings);
        }
        aggregates.available_fuel_types = Array.from(fuelTypes);
        aggregates.available_transmissions = Array.from(transmissions);
        aggregates.available_drivetrains = Array.from(drivetrains);
        // Set feature flags
        Object.assign(aggregates, featureFlags);
        return aggregates;
    }
    /**
     * Batch aggregate for multiple cars — runs all aggregations in parallel.
     */
    static async aggregateMultipleCars(carIds) {
        const results = await Promise.allSettled(carIds.map(carId => this.aggregateModelFromVariants(carId)));
        return results
            .map((result, idx) => {
            if (result.status === 'rejected') {
                console.error(`Failed to aggregate model ${carIds[idx]}:`, result.reason);
                return null;
            }
            return result.value;
        })
            .filter((r) => r !== null);
    }
}
exports.ModelAggregationService = ModelAggregationService;
//# sourceMappingURL=model-aggregation.service.js.map