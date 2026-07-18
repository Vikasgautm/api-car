export class FilterUtil {
  static escapeRegExp(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  static buildSearchFilter(
    fields: string[],
    searchTerm: string
  ): Record<string, unknown> {
    if (!searchTerm || !fields.length) return {};

    const trimmed = searchTerm.trim();
    const escaped = this.escapeRegExp(trimmed);
    const flexiblePattern = escaped.replace(/\s+/g, '[\\s-_]+');

    const pattern = /^[a-zA-Z0-9\s-_]+$/.test(trimmed)
      ? `\\b${flexiblePattern}\\b`
      : flexiblePattern;

    const regex = new RegExp(pattern, 'i');
    const searchConditions = fields.map((field) => ({
      [field]: regex,
    }));

    return { $or: searchConditions };
  }

  static mergeFilterWithOr(filter: Record<string, any>, searchFilter: Record<string, any>): Record<string, any> {
    if (!searchFilter || Object.keys(searchFilter).length === 0) return filter;
    if (!filter || Object.keys(filter).length === 0) {
      Object.assign(filter, searchFilter);
      return filter;
    }

    if (filter.$or) {
      const existingOr = filter.$or;
      delete filter.$or;
      filter.$and = filter.$and || [];
      filter.$and.push({ $or: existingOr }, searchFilter);
      return filter;
    } else {
      Object.assign(filter, searchFilter);
      return filter;
    }
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
