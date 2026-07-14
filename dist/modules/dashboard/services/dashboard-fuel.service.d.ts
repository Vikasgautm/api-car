export interface FuelSnapshot {
    petrol: number;
    diesel: number;
    electric: number;
    hybrid: number;
    cng: number;
    strongest_segment: string;
    total_variants: number;
}
export declare class DashboardFuelService {
    static getSnapshot(): Promise<FuelSnapshot>;
}
