export interface FuelTypeRef {
    id: string;
    name: string;
    slug: string;
}
export interface TaxonomyRef {
    id: string;
    name: string;
    slug: string;
}
export interface FuelSummaryItem {
    fuel_type_id: string;
    name: string;
    slug: string;
    total_cars: number;
    total_brands: number;
    inventory_pct: number;
}
export interface FuelSummaryResponse {
    items: FuelSummaryItem[];
    total_cars: number;
    generated_at: string;
}
export interface BrandFuelRow {
    brand_id: string;
    brand_name: string;
    brand_slug: string;
    fuels: Record<string, number>;
    total: number;
}
export interface BrandsResponse {
    fuel_types: FuelTypeRef[];
    rows: BrandFuelRow[];
    generated_at: string;
}
export interface FuelBodyTypeRow {
    fuel_type_id: string;
    fuel_name: string;
    fuel_slug: string;
    body_types: Record<string, number>;
}
export interface BodyTypesResponse {
    body_type_list: TaxonomyRef[];
    rows: FuelBodyTypeRow[];
    generated_at: string;
}
export interface BudgetSlabCount {
    label: string;
    count: number;
}
export interface FuelBudgetItem {
    fuel_type_id: string;
    fuel_name: string;
    fuel_slug: string;
    slabs: BudgetSlabCount[];
}
export interface BudgetResponse {
    items: FuelBudgetItem[];
    slab_labels: string[];
    generated_at: string;
}
export interface NestedSlab {
    label: string;
    count: number;
}
export interface NestedBodyType {
    body_type_slug: string;
    body_type_name: string;
    slabs: NestedSlab[];
    total: number;
}
export interface NestedFuel {
    fuel_slug: string;
    fuel_name: string;
    body_types: NestedBodyType[];
    total: number;
}
export interface NestedBrand {
    brand_id: string;
    brand_name: string;
    brand_slug: string;
    fuels: NestedFuel[];
    total: number;
}
export interface BrandBodyBudgetResponse {
    brands: NestedBrand[];
    slab_labels: string[];
    generated_at: string;
}
export interface FuelSeatingRow {
    fuel_type_id: string;
    fuel_name: string;
    fuel_slug: string;
    seating: Record<string, number>;
}
export interface SeatingResponse {
    seating_capacities: number[];
    rows: FuelSeatingRow[];
    generated_at: string;
}
export interface LifecycleFuelRow {
    lifecycle: string;
    fuels: Record<string, number>;
    total: number;
}
export interface LifecycleResponse {
    fuel_types: FuelTypeRef[];
    rows: LifecycleFuelRow[];
    generated_at: string;
}
export interface FuelHealthIssue {
    car_id: string;
    car_name: string;
    car_slug: string;
    issue: string;
    issue_code: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
}
export interface HealthResponse {
    issues: FuelHealthIssue[];
    total: number;
    generated_at: string;
}
export interface MultiFuelRow {
    brand_id: string;
    brand_name: string;
    brand_slug: string;
    multi_fuel_models: number;
    total_models: number;
}
export interface MultiFuelResponse {
    rows: MultiFuelRow[];
    total_multi_fuel_cars: number;
    generated_at: string;
}
//# sourceMappingURL=fuel-types-intelligence.dto.d.ts.map