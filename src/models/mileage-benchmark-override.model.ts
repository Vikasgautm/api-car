import { FuelCategory } from '../constants/mileage-benchmarks';

export interface IMileageBenchmarkOverride  {
  override_id: string;
  body_type_id: string;
  fuel_category: FuelCategory;
  thresholds: {
    weak_max: number;
    average_max: number;
    good_max: number;
  };
  updated_by?: string;
}

import { BaseModel } from '../sql/common/BaseModel';
export const MileageBenchmarkOverride = new BaseModel<IMileageBenchmarkOverride>('MileageBenchmarkOverrides', 'override_id');
