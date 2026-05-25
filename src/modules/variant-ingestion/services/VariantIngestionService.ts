import { Types } from 'mongoose';
import { VariantImportStaging, IVariantImportStaging, ImportStatus } from '../models/VariantImportStaging';
import { ImportSession } from '../models/ImportSession';
import { VariantImportValidator } from '../validators/VariantImportValidator';
import { SpecNormalizationService } from './SpecNormalizationService';
import { VariantCompletenessCalculator } from '../utils/VariantCompletenessCalculator';
import { VariantGroupingService } from './VariantGroupingService';
import { Car } from '../../../models/car.model';

interface StagingInput {
  source_car_name: string;
  variant_name: string;
  price?: string | number;
  fuel_type?: string;
  transmission?: string;
  raw_specs?: Record<string, any>;
}

interface CreateSessionInput {
  session_name: string;
  source_name?: string;
  imported_by?: string;
  variants: StagingInput[];
}

export class VariantIngestionService {
  static async createSession(input: CreateSessionInput) {
    const session = new ImportSession({
      session_name: input.session_name,
      source_name: input.source_name || 'manual',
      total_variants: input.variants.length,
      imported_by: input.imported_by || 'admin',
      session_status: 'active',
    });
    await session.save();

    const staged: IVariantImportStaging[] = [];

    for (const v of input.variants) {
      const normalizedSpecs = SpecNormalizationService.normalizeSpecs(v.raw_specs || {});
      const price = SpecNormalizationService.normalizePrice(v.price);
      const fuelType = SpecNormalizationService.normalizeFuelType(v.fuel_type);
      const transmission = SpecNormalizationService.normalizeTransmission(v.transmission);

      const validationResults = VariantImportValidator.validate({
        variant_name: v.variant_name,
        source_car_name: v.source_car_name,
        price,
        fuel_type: fuelType,
        transmission,
        raw_specs: v.raw_specs || {},
        normalized_specs: normalizedSpecs,
      });

      const completeness = VariantCompletenessCalculator.calculate({
        normalized_specs: normalizedSpecs,
        price,
        fuel_type: fuelType,
        transmission,
      });

      const hasErrors = VariantImportValidator.hasErrors(validationResults);

      const staging = new VariantImportStaging({
        source_car_name: v.source_car_name,
        normalized_car_name: VariantGroupingService.normalizeName(v.source_car_name),
        variant_name: v.variant_name,
        price,
        fuel_type: fuelType,
        transmission,
        raw_specs: v.raw_specs || {},
        normalized_specs: normalizedSpecs,
        validation_results: validationResults,
        completeness_score: completeness.score,
        confidence_score: hasErrors ? 0.3 : validationResults.length === 0 ? 0.9 : 0.6,
        import_status: hasErrors ? 'validation_failed' : 'imported',
        import_session_id: session._id,
        imported_by: input.imported_by || 'admin',
      });

      await staging.save();
      staged.push(staging);
    }

    // Auto-group after staging
    const groupResult = await VariantGroupingService.applyGrouping(String(session._id));

    return { session, staged_count: staged.length, groups: groupResult.groups };
  }

  static async previewStaging(variants: StagingInput[]) {
    return variants.map(v => {
      const normalizedSpecs = SpecNormalizationService.normalizeSpecs(v.raw_specs || {});
      const price = SpecNormalizationService.normalizePrice(v.price);
      const fuelType = SpecNormalizationService.normalizeFuelType(v.fuel_type);
      const transmission = SpecNormalizationService.normalizeTransmission(v.transmission);

      const validationResults = VariantImportValidator.validate({
        variant_name: v.variant_name,
        source_car_name: v.source_car_name,
        price,
        fuel_type: fuelType,
        transmission,
        raw_specs: v.raw_specs || {},
        normalized_specs: normalizedSpecs,
      });

      const completeness = VariantCompletenessCalculator.calculate({
        normalized_specs: normalizedSpecs,
        price,
        fuel_type: fuelType,
        transmission,
      });

      return {
        source_car_name: v.source_car_name,
        variant_name: v.variant_name,
        price,
        fuel_type: fuelType,
        transmission,
        normalized_specs: normalizedSpecs,
        validation_results: validationResults,
        completeness_score: completeness.score,
        has_errors: VariantImportValidator.hasErrors(validationResults),
      };
    });
  }

  static async getStagingList(filters: Record<string, any> = {}, page = 1, limit = 50) {
    const query: Record<string, any> = {};

    if (filters.session_id) query.import_session_id = new Types.ObjectId(filters.session_id);
    if (filters.import_status) query.import_status = filters.import_status;
    if (filters.linked_car_id) query.linked_car_id = filters.linked_car_id;
    if (filters.fuel_type) query.fuel_type = new RegExp(filters.fuel_type, 'i');
    if (filters.transmission) query.transmission = new RegExp(filters.transmission, 'i');
    if (filters.source_car_name) query.source_car_name = new RegExp(filters.source_car_name, 'i');
    if (filters.variant_name) query.variant_name = new RegExp(filters.variant_name, 'i');
    if (filters.date_from || filters.date_to) {
      query.created_at = {};
      if (filters.date_from) query.created_at.$gte = new Date(filters.date_from);
      if (filters.date_to) query.created_at.$lte = new Date(filters.date_to);
    }

    const skip = (page - 1) * limit;
    const [docs, total] = await Promise.all([
      VariantImportStaging.find(query).sort({ created_at: -1 }).skip(skip).limit(limit),
      VariantImportStaging.countDocuments(query),
    ]);

    return { docs, total, page, limit, pages: Math.ceil(total / limit) };
  }

  static async linkCar(stagingId: string, carId: string, linkedBy: string) {
    const car = await Car.findOne({ car_id: carId }).select('name car_id');
    if (!car) throw new Error(`Car ${carId} not found`);

    await VariantImportStaging.updateOne(
      { _id: new Types.ObjectId(stagingId) },
      {
        $set: {
          linked_car_id: carId,
          linked_car_name: (car as any).name,
          import_status: 'linked',
          linked_by: linkedBy,
        },
      }
    );

    const sessionUpdate = await VariantImportStaging.findById(stagingId);
    if (sessionUpdate?.import_session_id) {
      const linkedCount = await VariantImportStaging.countDocuments({
        import_session_id: sessionUpdate.import_session_id,
        linked_car_id: { $exists: true, $ne: null },
      });
      await ImportSession.updateOne({ _id: sessionUpdate.import_session_id }, { $set: { linked_variants: linkedCount } });
    }

    return { success: true };
  }

  static async bulkLinkCar(stagingIds: string[], carId: string, linkedBy: string) {
    const car = await Car.findOne({ car_id: carId }).select('name car_id');
    if (!car) throw new Error(`Car ${carId} not found`);

    await VariantImportStaging.updateMany(
      { _id: { $in: stagingIds.map(id => new Types.ObjectId(id)) } },
      {
        $set: {
          linked_car_id: carId,
          linked_car_name: (car as any).name,
          import_status: 'linked',
          linked_by: linkedBy,
        },
      }
    );
    return { updated: stagingIds.length };
  }

  static async bulkValidate(stagingIds: string[]) {
    const docs = await VariantImportStaging.find({ _id: { $in: stagingIds.map(id => new Types.ObjectId(id)) } });
    const results = [];

    for (const doc of docs) {
      const issues = VariantImportValidator.validate({
        variant_name: doc.variant_name,
        source_car_name: doc.source_car_name,
        price: doc.price,
        fuel_type: doc.fuel_type,
        transmission: doc.transmission,
        raw_specs: doc.raw_specs,
        normalized_specs: doc.normalized_specs,
      });
      const hasErrors = VariantImportValidator.hasErrors(issues);
      const completeness = VariantCompletenessCalculator.calculate({
        normalized_specs: doc.normalized_specs,
        price: doc.price,
        fuel_type: doc.fuel_type,
        transmission: doc.transmission,
      });

      const newStatus: ImportStatus = hasErrors ? 'validation_failed' : doc.linked_car_id ? 'linked' : 'grouped';

      await VariantImportStaging.updateOne(
        { _id: doc._id },
        {
          $set: {
            validation_results: issues,
            completeness_score: completeness.score,
            import_status: newStatus,
          },
        }
      );
      results.push({ id: String(doc._id), status: newStatus, issues: issues.length });
    }
    return results;
  }

  static async bulkUpdateStatus(stagingIds: string[], status: ImportStatus, userId: string) {
    const update: Record<string, any> = { import_status: status };
    if (status === 'reviewed') update.reviewed_by = userId;

    await VariantImportStaging.updateMany(
      { _id: { $in: stagingIds.map(id => new Types.ObjectId(id)) } },
      { $set: update }
    );
    return { updated: stagingIds.length };
  }

  static async rejectVariant(stagingId: string, reason: string, userId: string) {
    await VariantImportStaging.updateOne(
      { _id: new Types.ObjectId(stagingId) },
      {
        $set: {
          import_status: 'rejected',
          rejection_reason: reason,
          reviewed_by: userId,
        },
      }
    );
    return { success: true };
  }

  static async getSessions(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [docs, total] = await Promise.all([
      ImportSession.find().sort({ created_at: -1 }).skip(skip).limit(limit),
      ImportSession.countDocuments(),
    ]);
    return { docs, total, page, limit };
  }

  static async getSession(sessionId: string) {
    return ImportSession.findById(sessionId);
  }

  static async checkDuplicates(variants: StagingInput[]) {
    const results = [];
    for (const v of variants) {
      const existing = await VariantImportStaging.find({
        source_car_name: new RegExp(v.source_car_name.trim(), 'i'),
        variant_name: new RegExp(v.variant_name.trim(), 'i'),
      }).select('_id import_status import_session_id');

      results.push({
        source_car_name: v.source_car_name,
        variant_name: v.variant_name,
        is_duplicate: existing.length > 0,
        existing_count: existing.length,
        existing_statuses: existing.map(e => e.import_status),
      });
    }
    return results;
  }
}
