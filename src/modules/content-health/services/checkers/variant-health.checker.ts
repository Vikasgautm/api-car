import { CheckerResult, HealthIssue, IssueCategory, IssueSeverity, IssuesQueryParams } from "../../dto/content-health.dto";
import { CarVariant } from '../../../../models/car-variant.model';

const CHECKER_NAME = 'variant_health';
const SCAN_LIMIT = 1000;

function issue(
  severity: IssueSeverity,
  category: IssueCategory,
  entityId: string,
  entityName: string,
  code: string,
  title: string,
  description: string,
  recommendation: string,
): HealthIssue {
  return {
    id: `${category}_${code}_${entityId}`,
    category,
    severity,
    entity_type: 'variant',
    entity_id: entityId,
    entity_name: entityName,
    issue_code: code,
    issue_title: title,
    issue_description: description,
    recommendation,
    edit_url: `/variants/${entityId}/edit`,
    detected_at: new Date().toISOString(),
  };
}

export async function runVariantHealthChecker(_params: IssuesQueryParams): Promise<CheckerResult> {
  try {
    const issues: HealthIssue[] = [];

    const variants = await CarVariant.find({ is_deleted: false, is_archived: false })
      .select('variant_id variant_name car_id fuel_type_id transmission_type ex_showroom_price seating_capacity is_upcoming specs_normalized')
      .lean()
      .limit(SCAN_LIMIT);

    for (const v of variants) {
      const name = v.variant_name;
      const id = v.variant_id;

      if (!v.ex_showroom_price && !v.is_upcoming) {
        issues.push(issue(
          'critical', 'variant_health', id, name,
          'VARIANT_NO_PRICE', 'Missing Ex-Showroom Price',
          `Variant "${name}" has no ex-showroom price. Buyers cannot compare or shop this variant.`,
          'Set the ex-showroom price. For upcoming variants, set an expected price.',
        ));
      }

      if (!v.fuel_type_id) {
        issues.push(issue(
          'high', 'variant_health', id, name,
          'VARIANT_NO_FUEL_TYPE', 'Missing Fuel Type',
          `Variant "${name}" has no fuel type assigned.`,
          'Assign the correct fuel type (Petrol, Diesel, Electric, CNG, etc.).',
        ));
      }

      if (!v.transmission_type) {
        issues.push(issue(
          'high', 'variant_health', id, name,
          'VARIANT_NO_TRANSMISSION', 'Missing Transmission Type',
          `Variant "${name}" has no transmission type assigned.`,
          'Set the transmission type (Manual, Automatic, AMT, CVT, etc.).',
        ));
      }

      if (!v.seating_capacity) {
        issues.push(issue(
          'medium', 'variant_health', id, name,
          'VARIANT_NO_SEATING', 'Missing Seating Capacity',
          `Variant "${name}" has no seating capacity set.`,
          'Set the seating capacity to enable buyer filtering by passenger count.',
        ));
      }

      const eng = v.specs_normalized?.engine_performance;
      if (!eng?.engine_type && !eng?.displacement && !eng?.max_power) {
        issues.push(issue(
          'medium', 'variant_health', id, name,
          'VARIANT_NO_ENGINE', 'Missing Engine Specifications',
          `Variant "${name}" has no engine specs (type, displacement, or power).`,
          'Add engine specifications from the manufacturer data sheet or an import source.',
        ));
      }

      const mil = v.specs_normalized?.mileage_range;
      if (!mil?.arai_mileage && !mil?.real_mileage) {
        issues.push(issue(
          'medium', 'variant_health', id, name,
          'VARIANT_NO_MILEAGE', 'Missing Mileage Data',
          `Variant "${name}" has no ARAI or real-world mileage data.`,
          'Add ARAI certified mileage or a real-world estimate for buyer decision-making.',
        ));
      }

      const dim = v.specs_normalized?.dimensions_practicality;
      if (!dim?.length && !dim?.width && !dim?.height) {
        issues.push(issue(
          'medium', 'variant_health', id, name,
          'VARIANT_NO_DIMENSIONS', 'Missing Dimensions',
          `Variant "${name}" has no dimension data (length, width, height).`,
          'Add physical dimensions from the official spec sheet.',
        ));
      }

      const safety = v.specs_normalized?.safety;
      if (!safety?.airbags && !safety?.abs) {
        issues.push(issue(
          'medium', 'variant_health', id, name,
          'VARIANT_NO_SAFETY', 'Missing Safety Specifications',
          `Variant "${name}" has no safety specs (airbags, ABS).`,
          'Add safety data — airbags count, ABS, ESC — critical for NCAP and buyer confidence.',
        ));
      }
    }

    return { checker: CHECKER_NAME, issues, total: issues.length };
  } catch (err: any) {
    return { checker: CHECKER_NAME, issues: [], total: 0, error: err?.message || 'Variant health checker failed' };
  }
}
