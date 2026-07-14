export interface IImageCategory  {
  category_id: string;
  name: string;
  slug: string;
  description?: string;
  is_active: boolean;
  is_published: boolean;
  sort_order: number;
  display_order?: number;
  is_deleted?: boolean;
  deleted_at?: Date;
}

import { BaseModel } from '../sql/common/BaseModel';
export const ImageCategory = new BaseModel<IImageCategory>('ImageCategories', 'category_id');
