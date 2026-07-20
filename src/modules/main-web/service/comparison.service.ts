import { executeQueryParams, mssql } from '../../../sql/utils/dbConnection';
import { AppError } from '../../../shared/utils/app-error.util';

export class WebComparisonService {
  /**
   * Compare multiple cars side by side using Raw SQL JOINs
   */
  public async compareCars(carIdentifiers: string[]) {
    if (!carIdentifiers || carIdentifiers.length === 0) {
      throw new AppError('No car identifiers provided for comparison', 400);
    }

    const queryParams: { name: string; type: any; value: any }[] = [];
    const paramNames: string[] = [];

    carIdentifiers.forEach((id, idx) => {
      const paramName = `carId_${idx}`;
      queryParams.push({ name: paramName, type: mssql.VarChar(), value: id });
      paramNames.push(`@${paramName}`);
    });

    const carsQuery = `
      SELECT 
        c.id, c.car_id, c.name, c.slug, c.short_description, c.body_type,
        c.fuel_types, c.price_range, c.key_specifications, c.expert_rating, c.user_rating,
        b.name as brand_name, b.slug as brand_slug, b.logo as brand_logo,
        img.url as image_url
      FROM Cars c
      LEFT JOIN Brands b ON c.brand_id = b.brand_id
      LEFT JOIN CarImages img ON c.car_id = img.car_id AND img.is_primary = 1 AND img.is_deleted = 0
      WHERE (c.car_id IN (${paramNames.join(',')}) OR c.slug IN (${paramNames.join(',')}) OR c.id IN (${paramNames.join(',')}))
        AND c.is_deleted = 0
        AND c.is_published = 1
    `;

    const carsRes = await executeQueryParams(carsQuery, queryParams);
    const cars = carsRes.recordset || carsRes || [];

    // For each car, fetch top variants
    for (const car of cars) {
      const varParams = [{ name: 'cId', type: mssql.VarChar(), value: car.car_id }];
      const varQuery = `
        SELECT variant_id, name, slug, price, transmission, fuel_type, mileage, engine_displacement, power, torque
        FROM CarVariants
        WHERE car_id = @cId AND is_deleted = 0 AND is_published = 1
        ORDER BY price ASC
      `;
      const varRes = await executeQueryParams(varQuery, varParams);
      car.variants = varRes.recordset || varRes || [];
    }

    return cars;
  }
}

export const webComparisonService = new WebComparisonService();
