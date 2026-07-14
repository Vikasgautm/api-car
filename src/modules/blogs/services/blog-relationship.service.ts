import { Blog } from '../../../models/blog.model';
import { AppError } from '../../../shared/utils/app-error.util';

export interface EntityConnections {
  connected_cars?: string[];
  connected_variants?: string[];
  connected_brands?: string[];
  connected_body_types?: string[];
  connected_fuel_types?: string[];
  connected_comparisons?: string[];
  connected_collections?: string[];
}

export class BlogRelationshipService {
  static async updateConnections(blogId: string, connections: EntityConnections) {
    const update: Record<string, any> = {};

    if (connections.connected_cars !== undefined) update.connected_cars = connections.connected_cars;
    if (connections.connected_variants !== undefined) update.connected_variants = connections.connected_variants;
    if (connections.connected_brands !== undefined) update.connected_brands = connections.connected_brands;
    if (connections.connected_body_types !== undefined) update.connected_body_types = connections.connected_body_types;
    if (connections.connected_fuel_types !== undefined) update.connected_fuel_types = connections.connected_fuel_types;
    if (connections.connected_comparisons !== undefined) update.connected_comparisons = connections.connected_comparisons;
    if (connections.connected_collections !== undefined) update.connected_collections = connections.connected_collections;

    const blog = await Blog.findOneAndUpdate(
      { blog_id: blogId, is_deleted: false },
      { $set: update },
      { returnDocument: 'after' }
    );

    if (!blog) {
      throw new AppError('Blog not found', 404);
    }

    return blog;
  }

  static async getConnections(blogId: string) {
    const blog = await Blog.findOne({ blog_id: blogId, is_deleted: false })
      .select('blog_id connected_cars connected_variants connected_brands connected_body_types connected_fuel_types connected_comparisons connected_collections')
      .lean();

    if (!blog) {
      throw new AppError('Blog not found', 404);
    }

    return blog;
  }

  static async getRelatedEntityNames(blogId: string) {
    const Car = (await import('../../../models/car.model')).Car;
    const Brand = (await import('../../../models/brand.model')).Brand;

    const blog = await Blog.findOne({ blog_id: blogId, is_deleted: false })
      .select('connected_cars connected_brands connected_collections')
      .lean();

    if (!blog) {
      throw new AppError('Blog not found', 404);
    }

    const [cars, brands] = await Promise.all([
      (blog as any).connected_cars?.length
        ? Car.find({ car_id: { $in: (blog as any).connected_cars } }).select('car_id name slug').lean()
        : [],
      (blog as any).connected_brands?.length
        ? Brand.find({ brand_id: { $in: (blog as any).connected_brands } }).select('brand_id name slug').lean()
        : [],
    ]);

    return {
      cars,
      brands,
      connections: blog,
    };
  }
}
