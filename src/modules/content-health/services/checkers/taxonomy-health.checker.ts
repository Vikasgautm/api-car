import { BodyType } from '../../../../models/body-type.model';
import { Car } from '../../../../models/car.model';
import { FuelType } from '../../../../models/fuel-type.model';
import { CheckerResult, HealthIssue, IssueCategory, IssueSeverity, IssuesQueryParams } from '../../dto/content-health.dto';

const CHECKER_NAME = 'taxonomy_health';
const SCAN_LIMIT = 500;

function issue(
  severity: IssueSeverity,
  category: IssueCategory,
  entityId: string,
  entityName: string,
  entityType: string,
  code: string,
  title: string,
  description: string,
  recommendation: string,
  editUrl: string,
): HealthIssue {
  return {
    id: `${category}_${code}_${entityId}`,
    category,
    severity,
    entity_type: entityType,
    entity_id: entityId,
    entity_name: entityName,
    issue_code: code,
    issue_title: title,
    issue_description: description,
    recommendation,
    edit_url: editUrl,
    detected_at: new Date().toISOString(),
  };
}

export async function runTaxonomyHealthChecker(_params: IssuesQueryParams): Promise<CheckerResult> {
  try {
    const issues: HealthIssue[] = [];

    // Load valid taxonomy IDs
    const [bodyTypes, fuelTypes] = await Promise.all([
      BodyType.find({ is_deleted: false }).select('body_type_id').lean(),
      FuelType.find({ is_deleted: false }).select('fuel_type_id').lean(),
    ]);

    const validBodyTypeIds = new Set(bodyTypes.map((b: any) => b.body_type_id));
    const validFuelTypeIds = new Set(fuelTypes.map((f: any) => f.fuel_type_id));

    const cars = await Car.find({ is_deleted: false })
      .select('car_id name slug body_type_id fuel_type_id')
      .lean()
      .limit(SCAN_LIMIT);

    for (const car of cars) {
      if (!car.body_type_id || car.body_type_id.trim() === '') {
        issues.push(issue(
          'high', 'taxonomy_health', car.car_id, car.name, 'car',
          'TAX_NO_BODY_TYPE', 'Missing Body Type',
          `Car "${car.name}" has no body type assigned.`,
          'Assign a body type (SUV, Sedan, Hatchback, etc.) to enable category filtering and SEO landing pages.',
          '/cars',
        ));
      } else if (!validBodyTypeIds.has(car.body_type_id)) {
        issues.push(issue(
          'high', 'taxonomy_health', car.car_id, car.name, 'car',
          'TAX_INVALID_BODY_TYPE', 'Invalid Body Type Reference',
          `Car "${car.name}" references body_type_id "${car.body_type_id}" which does not exist in the BodyType collection.`,
          'Reassign to a valid body type from the taxonomy or restore the missing body type.',
          '/cars',
        ));
      }

      if (!car.fuel_type_id || car.fuel_type_id.trim() === '') {
        issues.push(issue(
          'high', 'taxonomy_health', car.car_id, car.name, 'car',
          'TAX_NO_FUEL_TYPE', 'Missing Fuel Type',
          `Car "${car.name}" has no fuel type assigned at the car level.`,
          'Assign a primary fuel type. This drives SEO landing pages like "Best Petrol SUVs".',
          '/cars',
        ));
      } else if (!validFuelTypeIds.has(car.fuel_type_id)) {
        issues.push(issue(
          'high', 'taxonomy_health', car.car_id, car.name, 'car',
          'TAX_INVALID_FUEL_TYPE', 'Invalid Fuel Type Reference',
          `Car "${car.name}" references fuel_type_id "${car.fuel_type_id}" which does not exist in the FuelType collection.`,
          'Reassign to a valid fuel type or restore the missing fuel type entity.',
          '/cars',
        ));
      }
    }

    // Duplicate body type names
    const dupeBodyTypes = await BodyType.aggregate([
      { $match: { is_deleted: false } },
      { $group: { _id: { $toLower: '$name' }, count: { $sum: 1 }, ids: { $push: '$body_type_id' } } },
      { $match: { count: { $gt: 1 } } },
      { $limit: 20 },
    ]);

    for (const group of dupeBodyTypes) {
      for (const id of group.ids) {
        issues.push(issue(
          'medium', 'taxonomy_health', id, group._id, 'body_type',
          'TAX_DUPE_BODY_TYPE', 'Duplicate Body Type Name',
          `Body type "${group._id}" appears ${group.count} times. Duplicates create inconsistent taxonomy.`,
          'Merge duplicate body types and reassign any cars referencing the duplicate.',
          '/bodytypes',
        ));
      }
    }

    // Duplicate fuel type names
    const dupeFuelTypes = await FuelType.aggregate([
      { $match: { is_deleted: false } },
      { $group: { _id: { $toLower: '$name' }, count: { $sum: 1 }, ids: { $push: '$fuel_type_id' } } },
      { $match: { count: { $gt: 1 } } },
      { $limit: 20 },
    ]);

    for (const group of dupeFuelTypes) {
      for (const id of group.ids) {
        issues.push(issue(
          'medium', 'taxonomy_health', id, group._id, 'fuel_type',
          'TAX_DUPE_FUEL_TYPE', 'Duplicate Fuel Type Name',
          `Fuel type "${group._id}" appears ${group.count} times.`,
          'Merge duplicate fuel types and update all variant references.',
          '/fueltypes',
        ));
      }
    }

    return { checker: CHECKER_NAME, issues, total: issues.length };
  } catch (err: any) {
    return { checker: CHECKER_NAME, issues: [], total: 0, error: err?.message || 'Taxonomy health checker failed' };
  }
}
