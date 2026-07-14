export type SpecDataType = 'string' | 'number' | 'boolean' | 'list' | 'date';
export type SpecCategory = 'engine_performance' | 'mileage_range' | 'battery_charging' | 'dimensions_practicality' | 'suspension_steering_brakes' | 'tyres_wheels' | 'safety' | 'adas' | 'comfort_convenience' | 'infotainment_connectivity' | 'connected_car' | 'interior' | 'exterior' | 'warranty';

export interface IVariantSpecKey  {
  key_id: string;
  name: string;
  slug: string;
  category: SpecCategory;
  section: string;
  data_type: SpecDataType;
  unit?: string;
  aliases: string[];
  fuel_type_visibility?: string[];
  is_published: boolean;
  is_deleted: boolean;
  sort_order?: number;
  display_order?: number;
}

import { BaseModel } from '../sql/common/BaseModel';
export const VariantSpecKey = new BaseModel<IVariantSpecKey>('VariantSpecKeys', 'spec_id', ['validation_rules']);
