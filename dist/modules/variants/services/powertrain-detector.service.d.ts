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
    confidence: number;
    detected_type: 'ice' | 'ev' | 'hybrid' | 'plug_in_hybrid' | 'unknown';
}
export declare class PowertrainDetectorService {
    /**
     * Detect powertrain capabilities from normalized specs
     */
    static detect(specs_normalized: SpecsNormalized | undefined, fuel_type_slug: string | undefined): PowertrainFlags;
    /**
     * Detect from fuel type slug when specs aren't available
     */
    private static detectFromFuelType;
    /**
     * Check if engine signs are present
     */
    private static hasEngineSigns;
    /**
     * Check if battery signs are present
     */
    private static hasBatterySigns;
    /**
     * Check if motor signs are present
     */
    private static hasMotorSigns;
    /**
     * Check if charging signs are present (indicates external charging capability)
     */
    private static hasChargingSigns;
}
//# sourceMappingURL=powertrain-detector.service.d.ts.map