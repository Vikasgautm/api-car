/**
 * Powertrain Detector Service
 * Analyzes normalized specs to determine powertrain capabilities.
 *
 * Sets flags:
 * - has_engine: true if ICE/Hybrid detected
 * - has_battery: true if EV/Hybrid detected
 * - has_motor: true if EV/Hybrid detected
 * - has_external_charging: true if EV or Plug-in Hybrid detected
 *
 * This enables dynamic, powertrain-aware category and field visibility.
 */

import { SpecsNormalized } from '../../../models/car-variant.model';

export interface PowertrainFlags {
  has_engine: boolean;
  has_battery: boolean;
  has_motor: boolean;
  has_external_charging: boolean;
  confidence: number; // 0-1
  detected_type: 'ice' | 'ev' | 'hybrid' | 'plug_in_hybrid' | 'unknown';
}

export class PowertrainDetectorService {
  /**
   * Detect powertrain capabilities from normalized specs
   */
  static detect(
    specs_normalized: SpecsNormalized | undefined,
    fuel_type_slug: string | undefined
  ): PowertrainFlags {
    const engine = specs_normalized?.engine_performance;
    const battery = specs_normalized?.battery_charging;

    // If no specs, fall back to fuel type
    if (!specs_normalized) {
      return this.detectFromFuelType(fuel_type_slug);
    }

    const hasEngineSigns = this.hasEngineSigns(engine);
    const hasBatterySigns = this.hasBatterySigns(battery);
    const hasMotorSigns = this.hasMotorSigns(battery);
    const hasChargingSigns = this.hasChargingSigns(battery);

    // Determine type
    let type: PowertrainFlags['detected_type'] = 'unknown';
    let confidence = 0;

    if (hasEngineSigns && !hasBatterySigns) {
      // Pure ICE
      type = 'ice';
      confidence = 0.95;
    } else if (!hasEngineSigns && hasBatterySigns && hasMotorSigns) {
      // Pure EV
      type = 'ev';
      confidence = 0.95;
    } else if (hasEngineSigns && hasBatterySigns && hasMotorSigns) {
      // Hybrid (strong or plug-in)
      if (hasChargingSigns) {
        type = 'plug_in_hybrid';
        confidence = 0.9;
      } else {
        type = 'hybrid';
        confidence = 0.9;
      }
    } else if (fuel_type_slug) {
      // Fallback to fuel type slug if available
      const fuelTypeResult = this.detectFromFuelType(fuel_type_slug);
      type = fuelTypeResult.detected_type;
      confidence = 0.7;
    }

    return {
      has_engine: hasEngineSigns || (type === 'ice' || type === 'hybrid' || type === 'plug_in_hybrid'),
      has_battery: hasBatterySigns || (type === 'ev' || type === 'hybrid' || type === 'plug_in_hybrid'),
      has_motor: hasMotorSigns || (type === 'ev' || type === 'hybrid' || type === 'plug_in_hybrid'),
      has_external_charging: hasChargingSigns || (type === 'ev' || type === 'plug_in_hybrid'),
      confidence,
      detected_type: type,
    };
  }

  /**
   * Detect from fuel type slug when specs aren't available
   */
  private static detectFromFuelType(fuel_type_slug: string | undefined): PowertrainFlags {
    if (!fuel_type_slug) {
      return {
        has_engine: false,
        has_battery: false,
        has_motor: false,
        has_external_charging: false,
        confidence: 0,
        detected_type: 'unknown',
      };
    }

    const slug = fuel_type_slug.toLowerCase();

    // Electric
    if (slug.includes('electric') || slug === 'ev' || slug === 'bev') {
      return {
        has_engine: false,
        has_battery: true,
        has_motor: true,
        has_external_charging: true,
        confidence: 0.9,
        detected_type: 'ev',
      };
    }

    // Plug-in Hybrid
    if (slug.includes('plug-in') || slug.includes('phev')) {
      return {
        has_engine: true,
        has_battery: true,
        has_motor: true,
        has_external_charging: true,
        confidence: 0.9,
        detected_type: 'plug_in_hybrid',
      };
    }

    // Hybrid
    if (slug.includes('hybrid')) {
      return {
        has_engine: true,
        has_battery: true,
        has_motor: true,
        has_external_charging: false,
        confidence: 0.9,
        detected_type: 'hybrid',
      };
    }

    // CNG or Dual fuel (still ICE)
    if (slug.includes('cng') || slug.includes('dual') || slug.includes('lpg')) {
      return {
        has_engine: true,
        has_battery: false,
        has_motor: false,
        has_external_charging: false,
        confidence: 0.9,
        detected_type: 'ice',
      };
    }

    // Default to ICE for petrol/diesel
    return {
      has_engine: true,
      has_battery: false,
      has_motor: false,
      has_external_charging: false,
      confidence: 0.8,
      detected_type: 'ice',
    };
  }

  /**
   * Check if engine signs are present
   */
  private static hasEngineSigns(engine: any): boolean {
    if (!engine) return false;

    // Strong signals
    if (engine.displacement || engine.max_power || engine.max_torque || engine.cylinders) {
      return true;
    }

    // Weaker signals
    if (engine.fuel_system || engine.turbocharger || engine.supercharger || engine.cng_power_torque) {
      return true;
    }

    return false;
  }

  /**
   * Check if battery signs are present
   */
  private static hasBatterySigns(battery: any): boolean {
    if (!battery) return false;

    // Strong signals
    if (
      battery.battery_capacity_kwh ||
      battery.battery_capacity ||
      battery.battery_type ||
      battery.battery_chemistry
    ) {
      return true;
    }

    // Moderate signals
    if (battery.electric_range || battery.real_world_range) {
      return true;
    }

    return false;
  }

  /**
   * Check if motor signs are present
   */
  private static hasMotorSigns(battery: any): boolean {
    if (!battery) return false;

    if (battery.motor_type || battery.motor_power_kw || battery.motor_torque_nm || battery.number_of_motors) {
      return true;
    }

    return false;
  }

  /**
   * Check if charging signs are present (indicates external charging capability)
   */
  private static hasChargingSigns(battery: any): boolean {
    if (!battery) return false;

    // Charging port is strongest signal
    if (battery.charging_port_type) return true;

    // Charging speeds or times
    if (
      battery.max_ac_charging_speed_kw ||
      battery.max_dc_charging_speed_kw ||
      battery.ac_charging_time ||
      battery.dc_fast_charging_time ||
      battery.charging_time_7kw ||
      battery.charging_time_50kw
    ) {
      return true;
    }

    return false;
  }
}
