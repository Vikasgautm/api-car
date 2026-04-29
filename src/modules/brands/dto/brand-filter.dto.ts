export class BrandFilterDto {
  page?: number = 1;
  limit?: number = 10;
  q?: string;
  is_published?: boolean;
  is_featured?: boolean;
  sortBy?: string = 'name';
  sortOrder?: 'asc' | 'desc' = 'asc';
}
