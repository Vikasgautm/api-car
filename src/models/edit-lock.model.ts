export interface IEditLock  {
  lock_id: string;
  entity_type: string;
  entity_id: string;
  locked_by: string;
  locked_by_name: string;
  locked_by_email: string;
  expires_at: Date;
}

import { BaseModel } from '../sql/common/BaseModel';
export const EditLock = new BaseModel<IEditLock>('EditLocks', 'lock_id');
