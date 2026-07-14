import { v4 as uuidv4 } from 'uuid';

export interface IUnknownValue {
  unknown_id: string;
  category_key: string;
  raw_value: string;
  context?: string;         // e.g. variant_id, import_session_id
  occurrence_count: number;
  is_resolved: boolean;
  resolved_to?: string;     // value of the master option it was mapped to
  resolved_at?: Date;
  created_at: Date;
  updated_at: Date;
}

import { BaseModel } from '../../../sql/common/BaseModel';
export const UnknownValue = new BaseModel<IUnknownValue>('UnknownValues', 'unknown_id');
