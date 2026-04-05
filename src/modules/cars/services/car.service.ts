import { Car } from "../../../models/car.model";
import { CarVariant } from "../../../models/car-variant.model";
import { v4 as uuidv4 } from "uuid";
import { generateSlug } from "../../../utils/slugify";
import { v2 as cloudinary } from "cloudinary";
import { Brand } from "../../../models/brand.model";

export class CarService {
  static async getAllCars(query: any, fetchAsAdmin = false) {
    const {
      brand_id,
      body_type_id,
      page = 1,
      limit = 10,
      category,
      q,
      is_deleted,
    } = query;

    const filter: any = { is_deleted: is_deleted === "true" };
    if (!fetchAsAdmin && is_deleted !== "true") {
      filter.is_published = true;
    }

    if (brand_id) filter.brand_id = brand_id;
    // if (body_type_id) filter.body_type_id = body_type_id;
    if (q) filter.car_name = { $regex: q, $options: "i" };

    if (category) {
      const categoryFields: any = {
        latest: "latest",
        popular: "popular",
        recommended: "recommended",
        upcoming: "upcoming",
        electric: "electric",
      };
      if (categoryFields[category]) {
        filter[categoryFields[category]] = true;
      }
    }

    const skip = ((Number(page) || 1) - 1) * (Number(limit) || 10);
    const cars = await Car.find(filter)
      .populate("brand_id", "brand_name brand_slug")
      // .populate('body_type_id', 'name slug')
      .skip(skip)
      .limit(Number(limit) || 10)
      .sort({ createdAt: -1 });

    const total = await Car.countDocuments(filter);

    return { cars, total, page: Number(page) || 1, limit: Number(limit) || 10 };
  }

  static async getCarBySlug(slug: string) {
    const car = await Car.findOne({ slug, is_deleted: false })
      .populate("brand_id", "brand_name brand_slug")
      .populate("body_type_id", "name slug");

    if (!car) return null;

    const variants = await CarVariant.find({
      car_id: car.car_id,
      is_published: true,
    });

    return { car, variants };
  }

  static async createCar(carData: any) {
    const car_id = uuidv4();
    let slug = generateSlug(carData.car_name);
    // const brand = await Brand.findOne({ brand_slug: carData.brand_slug });

    const existing = await Car.findOne({ slug });
    if (existing) {
      slug = `${slug}-${Date.now()}`;
    }

    return await Car.create({
      ...carData,
      // brand_id: brand._id,
      car_id,
      slug,
    });
  }

  static async updateCar(id: string, carData: any) {
    if (carData.car_name) {
      carData.slug = generateSlug(carData.car_name);
    }
    return await Car.findByIdAndUpdate(id, carData, {
      returnDocument: "after",
    });
  }

  static async deleteCar(id: string) {
    return await Car.findByIdAndUpdate(
      id,
      { is_deleted: true },
      { returnDocument: "after" },
    );
  }

  static async restoreCar(id: string) {
    return await Car.findByIdAndUpdate(
      id,
      { is_deleted: false },
      { returnDocument: "after" },
    );
  }
}
