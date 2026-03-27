import { Car } from '../../../models/car.model';
import { CarVariant } from '../../../models/car-variant.model';
import { v4 as uuidv4 } from 'uuid';
import { generateSlug } from '../../../utils/slugify';

export class CarService {
  static async getAllCars(query: any) {
    const { 
      brand_id, 
      body_type_id, 
      page = 1, 
      limit = 10,
      category,
      q
    } = query;
    
    const filter: any = { is_deleted: false };
    
    if (brand_id) filter.brand_id = brand_id;
    if (body_type_id) filter.body_type_id = body_type_id;
    if (q) filter.car_name = { $regex: q, $options: 'i' };
    
    if (category) {
      const categoryFields: any = {
        latest: 'latest',
        popular: 'popular',
        recommended: 'recommended',
        upcomming: 'upcomming',
        electric: 'electric',
      };
      if (categoryFields[category]) {
        filter[categoryFields[category]] = true;
      }
    }

    const skip = (page - 1) * limit;
    const cars = await Car.find(filter)
      .populate('brand_id', 'brand_name brand_slug')
      .populate('body_type_id', 'name slug')
      .skip(skip)
      .limit(Number(limit));
      
    const total = await Car.countDocuments(filter);

    return { cars, total, page, limit };
  }

  static async getCarBySlug(slug: string) {
    const car = await Car.findOne({ slug, is_deleted: false })
      .populate('brand_id')
      .populate('body_type_id');
      
    if (!car) return null;

    const variants = await CarVariant.find({ car_id: car.car_id, is_published: true });
    
    return { car, variants };
  }

  static async createCar(carData: any) {
    const car_id = uuidv4();
    const slug = generateSlug(carData.car_name);
    
    return await Car.create({
      ...carData,
      car_id,
      slug,
    });
  }
}
