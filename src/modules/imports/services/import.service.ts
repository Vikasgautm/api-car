import { v4 as uuidv4 } from 'uuid';
import { BodyType } from '../../../models/body-type.model';
import { Brand } from '../../../models/brand.model';
import { CarVariant, TransmissionType } from '../../../models/car-variant.model';
import { Car } from '../../../models/car.model';
import { FuelType } from '../../../models/fuel-type.model';
import { ImportLog } from '../../../models/import-log.model';
import { AppError } from '../../../shared/utils/app-error.util';
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
      throw new AppError('Car not found', 404);
    }

    for (const url of urls) {
      try {
        const extracted = await CarDekhoExtractor.extractVariantData(url);
        
        // Log extracted data for debugging
        console.log('=== Extracted Variant Data ===');
        console.log('URL:', url);
        console.log('Full Name:', extracted.full_name);
        console.log('Variant Name:', extracted.variant_name);
        console.log('Price:', extracted.price);
        console.log('Price Text:', extracted.price_text);
        console.log('Fuel Type:', extracted.fuel_type);
        console.log('Transmission:', extracted.transmission);
        console.log('Specs Count:', extracted.specs.length);
        console.log('Specs:', JSON.stringify(extracted.specs, null, 2));
        console.log('============================');
        
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

        // Map matched specs to specs_normalized structure
        const specsNormalized = KeyMatcher.mapMatchedSpecsToSpecsNormalized(matched);
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
          specs_normalized: specsNormalized,
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
          matched_data: { matched, fuel_type: fuelTypeMatched, specs_normalized: specsNormalized },
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
      throw new AppError('Car not found', 404);
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

          variant = await CarVariant.create({
            variant_id: uuidv4(),
            car_id: car_id as any,
            ...cleanItemData,
            is_deleted: false,
          } as any);

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
            Object.assign(updateData, cleanItemData);
          } else {
            // Merge mode: only fill empty fields (excluding nulls)
            if (!existingVariant.variant_name && cleanItemData.name) updateData.variant_name = cleanItemData.name;
            if (!existingVariant.ex_showroom_price && cleanItemData.ex_showroom_price !== undefined) updateData.ex_showroom_price = cleanItemData.ex_showroom_price;
            if (!existingVariant.expected_price && cleanItemData.expected_price !== undefined) updateData.expected_price = cleanItemData.expected_price;
            if (cleanItemData.specs_normalized) {
              updateData.specs_normalized = {
                ...(existingVariant.specs_normalized || {}),
                ...(cleanItemData.specs_normalized as any),
              };
            }
          }

          variant = await CarVariant.findOneAndUpdate(
            { variant_id: item.variant_id, car_id, is_deleted: false },
            updateData,
            { returnDocument: 'after' }
          );

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
    
    // Fuzzy matches
    if (normalized.includes('manual')) return 'manual';
    if (normalized.includes('automatic') || normalized.includes('auto')) return 'automatic';
    if (normalized.includes('cvt') || normalized.includes('continuously variable')) return 'cvt';
    if (normalized.includes('dct') || normalized.includes('dual clutch') || normalized.includes('dual-clutch')) return 'dct';
    if (normalized.includes('amt') || normalized.includes('automated manual')) return 'amt';
    
    return null; // Return null if no match
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
