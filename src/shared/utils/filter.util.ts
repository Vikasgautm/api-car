export class FilterUtil {
  static buildSearchFilter(
    fields: string[],
    searchTerm: string
  ): Record<string, unknown> {
    if (!searchTerm || !fields.length) return {};

    const regex = new RegExp(searchTerm, 'i');
    const searchConditions = fields.map((field) => ({
      [field]: regex,
    }));

    return { $or: searchConditions };
  }

  static buildSortFilter(
    sortBy: string,
    sortOrder: 'asc' | 'desc' = 'asc'
  ): Record<string, 1 | -1> {
    return { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
  }

  static buildDateRangeFilter(
    field: string,
    startDate?: Date,
    endDate?: Date
  ): Record<string, unknown> {
    const filter: Record<string, unknown> = {};

    if (startDate || endDate) {
      filter[field] = {};
      if (startDate) (filter[field] as Record<string, Date>).$gte = startDate;
      if (endDate) (filter[field] as Record<string, Date>).$lte = endDate;
    }

    return filter;
  }

  static buildArrayFilter<T>(
    field: string,
    values: T[]
  ): Record<string, unknown> {
    if (!values || values.length === 0) return {};
    return { [field]: { $in: values } };
  }

  static buildObjectIdFilter(
    field: string,
    value: string | undefined
  ): Record<string, unknown> {
    if (!value) return {};
    return { [field]: value };
  }

  static buildNumericRangeFilter(
    field: string,
    min?: number,
    max?: number
  ): Record<string, unknown> {
    const filter: Record<string, unknown> = {};

    if (min !== undefined || max !== undefined) {
      filter[field] = {};
      if (min !== undefined) (filter[field] as Record<string, number>).$gte = min;
      if (max !== undefined) (filter[field] as Record<string, number>).$lte = max;
    }

    return filter;
  }

  static buildBooleanFilter(
    field: string,
    value: boolean | undefined
  ): Record<string, unknown> {
    if (value === undefined) return {};
    return { [field]: value };
  }

  static buildEnumFilter<T extends string>(
    field: string,
    value: T | undefined
  ): Record<string, unknown> {
    if (!value) return {};
    return { [field]: value };
  }
}
