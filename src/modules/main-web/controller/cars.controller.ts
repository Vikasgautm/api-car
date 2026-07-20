import { Request, Response } from 'express';
import { ResponseUtil } from '../../../shared/utils/response.util';
import { catchAsync } from '../../../utils/catchAsync';
import { carsService } from '../service/cars.service';
import { webBrandsService } from '../service/brands.service';
import { webComparisonService } from '../service/comparison.service';
import { webBlogsService } from '../service/blogs.service';

class WebCarsController {
  public getCars = catchAsync(async (req: Request, res: Response) => {
    const { page, limit, q, brand, bodyType, fuelType, budget, minPrice, maxPrice, seating, status, sortBy, sortOrder } = req.query;

    const data = await carsService.getAllCars({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      q: q as string,
      brand: brand as string,
      bodyType: bodyType as string,
      fuelType: fuelType as string,
      budget: budget as string,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      seating: seating ? Number(seating) : undefined,
      status: status as string,
      sortBy: sortBy as string,
      sortOrder: sortOrder as string
    });

    return ResponseUtil.success(res, data, 'Cars fetched successfully');
  });

  public getCarDetail = catchAsync(async (req: Request, res: Response) => {
    const idOrSlug = (req.params.idOrSlug as string) || '';
    const car = await carsService.getCarByIdOrSlug(idOrSlug);
    return ResponseUtil.success(res, car, 'Car detail fetched successfully');
  });

  public getUpcomingCars = catchAsync(async (req: Request, res: Response) => {
    const { page, limit } = req.query;
    const data = await carsService.getUpcomingCars({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined
    });
    return ResponseUtil.success(res, data, 'Upcoming cars fetched successfully');
  });

  public searchCars = catchAsync(async (req: Request, res: Response) => {
    const q = (req.query.q as string) || '';
    const results = await carsService.searchCars(q);
    return ResponseUtil.success(res, results, 'Search results fetched successfully');
  });

  public getBrands = catchAsync(async (req: Request, res: Response) => {
    const brands = await webBrandsService.getAllBrands();
    return ResponseUtil.success(res, brands, 'Brands fetched successfully');
  });

  public getBrandDetail = catchAsync(async (req: Request, res: Response) => {
    const slug = (req.params.slug as string) || '';
    const brand = await webBrandsService.getBrandBySlug(slug);
    return ResponseUtil.success(res, brand, 'Brand detail fetched successfully');
  });

  public compareCars = catchAsync(async (req: Request, res: Response) => {
    const ids = req.query.ids as string;
    const carList = ids ? ids.split(',').map((id) => id.trim()) : [];
    const comparison = await webComparisonService.compareCars(carList);
    return ResponseUtil.success(res, comparison, 'Car comparison fetched successfully');
  });

  public getBlogs = catchAsync(async (req: Request, res: Response) => {
    const { page, limit, category, search } = req.query;
    const data = await webBlogsService.getBlogs({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      category: category as string,
      search: search as string
    });
    return ResponseUtil.success(res, data, 'Blogs fetched successfully');
  });

  public getBlogDetail = catchAsync(async (req: Request, res: Response) => {
    const idOrSlug = (req.params.idOrSlug as string) || '';
    const blog = await webBlogsService.getBlogBySlugOrId(idOrSlug);
    return ResponseUtil.success(res, blog, 'Blog detail fetched successfully');
  });
}

export const webCarsController = new WebCarsController();
