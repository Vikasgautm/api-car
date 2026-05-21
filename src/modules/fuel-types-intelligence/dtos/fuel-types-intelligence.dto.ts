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

// GET /summary
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

// GET /brands
export interface BrandFuelRow {
  brand_id: string;
  brand_name: string;
  brand_slug: string;
  fuels: Record<string, number>; // fuel_slug -> distinct car count
  total: number;
}

export interface BrandsResponse {
  fuel_types: FuelTypeRef[];
  rows: BrandFuelRow[];
  generated_at: string;
}

// GET /body-types
export interface FuelBodyTypeRow {
  fuel_type_id: string;
  fuel_name: string;
  fuel_slug: string;
  body_types: Record<string, number>; // body_type_slug -> distinct car count
}

export interface BodyTypesResponse {
  body_type_list: TaxonomyRef[];
  rows: FuelBodyTypeRow[];
  generated_at: string;
}

// GET /budget
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

// GET /brand-body-budget
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

// GET /seating
export interface FuelSeatingRow {
  fuel_type_id: string;
  fuel_name: string;
  fuel_slug: string;
  seating: Record<string, number>; // seating_capacity -> distinct car count
}

export interface SeatingResponse {
  seating_capacities: number[];
  rows: FuelSeatingRow[];
  generated_at: string;
}

// GET /lifecycle
export interface LifecycleFuelRow {
  lifecycle: string;
  fuels: Record<string, number>; // fuel_slug -> distinct car count
  total: number;
}

export interface LifecycleResponse {
  fuel_types: FuelTypeRef[];
  rows: LifecycleFuelRow[];
  generated_at: string;
}

// GET /health
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

// GET /multi-fuel
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
