import { ImportLog } from '../../../../models/import-log.model';
import { CheckerResult, HealthIssue, IssueCategory, IssueSeverity, IssuesQueryParams } from '../../dto/content-health.dto';

const CHECKER_NAME = 'import_health';
const SCAN_LIMIT = 300;
const VALID_FUEL_TYPES = ['petrol', 'diesel', 'electric', 'cng', 'hybrid', 'lpg', 'hydrogen', 'mild_hybrid', 'strong_hybrid', 'plug_in_hybrid'];
const VALID_BODY_TYPES = ['sedan', 'suv', 'hatchback', 'mpv', 'coupe', 'convertible', 'pickup', 'van', 'crossover', 'minivan'];

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
    entity_type: 'import',
    entity_id: entityId,
    entity_name: entityName,
    issue_code: code,
    issue_title: title,
    issue_description: description,
    recommendation,
    edit_url: '/import',
    detected_at: new Date().toISOString(),
  };
}

export async function runImportHealthChecker(_params: IssuesQueryParams): Promise<CheckerResult> {
  try {
    const issues: HealthIssue[] = [];

    const imports = await ImportLog.find({})
      .select('import_id source import_type status warnings error_messages car_id variant_id unmatched_data extracted_data')
      .lean()
      .sort({ createdAt: -1 })
      .limit(SCAN_LIMIT);

    for (const imp of imports) {
      const label = `${imp.source} ${imp.import_type} import (${imp.import_id.slice(0, 8)})`;
      const id = imp.import_id;

      // Failed imports
      if (imp.status === 'failed') {
        issues.push(issue(
          'high', 'import_health', id, label,
          'IMPORT_FAILED', 'Failed Import',
          `Import "${label}" failed with errors: ${(imp.error_messages || []).slice(0, 2).join('; ')}.`,
          'Review import logs, fix the source data or mapping, and re-run the import.',
        ));
      }

      // Imports with warnings
      if ((imp.warnings || []).length > 0) {
        issues.push(issue(
          'medium', 'import_health', id, label,
          'IMPORT_HAS_WARNINGS', 'Import Completed with Warnings',
          `Import "${label}" completed with ${imp.warnings.length} warning(s): ${imp.warnings.slice(0, 2).join('; ')}.`,
          'Review warnings and verify that the imported data is accurate. Warnings may indicate partial data loss.',
        ));
      }

      // Imports with significant unmatched data
      const unmatchedKeys = Object.keys(imp.unmatched_data || {});
      if (unmatchedKeys.length > 5) {
        issues.push(issue(
          'medium', 'import_health', id, label,
          'IMPORT_UNMATCHED_DATA', 'Import Has Unmatched Data Fields',
          `Import "${label}" has ${unmatchedKeys.length} unmatched fields that were not mapped to the schema.`,
          'Add missing field mappings to the normalisation config to capture all source data.',
        ));
      }

      // Check for invalid fuel type values in extracted data
      const rawFuelType = imp.extracted_data?.fuel_type;
      if (rawFuelType && typeof rawFuelType === 'string') {
        const normalised = rawFuelType.toLowerCase().replace(/\s+/g, '_');
        if (!VALID_FUEL_TYPES.some((ft) => normalised.includes(ft))) {
          issues.push(issue(
            'medium', 'import_health', id, label,
            'IMPORT_INVALID_FUEL_TYPE', 'Invalid Fuel Type in Import',
            `Import "${label}" contains unrecognised fuel type "${rawFuelType}".`,
            'Update the fuel type mapping in the normalisation config to handle this value.',
          ));
        }
      }

      // Check for invalid body type values
      const rawBodyType = imp.extracted_data?.body_type;
      if (rawBodyType && typeof rawBodyType === 'string') {
        const normalised = rawBodyType.toLowerCase().replace(/\s+/g, '_');
        if (!VALID_BODY_TYPES.some((bt) => normalised.includes(bt))) {
          issues.push(issue(
            'medium', 'import_health', id, label,
            'IMPORT_INVALID_BODY_TYPE', 'Invalid Body Type in Import',
            `Import "${label}" contains unrecognised body type "${rawBodyType}".`,
            'Update the body type mapping in the normalisation config to handle this value.',
          ));
        }
      }
    }

    // Duplicate imports (same source_url imported more than once as 'saved')
    const dupeSavedImports = await ImportLog.aggregate([
      { $match: { status: 'saved' } },
      { $group: { _id: '$source_url', count: { $sum: 1 }, ids: { $push: '$import_id' } } },
      { $match: { count: { $gt: 1 } } },
      { $limit: 30 },
    ]);

    for (const group of dupeSavedImports) {
      for (const importId of group.ids) {
        issues.push(issue(
          'medium', 'import_health', importId, group._id,
          'IMPORT_DUPLICATE', 'Duplicate Import from Same URL',
          `Source URL "${group._id}" has been saved ${group.count} times, risking data duplication.`,
          'Review duplicate imports and remove redundant records. Implement deduplication checks.',
        ));
      }
    }

    return { checker: CHECKER_NAME, issues, total: issues.length };
  } catch (err: any) {
    return { checker: CHECKER_NAME, issues: [], total: 0, error: err?.message || 'Import health checker failed' };
  }
}
