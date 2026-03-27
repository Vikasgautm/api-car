import { Brand } from '../../../models/brand.model';
import { v4 as uuidv4 } from 'uuid';
import { generateSlug } from '../../../utils/slugify';

export class BrandService {
  static async getAllBrands(query: any) {
    const { q, page = 1, limit = 10 } = query;
    const filter: any = { is_deleted: false };

    if (q) {
      filter.brand_name = { $regex: q, $options: 'i' };
    }

    const skip = (page - 1) * limit;
    const brands = await Brand.find(filter).skip(skip).limit(Number(limit));
    const total = await Brand.countDocuments(filter);

    return { brands, total, page, limit };
  }

  static async getBrandBySlug(slug: string) {
    return await Brand.findOne({ brand_slug: slug, is_deleted: false });
  }

  static async createBrand(brandData: any) {
    const brand_uuid = uuidv4();
    const brand_slug = generateSlug(brandData.brand_name);
    
    return await Brand.create({
      ...brandData,
      brand_uuid,
      brand_slug,
    });
  }
}
