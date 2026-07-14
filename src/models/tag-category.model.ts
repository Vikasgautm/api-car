export interface ITagCategory  {
  tag_category_id: string;
  name: string;
  slug: string;
  type: string;
  description?: string;
  is_published: boolean;
  is_deleted: boolean;
  sort_order: number;
}

import { BaseModel } from '../sql/common/BaseModel';
export const TagCategory = new BaseModel<ITagCategory>('TagCategories', 'category_id');
