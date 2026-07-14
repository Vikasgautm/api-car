import slugify from 'slugify';
import { BaseModel } from '../../sql/common/BaseModel';

export class SlugUtil {
  static generate(text: string): string {
    if (!text) return '';
    return slugify(text, {
      lower: true,
      strict: true,
      trim: true,
      replacement: '-',
    });
  }

  static generateUnique(baseText: string, existingSlugs: string[]): string {
    let slug = this.generate(baseText);
    let counter = 1;

    while (existingSlugs.includes(slug)) {
      slug = `${this.generate(baseText)}-${counter}`;
      counter++;
    }

    return slug;
  }

  static validate(slug: string): boolean {
    return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
  }

  static sanitize(text: string): string {
    if (!text) return '';
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  static fromId(id: string, prefix?: string): string {
    const base = prefix ? `${prefix}-` : '';
    return `${base}${id}`;
  }
}

export async function generateSlugWithIncrement(
  baseSlug: string,
  Model: BaseModel<any> | any,
  fieldName: string = 'slug',
): Promise<string> {
  let slug = baseSlug;
  let counter = 1;

  while (await Model.findOne({ [fieldName]: slug })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}
