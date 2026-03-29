import { Car } from '../../../models/car.model';
import { CarVariant } from '../../../models/car-variant.model';
import { v4 as uuidv4 } from 'uuid';
import { generateSlug } from '../../../utils/slugify';
import { v2 as cloudinary } from 'cloudinary';

export class CarService {
  static async getAllCars(query: any, fetchAsAdmin = false) {
    const { 
      brand_id, 
      body_type_id, 
      page = 1, 
      limit = 10,
      category,
      q
    } = query;
    
    const filter: any = { is_deleted: false };
    if (!fetchAsAdmin) {
        filter.is_published = true;
    }
    
    if (brand_id) filter.brand_id = brand_id;
    if (body_type_id) filter.body_type_id = body_type_id;
    if (q) filter.car_name = { $regex: q, $options: 'i' };
    
    if (category) {
      const categoryFields: any = {
        latest: 'latest',
        popular: 'popular',
        recommended: 'recommended',
        upcoming: 'upcoming',
        electric: 'electric',
      };
      if (categoryFields[category]) {
        filter[categoryFields[category]] = true;
      }
    }

    const skip = ((Number(page) || 1) - 1) * (Number(limit) || 10);
    const cars = await Car.find(filter)
      .populate('brand_id', 'brand_name brand_slug')
      .populate('body_type_id', 'name slug')
      .skip(skip)
      .limit(Number(limit) || 10)
      .sort({ createdAt: -1 });
      
    const total = await Car.countDocuments(filter);

    return { cars, total, page: Number(page) || 1, limit: Number(limit) || 10 };
  }

  static async getCarBySlug(slug: string) {
    const car = await Car.findOne({ slug, is_deleted: false })
      .populate('brand_id', 'brand_name brand_slug')
      .populate('body_type_id', 'name slug');
      
    if (!car) return null;

    const variants = await CarVariant.find({ car_id: car.car_id, is_published: true });
    
    return { car, variants };
  }

  static async createCar(carData: any) {
    const car_id = uuidv4();
    let slug = generateSlug(carData.car_name);
    
    const existing = await Car.findOne({ slug });
    if (existing) {
        slug = `${slug}-${Date.now()}`;
    }

    return await Car.create({
      ...carData,
      car_id,
      slug,
    });
  }

  static async updateCar(id: string, carData: any) {
    if (carData.car_name) {
      carData.slug = generateSlug(carData.car_name);
    }
    return await Car.findByIdAndUpdate(id, carData, { new: true });
  }

  static async deleteCar(id: string) {
    const car = await Car.findById(id);
    if (!car) return null;

    if (car.thumbnail?.preview) {
        const publicIdMatch = car.thumbnail.preview.match(/\/v\d+\/(.+?)\.\w+$/);
        if (publicIdMatch && publicIdMatch[1]) {
          try {
            await cloudinary.uploader.destroy(publicIdMatch[1]);
          } catch (e) {}
        }
    }

    if (car.images && car.images.length > 0) {
        for (const img of car.images) {
            const match = img.preview.match(/\/v\d+\/(.+?)\.\w+$/);
            if (match && match[1]) {
                try {
                await cloudinary.uploader.destroy(match[1]);
                } catch (e) {}
            }
        }
    }

    return await Car.findByIdAndDelete(id);
  }
}
