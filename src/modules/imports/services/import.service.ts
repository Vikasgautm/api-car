import { v4 as uuidv4 } from 'uuid';
import { ERROR_CODES, USER_MESSAGES } from '../../../constants/errorMessages';
import { BodyType } from '../../../models/body-type.model';
import { Brand } from '../../../models/brand.model';
import { CarVariant, ICarVariant, SpecsNormalized, TransmissionType } from '../../../models/car-variant.model';
import { Car } from '../../../models/car.model';
import { FuelType } from '../../../models/fuel-type.model';
import { ImportLog } from '../../../models/import-log.model';
import { AppError } from '../../../shared/utils/app-error.util';
import { MileageRecomputeService } from '../../../shared/services/mileage-recompute.service';
import { CarDekhoExtractor } from '../extractors/cardekho.extractor';
import { KeyMatcher } from '../extractors/key-matcher';
import {
    CarPreviewResponse,
    ImportResult,
    MatchedField,
    MatchType,
    SaveCarImportRequest,
    SaveVariantImportRequest,
    VariantPreviewItem,
    VariantPreviewResponse
} from '../types/import.types';

export class ImportService {
  static async previewCarImport(url: string, userId: string): Promise<CarPreviewResponse> {
    // Extract data from URL
    const extracted = await CarDekhoExtractor.extractCarData(url);

    // Check for existing car with same slug
    const existingCar = await Car.findOne({ 
      slug: extracted.slug, 
      is_deleted: false 
    });

    // Match fields
    const matched: Record<string, MatchedField> = {};
    const unmatched: string[] = [];

    // Match brand
    const brandMatch = await this.matchBrand(extracted.brand);
    if (brandMatch) {
      matched['brand'] = {
        field: 'brand',
        value: brandMatch.brand_id,
        matchType: 'exact' as MatchType,
        confidence: 1,
        matched_key: brandMatch.name,
      };
    } else {
      unmatched.push('brand');
    }

    // Match body type
    const bodyTypeMatch = await this.matchBodyType(extracted.body_type || '');
    if (bodyTypeMatch) {
      matched['body_type'] = {
        field: 'body_type',
        value: bodyTypeMatch.body_type_id,
        matchType: 'exact' as MatchType,
        confidence: 1,
        matched_key: bodyTypeMatch.name,
      };
    } else {
      unmatched.push('body_type');
    }

    // Match fuel type
    const fuelTypeMatch = await this.matchFuelType(extracted.fuel_type || '');
    if (fuelTypeMatch) {
      matched['fuel_type'] = {
        field: 'fuel_type',
        value: fuelTypeMatch.fuel_type_id,
        matchType: 'exact' as MatchType,
        confidence: 1,
        matched_key: fuelTypeMatch.name,
      };
    } else {
      unmatched.push('fuel_type');
    }

    // Check if electric
    const isElectric = extracted.fuel_type?.toLowerCase().includes('electric') || false;
    matched['is_electric'] = {
      field: 'is_electric',
      value: isElectric,
      matchType: 'exact' as MatchType,
      confidence: 1,
    };

    const warnings: string[] = [];
    if (unmatched.length > 0) {
      warnings.push(`Some fields could not be automatically matched: ${unmatched.join(', ')}`);
    }

    if (existingCar) {
      warnings.push(`A car with similar name already exists: ${existingCar.name}`);
    }

    // Create import log
    const import_id = uuidv4();
    await ImportLog.create({
      import_id,
      source: 'cardekho',
      import_type: 'car',
      source_url: url,
      status: 'previewed',
      extracted_data: extracted,
      matched_data: matched,
      unmatched_data: { unmatched },
      warnings,
      created_by: userId,
    });

    return {
      success: true,
      source: 'cardekho',
      type: 'car',
      url,
      extracted,
      matched,
      unmatched,
      warnings,
      existing_car: existingCar ? {
        car_id: existingCar.car_id,
        name: existingCar.name,
        slug: existingCar.slug,
      } : undefined,
    };
  }

  static async saveCarImport(payload: SaveCarImportRequest, userId: string): Promise<ImportResult> {
    const { url, mode, car_id, data, unmatched_data } = payload;

    // Clean null values from data
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([_, value]) => value !== null)
    );

    let car;

    if (mode === 'create') {
      // Check for duplicate slug
      const existingSlug = await Car.findOne({
        slug: data.slug,
        is_deleted: false
      });

      if (existingSlug) {
        throw new AppError(`Car with slug '${data.slug}' already exists. Use update or merge mode instead.`, 409);
      }

      car = await Car.create({
        car_id: uuidv4(),
        ...cleanData,
        is_deleted: false,
      });

      // Update import log
      await ImportLog.findOneAndUpdate(
        { source_url: url, created_by: userId },
        {
          status: 'saved',
          car_id: car.car_id,
          matched_data: data,
        }
      );

    } else if (mode === 'update' || mode === 'merge') {
      if (!car_id) {
        throw new AppError('car_id is required for update/merge mode', 400);
      }

      const existingCar = await Car.findOne({
        car_id,
        is_deleted: false
      });

      if (!existingCar) {
        throw new AppError('Car not found', 404);
      }

      const updateData: any = {};

      if (mode === 'update') {
        // Update all provided fields (excluding nulls)
        Object.assign(updateData, cleanData);
      } else {
        // Merge mode: only fill empty fields (excluding nulls)
        if (!existingCar.name && cleanData.name) updateData.name = cleanData.name;
        if (!existingCar.description && cleanData.description) updateData.description = cleanData.description;
        if (!existingCar.exshowroom_price && cleanData.exshowroom_price !== undefined) updateData.exshowroom_price = cleanData.exshowroom_price;
        if (!existingCar.expected_exshowroom_price && cleanData.expected_exshowroom_price !== undefined) updateData.expected_exshowroom_price = cleanData.expected_exshowroom_price;
      }

      car = await Car.findOneAndUpdate(
        { car_id, is_deleted: false },
        updateData,
        { returnDocument: 'after' }
      );

      // Update import log
      await ImportLog.findOneAndUpdate(
        { source_url: url, created_by: userId },
        {
          status: 'saved',
          car_id: car?.car_id,
          matched_data: updateData,
        }
      );
    }

    return {
      success: true,
      car_id: car?.car_id || '',
      warnings: [],
      errors: [],
    };
  }

  static async previewVariantImport(carId: string, urls: string[], userId: string): Promise<VariantPreviewResponse> {
    const items: VariantPreviewItem[] = [];
    const warnings: string[] = [];

    // Verify car exists
    const car = await Car.findOne({ car_id: carId, is_deleted: false });
    if (!car) {
      throw new AppError(
        'Car not found',
        404,
        {
          userMessage: USER_MESSAGES.CAR_NOT_FOUND,
          errorCode: ERROR_CODES.CAR_NOT_FOUND,
          details: {
            field: 'car_id',
            reason: 'The car does not exist or has been deleted.',
          },
        }
      );
    }

    for (const url of urls) {
      try {
        const extracted = await CarDekhoExtractor.extractVariantData(url);

        // Check for existing variant
        const existingVariant = await CarVariant.findOne({
          car_id: carId,
          slug: extracted.variant_name.toLowerCase().replace(/\s+/g, '-'),
          is_deleted: false,
        });

        // Match specs
        const { matched, unmatched } = await KeyMatcher.matchSpecs(extracted.specs);

        const itemWarnings: string[] = [];

        // Resolve fuel type conflict: check if specs contain conflicting fuel type
        const specFuelType = matched.find(m => m.matched_key_name === 'fuel_type');
        let resolvedFuelType = extracted.fuel_type || '';
        
        if (specFuelType && resolvedFuelType) {
          const normalizedTopLevel = resolvedFuelType.toLowerCase().trim();
          const normalizedSpec = specFuelType.source_value.toLowerCase().trim();
          
          // If they conflict, prefer top-level (more reliable) and add warning
          if (normalizedTopLevel !== normalizedSpec && 
              !normalizedTopLevel.includes(normalizedSpec) && 
              !normalizedSpec.includes(normalizedTopLevel)) {
            itemWarnings.push(`Fuel type conflict: top-level is '${resolvedFuelType}' but specs show '${specFuelType.source_value}'. Using top-level value.`);
          }
        }

        // Match fuel type
        const fuelTypeMatch = await this.matchFuelType(resolvedFuelType);
        const fuelTypeMatched: MatchedField = {
          field: 'fuel_type',
          value: fuelTypeMatch?.fuel_type_id || '',
          matchType: (fuelTypeMatch ? 'exact' : 'unmatched') as MatchType,
          confidence: fuelTypeMatch ? 1 : 0,
          matched_key: fuelTypeMatch?.name,
        };

        // Normalize transmission
        const normalizedTransmission = this.normalizeTransmission(extracted.transmission || '');

        // Map matched specs to specs_normalized and specs_raw structures
        const { specs_normalized, specs_raw } = KeyMatcher.mapMatchedSpecsToSpecsNormalized(matched);

        // Log key matching results for debugging
        const keyMapping = matched.map(m => ({
          extracted: m.source_label,
          mapped_to: m.matched_key_name,
          path: m.suggested_path,
          match_type: m.matchType,
        }));

        const unmatchedKeys = unmatched.map(u => ({
          extracted: u.source_label,
          value: u.source_value,
          suggested_slug: u.suggested_slug,
        }));

        // Define expected model keys for variants
        const expectedVariantKeys = [
          'variant_name', 'slug', 'model_year', 'fuel_type_id', 'transmission_type',
          'drivetrain', 'seating_capacity', 'ex_showroom_price', 'expected_price',
          'is_upcoming', 'specs_normalized', 'specs_raw', 'is_published'
        ];

        // Extract keys from the extracted data
        const extractedTopLevelKeys = Object.keys(extracted);
        const missingRequiredKeys = expectedVariantKeys.filter(k =>
          !extractedTopLevelKeys.includes(k) &&
          !['variant_name', 'fuel_type', 'transmission', 'price'].includes(k)
        );

        if (unmatched.length > 0) {
          itemWarnings.push(`${unmatched.length} specs could not be matched`);
        }

        if (matched.some(m => m.matchType === 'fuzzy')) {
          itemWarnings.push('Some specs have fuzzy matches and need confirmation');
        }

        if (!fuelTypeMatch) {
          itemWarnings.push(`Fuel type '${extracted.fuel_type}' could not be matched`);
        }

        if (!normalizedTransmission) {
          itemWarnings.push(`Transmission '${extracted.transmission}' could not be normalized to valid type`);
        }

        if (existingVariant) {
          itemWarnings.push(`Variant with similar name already exists: ${existingVariant.variant_name}`);
        }

        items.push({
          url,
          extracted,
          matched_specs: matched,
          unmatched_specs: unmatched,
          warnings: itemWarnings,
          matched_fuel_type: fuelTypeMatched,
          normalized_transmission: normalizedTransmission,
          specs_normalized,
          specs_raw,
          existing_variant: existingVariant ? {
            variant_id: existingVariant.variant_id,
            variant_name: existingVariant.variant_name,
            slug: existingVariant.slug,
          } : undefined,
        });

        // Create import log for each variant
        await ImportLog.create({
          import_id: uuidv4(),
          source: 'cardekho',
          import_type: 'variant',
          source_url: url,
          car_id: carId,
          status: 'previewed',
          extracted_data: extracted,
          matched_data: { matched, fuel_type: fuelTypeMatched, specs_normalized, specs_raw },
          unmatched_data: { unmatched },
          warnings: itemWarnings,
          created_by: userId,
        });

      } catch (error: any) {
        warnings.push(`Failed to extract data from ${url}: ${error.message}`);
      }
    }

    return {
      success: true,
      source: 'cardekho',
      type: 'variants',
      car_id: carId,
      items,
      warnings,
    };
  }

  static async saveVariantImport(payload: SaveVariantImportRequest, userId: string): Promise<ImportResult> {
    const { car_id, mode, items } = payload;
    const variantIds: string[] = [];
    const warnings: string[] = [];
    const errors: string[] = [];

    // Verify car exists
    const car = await Car.findOne({ car_id, is_deleted: false });
    if (!car) {
      throw new AppError(
        `Car not found for car_id: ${car_id}`,
        404,
        {
          userMessage: USER_MESSAGES.CAR_NOT_FOUND,
          errorCode: ERROR_CODES.CAR_NOT_FOUND,
          details: {
            field: 'car_id',
            reason: 'The car does not exist or has been deleted.',
          },
        }
      );
    }

    for (const item of items) {
      try {
        // Clean null values from item data
        const cleanItemData = Object.fromEntries(
          Object.entries(item.data).filter(([_, value]) => value !== null)
        );

        let variant;

        if (mode === 'create') {
          // Check for duplicate slug
          const existingSlug = await CarVariant.findOne({
            car_id,
            slug: item.data.slug,
            is_deleted: false,
          });

          if (existingSlug) {
            warnings.push(`Variant with slug '${item.data.slug}' already exists. Skipping.`);
            continue;
          }

          // Build the correct save payload with proper field mapping
          // Explicitly cast values to satisfy TypeScript
          let variantPayload: Partial<ICarVariant> = {
            variant_id: uuidv4(),
            car_id: car_id,
            variant_name: String(cleanItemData.name || cleanItemData.variant_name || ''),
            slug: String(cleanItemData.slug || ''),
            model_year: Number(cleanItemData.model_year || new Date().getFullYear()),
            fuel_type_id: cleanItemData.fuel_type_id ? String(cleanItemData.fuel_type_id) : undefined,
            transmission_type: cleanItemData.transmission_type ? String(cleanItemData.transmission_type) as any : undefined,
            drivetrain: cleanItemData.drivetrain ? String(cleanItemData.drivetrain) : undefined,
            seating_capacity: cleanItemData.seating_capacity ? Number(cleanItemData.seating_capacity) : undefined,
            ex_showroom_price: cleanItemData.ex_showroom_price !== undefined ? Number(cleanItemData.ex_showroom_price) : undefined,
            expected_price: cleanItemData.expected_price !== undefined ? Number(cleanItemData.expected_price) : undefined,
            expected_launch_date: cleanItemData.expected_launch_date && (typeof cleanItemData.expected_launch_date === 'string' || typeof cleanItemData.expected_launch_date === 'number') ? new Date(cleanItemData.expected_launch_date) : undefined,
            is_upcoming: Boolean(cleanItemData.is_upcoming || false),
            specs_normalized: cleanItemData.specs_normalized && typeof cleanItemData.specs_normalized === 'object' && !Array.isArray(cleanItemData.specs_normalized) ? cleanItemData.specs_normalized as SpecsNormalized : undefined,
            specs_raw: cleanItemData.specs_raw && typeof cleanItemData.specs_raw === 'object' && !Array.isArray(cleanItemData.specs_raw) ? cleanItemData.specs_raw as Record<string, any> : undefined,
            hidden_spec_keys: Array.isArray(cleanItemData.hidden_spec_keys) ? cleanItemData.hidden_spec_keys : [],
            is_published: Boolean(cleanItemData.is_published || false),
            is_deleted: false,
          };

          console.log('\n═══════════════════════════════════════════════════════════════');
          console.log('🚀 [VARIANT IMPORT] SAVING TO DATABASE - CREATE MODE');
          console.log('═══════════════════════════════════════════════════════════════');
          console.log('[Variant Import] Raw extracted data:', item.data);
          console.log('[Variant Import] Cleaned item data:', cleanItemData);
          console.log('[Variant Import] Final save payload before type conversion:', variantPayload);
          console.log('═══════════════════════════════════════════════════════════════\n');

          // Auto-convert types to match CarVariant schema requirements
          variantPayload = this.convertSpecsTypes(variantPayload as any);
          
          console.log('[Variant Import] Final save payload after type conversion:', variantPayload);
          console.log('═══════════════════════════════════════════════════════════════\n');

          variant = await CarVariant.create(variantPayload);

          console.log('\n✅ [VARIANT IMPORT] SUCCESSFULLY SAVED TO CARVARIANTS COLLECTION');
          console.log('✅ Variant ID:', (variant as any).variant_id);
          console.log('✅ Variant Name:', (variant as any).variant_name);
          console.log('✅ Car ID:', (variant as any).car_id);
          console.log('═══════════════════════════════════════════════════════════════\n');

          // Update import log
          await ImportLog.findOneAndUpdate(
            { source_url: item.url, created_by: userId },
            {
              status: 'saved',
              variant_id: (variant as any).variant_id,
              matched_data: item.data,
              unmatched_data: { unmatched_specs: item.unmatched_specs },
            }
          );

        } else if (mode === 'update' || mode === 'merge') {
          if (!item.variant_id) {
            warnings.push(`variant_id is required for update/merge mode. Skipping ${item.url}`);
            continue;
          }

          const existingVariant = await CarVariant.findOne({
            variant_id: item.variant_id,
            car_id,
            is_deleted: false,
          });

          if (!existingVariant) {
            warnings.push(`Variant not found: ${item.variant_id}. Skipping ${item.url}`);
            continue;
          }

          const updateData: any = {};

          if (mode === 'update') {
            // Map fields correctly: 'name' from frontend -> 'variant_name' in model
            if (cleanItemData.name !== undefined) updateData.variant_name = cleanItemData.name;
            if (cleanItemData.slug !== undefined) updateData.slug = cleanItemData.slug;
            if (cleanItemData.model_year !== undefined) updateData.model_year = cleanItemData.model_year;
            if (cleanItemData.fuel_type_id !== undefined) updateData.fuel_type_id = cleanItemData.fuel_type_id;
            if (cleanItemData.transmission_type !== undefined) updateData.transmission_type = cleanItemData.transmission_type;
            if (cleanItemData.drivetrain !== undefined) updateData.drivetrain = cleanItemData.drivetrain;
            if (cleanItemData.seating_capacity !== undefined) updateData.seating_capacity = cleanItemData.seating_capacity;
            if (cleanItemData.ex_showroom_price !== undefined) updateData.ex_showroom_price = cleanItemData.ex_showroom_price;
            if (cleanItemData.expected_price !== undefined) updateData.expected_price = cleanItemData.expected_price;
            if (cleanItemData.expected_launch_date !== undefined) updateData.expected_launch_date = cleanItemData.expected_launch_date;
            if (cleanItemData.is_upcoming !== undefined) updateData.is_upcoming = cleanItemData.is_upcoming;
            if (cleanItemData.specs_normalized !== undefined) updateData.specs_normalized = cleanItemData.specs_normalized;
            if (cleanItemData.specs_raw !== undefined) updateData.specs_raw = cleanItemData.specs_raw;
            if (cleanItemData.hidden_spec_keys !== undefined) updateData.hidden_spec_keys = cleanItemData.hidden_spec_keys;
            if (cleanItemData.is_published !== undefined) updateData.is_published = cleanItemData.is_published;
          } else {
            // Merge mode: only fill empty fields (excluding nulls)
            if (!existingVariant.variant_name && cleanItemData.name) updateData.variant_name = cleanItemData.name;
            if (!existingVariant.ex_showroom_price && cleanItemData.ex_showroom_price !== undefined) updateData.ex_showroom_price = cleanItemData.ex_showroom_price;
            if (!existingVariant.expected_price && cleanItemData.expected_price !== undefined) updateData.expected_price = cleanItemData.expected_price;
            if (!existingVariant.fuel_type_id && cleanItemData.fuel_type_id) updateData.fuel_type_id = cleanItemData.fuel_type_id;
            if (!existingVariant.transmission_type && cleanItemData.transmission_type) updateData.transmission_type = cleanItemData.transmission_type;
            if (cleanItemData.specs_normalized) {
              updateData.specs_normalized = {
                ...(existingVariant.specs_normalized || {}),
                ...(cleanItemData.specs_normalized as any),
              };
            }
          }

          console.log('\n═══════════════════════════════════════════════════════════════');
          console.log(`🔄 [VARIANT IMPORT] UPDATING IN DATABASE - ${mode.toUpperCase()} MODE`);
          console.log('═══════════════════════════════════════════════════════════════');
          console.log('[Variant Import] Update/Merge - Raw data:', item.data);
          console.log('[Variant Import] Update/Merge - Clean data:', cleanItemData);
          console.log('[Variant Import] Update/Merge - Update payload before type conversion:', updateData);
          console.log('═══════════════════════════════════════════════════════════════\n');

          // Auto-convert types to match CarVariant schema requirements
          if (updateData.specs_normalized) {
            updateData.specs_normalized = this.convertObjectTypes(updateData.specs_normalized);
          }
          
          console.log('[Variant Import] Update/Merge - Update payload after type conversion:', updateData);
          console.log('═══════════════════════════════════════════════════════════════\n');

          variant = await CarVariant.findOneAndUpdate(
            { variant_id: item.variant_id, car_id, is_deleted: false },
            updateData,
            { returnDocument: 'after' }
          );

          console.log('\n✅ [VARIANT IMPORT] SUCCESSFULLY UPDATED IN CARVARIANTS COLLECTION');
          console.log('✅ Variant ID:', (variant as any).variant_id);
          console.log('✅ Variant Name:', (variant as any).variant_name);
          console.log('✅ Car ID:', (variant as any).car_id);
          console.log('═══════════════════════════════════════════════════════════════\n');

          // Update import log
          await ImportLog.findOneAndUpdate(
            { source_url: item.url, created_by: userId },
            {
              status: 'saved',
              variant_id: (variant as any).variant_id,
              matched_data: updateData,
              unmatched_data: { unmatched_specs: item.unmatched_specs },
            }
          );
        }

        if (variant) {
          variantIds.push((variant as any).variant_id);
        }

      } catch (error: any) {
        errors.push(`Failed to save variant from ${item.url}: ${error.message}`);
      }
    }

    // Bulk import skips the per-write recompute hooks the CRUD path uses, so the
    // parent car's denormalised aggregates (variant_count, min/max price,
    // aggregated_fuel_types, incomplete_variant_count) stay stale until the next
    // single-variant edit. Recompute once at the end — the import is scoped to a
    // single car_id, so this is one hop, not N.
    if (variantIds.length > 0) {
      try {
        await MileageRecomputeService.recomputeCarAggregatesOnly(car_id);
      } catch (err: any) {
        warnings.push(`Saved ${variantIds.length} variant(s) but failed to refresh car aggregates: ${err?.message ?? err}. Run /cars/admin/recompute-aggregates to fix.`);
      }
    }

    return {
      success: errors.length === 0,
      variant_ids: variantIds,
      warnings,
      errors,
    };
  }

  private static async matchBrand(brandName: string): Promise<any> {
    const normalized = brandName.toLowerCase().replace(/\s+/g, '');
    return await Brand.findOne({ 
      is_deleted: false,
      $or: [
        { name: { $regex: brandName, $options: 'i' } },
        { slug: normalized },
      ]
    });
  }

  private static async matchBodyType(bodyTypeName: string): Promise<any> {
    if (!bodyTypeName) return null;
    const normalized = bodyTypeName.toLowerCase().replace(/\s+/g, '');
    return await BodyType.findOne({ 
      is_deleted: false,
      $or: [
        { name: { $regex: bodyTypeName, $options: 'i' } },
        { slug: normalized },
      ]
    });
  }

  private static async matchFuelType(fuelTypeName: string): Promise<any> {
    if (!fuelTypeName) return null;
    const normalized = fuelTypeName.toLowerCase().replace(/\s+/g, '');
    return await FuelType.findOne({ 
      is_deleted: false,
      $or: [
        { name: { $regex: fuelTypeName, $options: 'i' } },
        { slug: normalized },
      ]
    });
  }

  private static normalizeTransmission(transmission: string): TransmissionType | null {
    if (!transmission) return null;

    const normalized = transmission.toLowerCase().trim();

    // Direct matches
    if (normalized === 'manual') return 'manual';
    if (normalized === 'automatic') return 'automatic';
    if (normalized === 'cvt') return 'cvt';
    if (normalized === 'dct') return 'dct';
    if (normalized === 'amt') return 'amt';
    if (normalized === 'dsg') return 'dsg';
    if (normalized === 'imt') return 'imt';
    if (normalized === 'e-cvt' || normalized === 'ecvt') return 'e_cvt';
    if (normalized === 'torque converter') return 'torque_converter';
    if (normalized === 'single speed' || normalized === 'single-speed' || normalized === 'single speed ev') return 'single_speed_ev';

    // Fuzzy matches — order matters: check specific (DSG/iMT/e-CVT/EV) before
    // generic (manual/automatic) so "DSG (auto)" doesn't degrade to 'automatic'.
    if (normalized.includes('dsg')) return 'dsg';
    if (normalized.includes('imt') || normalized.includes('intelligent manual')) return 'imt';
    if (normalized.includes('e-cvt') || normalized.includes('ecvt')) return 'e_cvt';
    if (normalized.includes('torque converter')) return 'torque_converter';
    if (normalized.includes('single speed') || normalized.includes('single-speed') || normalized.includes('reduction gear')) return 'single_speed_ev';
    if (normalized.includes('dct') || normalized.includes('dual clutch') || normalized.includes('dual-clutch')) return 'dct';
    if (normalized.includes('amt') || normalized.includes('automated manual')) return 'amt';
    if (normalized.includes('cvt') || normalized.includes('continuously variable')) return 'cvt';
    if (normalized.includes('manual')) return 'manual';
    if (normalized.includes('automatic') || normalized.includes('auto')) return 'automatic';

    return null;
  }

  private static convertSpecsTypes(payload: any): any {
    if (!payload.specs_normalized) {
      return payload;
    }

    const converted = { ...payload };
    converted.specs_normalized = this.convertObjectTypes(payload.specs_normalized);

    return converted;
  }

  private static convertObjectTypes(obj: any): any {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    const converted: any = {};

    // Known boolean fields in CarVariant schema
    const booleanFields = [
      'turbocharger',
      'led_headlights',
      'led_tail_lights',
      'drl',
      'alloy_wheels',
      'panoramic_sunroof',
      'moonroof',
      'rear_sunblind',
      'digital_driver_display',
      'ambient_lighting',
      'abs',
      'ebd',
      'brake_assist',
      'esp',
      'traction_control',
      'hill_hold',
      'hill_descent',
      'rear_camera',
      'camera_360',
      'isofix',
      'seat_belt_warning',
      'speed_alert',
      'crash_sensor',
      'engine_immobilizer',
      'central_locking',
      'child_safety_lock',
      'automatic_climate_control',
      'air_quality_control',
      'rear_ac_vents',
      'steering_mounted_controls',
      'cruise_control',
      'paddle_shifters',
      'remote_start',
      'keyless_entry',
      'push_button_start',
      'rear_window_defogger',
      'rear_wiper',
      'headlamp_washer',
      'cooled_glovebox',
      'android_auto',
      'apple_carplay',
      'bluetooth',
      'wireless_charging',
      'navigation',
      'voice_command',
      'wifi_hotspot',
      'internet_connectivity',
      'ota_updates',
      'app_connectivity',
      'vehicle_tracking',
      'geofencing',
      'remote_vehicle_control',
      'sos_emergency_assist',
      'adaptive_cruise_control',
      'lane_keep_assist',
      'lane_departure_warning',
      'blind_spot_monitoring',
      'forward_collision_warning',
      'automatic_emergency_braking',
      'traffic_sign_recognition',
      'autonomous_emergency_braking',
      'roof_rails',
      'spoiler',
      'skid_plate',
    ];

    // Known number fields in CarVariant schema
    const numberFields = [
      'cylinders',
      'valves_per_cylinder',
      'seating_capacity',
      'doors',
      'airbags',
      'usb_ports',
      'speakers',
      'basic_warranty_years',
      'basic_warranty_km',
      'battery_warranty_years',
      'battery_warranty_km',
    ];

    for (const key in obj) {
      const value = obj[key];

      // Handle nested objects recursively
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        converted[key] = this.convertObjectTypes(value);
      } else {
        // Convert boolean fields
        if (booleanFields.includes(key)) {
          converted[key] = this.convertToBoolean(value);
        }
        // Convert number fields
        else if (numberFields.includes(key)) {
          converted[key] = this.convertToNumber(value);
        }
        // Keep as-is for other fields
        else {
          converted[key] = value;
        }
      }
    }

    return converted;
  }

  private static convertToBoolean(value: any): boolean | null {
    if (value === null || value === undefined) return null;
    
    if (typeof value === 'boolean') return value;
    
    if (typeof value === 'string') {
      const lower = value.trim().toLowerCase();
      if (lower === 'yes' || lower === 'true' || lower === 'available' || lower === 'with' || lower === 'powered') {
        return true;
      }
      if (lower === 'no' || lower === 'false' || lower === 'not available' || lower === 'none' || lower === 'na') {
        return false;
      }
    }
    
    // Try to convert number to boolean
    if (typeof value === 'number') {
      return value !== 0;
    }
    
    return null;
  }

  private static convertToNumber(value: any): number | null {
    if (value === null || value === undefined) return null;
    
    if (typeof value === 'number') return value;
    
    if (typeof value === 'string') {
      const trimmed = value.trim();
      const numMatch = trimmed.match(/[\d.]+/);
      if (numMatch) {
        const num = parseFloat(numMatch[0]);
        return isNaN(num) ? null : num;
      }
    }
    
    return null;
  }

  static async getImportLogs(userId: string, filter?: any) {
    const query: any = { created_by: userId };
    
    if (filter?.status) {
      query.status = filter.status;
    }
    
    if (filter?.import_type) {
      query.import_type = filter.import_type;
    }

    return await ImportLog.find(query)
      .sort({ created_at: -1 })
      .limit(50);
  }
}
