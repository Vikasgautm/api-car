export declare class SpecNormalizationService {
    static normalizeMileage(raw: string | number | undefined): string | undefined;
    static normalizePower(raw: string | undefined): string | undefined;
    static normalizeTorque(raw: string | undefined): string | undefined;
    static normalizeDisplacement(raw: string | undefined): string | undefined;
    static normalizeFuelType(raw: string | undefined): string | undefined;
    static normalizePrice(raw: string | number | undefined): number | undefined;
    static normalizeSpecs(rawSpecs: Record<string, any>): Record<string, any>;
}
