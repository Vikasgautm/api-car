# Import Normalization Engine — Integration Guide

## Quick Start (Using the Normalizer)

### 1. Basic Normalization
```typescript
import { ImportNormalizerService } from './services/import-normalizer.service';

const rawSpecs = {
  'Wireless Charger': 'Yes',
  'Engine Displacement': '1998 cc',
  'Max Power': '190 bhp @ 6000 rpm',
  'Airbags': 6
};

const report = ImportNormalizerService.normalize(rawSpecs);

console.log(report.specs_normalized);
// {
//   comfort_convenience: { wireless_charger: true },
//   engine_performance: { displacement: '1998', max_power: '190 bhp @ 6000 rpm' }
// }

console.log(report.normalization_stats);
// { 
//   total_fields_processed: 4,
//   mapped_fields: 3,
//   unmapped_fields: 1,
//   overall_confidence: 0.75
// }
```

### 2. Detect Powertrain Capabilities
```typescript
import { PowertrainDetectorService } from '@/modules/variants/services/powertrain-detector.service';

const flags = PowertrainDetectorService.detect(
  report.specs_normalized,
  'electric' // fuel_type_slug
);

console.log(flags);
// {
//   has_engine: false,
//   has_battery: true,
//   has_motor: true,
//   has_external_charging: true,
//   confidence: 0.95,
//   detected_type: 'ev'
// }
```

### 3. Save to Variant
```typescript
// After normalization, save both the normalized specs and powertrain flags

const variant = await CarVariant.create({
  variant_id: uuid(),
  car_id: 'car-123',
  variant_name: 'Model S',
  specs_raw: rawSpecs,        // Original messy data
  specs_normalized: report.specs_normalized,  // Cleaned data
  has_engine: flags.has_engine,
  has_battery: flags.has_battery,
  has_motor: flags.has_motor,
  has_external_charging: flags.has_external_charging,
  powertrain_detection_confidence: flags.confidence,
  // ... other fields
});
```

## Integration Points (In Order of Priority)

### Phase 1: Core Import Flow (Next Step)
Update `MultiSourceVariantService` to normalize on import:

```typescript
// In multi-source-variant.service.ts
import { ImportNormalizerService } from '../import-normalizer.service';
import { PowertrainDetectorService } from '../../variants/services/powertrain-detector.service';

async importVariant(rawData, source) {
  // ... existing logic ...
  
  // NEW: Normalize specs
  const normalizationReport = ImportNormalizerService.normalize(rawData.specs_raw);
  
  // NEW: Detect powertrain
  const powertrainFlags = PowertrainDetectorService.detect(
    normalizationReport.specs_normalized,
    fuelTypeSlug
  );
  
  const variant = {
    ...existingVariantData,
    specs_normalized: normalizationReport.specs_normalized,
    has_engine: powertrainFlags.has_engine,
    has_battery: powertrainFlags.has_battery,
    has_motor: powertrainFlags.has_motor,
    has_external_charging: powertrainFlags.has_external_charging,
    powertrain_detection_confidence: powertrainFlags.confidence,
  };
  
  return variant;
}
```

### Phase 2: Variant Creation/Update
Update variant service to auto-normalize:

```typescript
// In car-variant.service.ts
async createVariant(data) {
  // If specs_raw provided but specs_normalized missing, auto-normalize
  if (data.specs_raw && !data.specs_normalized) {
    const report = ImportNormalizerService.normalize(data.specs_raw);
    data.specs_normalized = report.specs_normalized;
  }
  
  // If specs_normalized present, auto-detect powertrain
  if (data.specs_normalized) {
    const flags = PowertrainDetectorService.detect(
      data.specs_normalized,
      fuelTypeSlug
    );
    data.has_engine = flags.has_engine;
    data.has_battery = flags.has_battery;
    data.has_motor = flags.has_motor;
    data.has_external_charging = flags.has_external_charging;
    data.powertrain_detection_confidence = flags.confidence;
  }
  
  return CarVariant.create(data);
}
```

### Phase 3: Dynamic Category Visibility
Update `variantSpecConfig.ts` to use powertrain flags:

```typescript
// Current (fuel-type only):
const ICE_CNG_HYB: FuelVisibilityMap = { ice: 'keep', cng: 'keep', ev: 'hide', hybrid: 'keep' };

// New (powertrain-aware):
export function shouldShowField(
  field: SpecFieldConfig,
  variant: ICarVariant // Now has has_engine, has_battery, etc.
): boolean {
  const engine = variant.has_engine;
  const battery = variant.has_battery;
  const motor = variant.has_motor;
  const charging = variant.has_external_charging;
  
  // Example: Show Engine & Performance only if has_engine
  if (field.group === 'Engine & Performance' && !engine) {
    return false;
  }
  
  // Show Battery & Charging only if has_battery or has_motor
  if (field.group === 'Battery & Charging' && !battery && !motor) {
    return false;
  }
  
  // Show charging fields only if has_external_charging
  if (field.key === 'charging_port_type' && !charging) {
    return false;
  }
  
  return true;
}
```

### Phase 4: Frontend Dynamic Visibility
Update `VariantEditorPage` to use powertrain flags:

```typescript
// In VariantEditorPage.tsx
const variant = await fetchVariantById(id);

// Instead of fuel_type_id alone:
const visibleFields = VARIANT_SPEC_CONFIG.filter(field => {
  // Dynamic visibility based on powertrain
  if (field.group === 'Engine & Performance' && !variant.has_engine) {
    return false;
  }
  
  if (field.group === 'Battery & Charging' && !variant.has_battery) {
    return false;
  }
  
  // ... more rules based on powertrain flags
  
  return true;
});
```

### Phase 5: SEO Auto-Wiring
When variant has a mapped feature, auto-create SEO connection:

```typescript
// In variant create/update:
if (normalizationReport.mapping_details) {
  for (const [rawKey, detail] of Object.entries(normalizationReport.mapping_details)) {
    if (detail.canonical_key && detail.normalized === true) {
      // Feature is enabled, auto-connect to SEO landing page
      // E.g., wireless_charger → cars-with-wireless-charger
      await createSeoConnection(variant.car_id, detail.canonical_key);
    }
  }
}
```

## Testing the Integration

### 1. Manual Test via API
```bash
# Test normalization endpoint
curl -X POST http://localhost:3000/admin/imports/normalize \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d @test-payload.json

# test-payload.json
{
  "specs_raw": {
    "Wireless Phone Charging": "Yes",
    "360 Camera": "Available",
    "Engine Displacement": "1998 cc"
  },
  "fuel_type_slug": "petrol"
}
```

### 2. Unit Test
```typescript
// tests/import-normalizer.test.ts
import { ImportNormalizerService } from '@/modules/imports/services/import-normalizer.service';

describe('ImportNormalizerService', () => {
  it('should normalize feature names to canonical keys', () => {
    const result = ImportNormalizerService.normalize({
      'Wireless Charger': 'Yes',
      '360 Camera': 'Available'
    });
    
    expect(result.specs_normalized.comfort_convenience?.wireless_charger).toBe(true);
    expect(result.specs_normalized.safety?.camera_360).toBe(true);
  });
  
  it('should track unmapped fields', () => {
    const result = ImportNormalizerService.normalize({
      'Unknown Feature': 'Something'
    });
    
    expect(result.unmapped_keys.length).toBe(1);
    expect(result.normalization_stats.unmapped_fields).toBe(1);
  });
});
```

### 3. Integration Test
```typescript
// Test full flow: import → normalize → detect powertrain → save
describe('Variant Import Flow', () => {
  it('should import, normalize, detect powertrain', async () => {
    const rawData = { /* from external source */ };
    
    // Normalize
    const normalized = ImportNormalizerService.normalize(rawData.specs);
    
    // Detect powertrain
    const flags = PowertrainDetectorService.detect(
      normalized.specs_normalized,
      'electric'
    );
    
    // Save variant
    const variant = await CarVariant.create({
      ...rawData,
      specs_normalized: normalized.specs_normalized,
      has_engine: flags.has_engine,
      has_battery: flags.has_battery,
      has_motor: flags.has_motor,
      has_external_charging: flags.has_external_charging
    });
    
    // Verify
    expect(variant.specs_normalized).toBeDefined();
    expect(variant.has_engine).toBe(false);
    expect(variant.has_battery).toBe(true);
  });
});
```

## Monitoring & Analytics

### Track Normalization Success Rate
```typescript
// After each import batch
const report = ImportNormalizerService.normalize(specs);
await ImportLog.updateOne(
  { import_id },
  {
    normalization_stats: report.normalization_stats,
    unmapped_keys: report.unmapped_keys
  }
);
```

### Identify Missing Mappings
```typescript
// Query to find frequently unmapped fields
const unmappedFrequency = await ImportLog.aggregate([
  { $unwind: '$unmapped_keys' },
  { $group: { _id: '$unmapped_keys.key', count: { $sum: 1 } } },
  { $sort: { count: -1 } },
  { $limit: 20 }
]);

// Use this to prioritize new semantic mappings
```

## Next Steps

1. ✅ **Normalization engine built**
2. ⏳ **Integrate with MultiSourceVariantService** (1-2 hours)
3. ⏳ **Update variant creation/update flows** (1-2 hours)
4. ⏳ **Update VariantEditorPage for dynamic visibility** (2-3 hours)
5. ⏳ **Add SEO auto-wiring** (1-2 hours)
6. ⏳ **Testing & refinement** (2-3 hours)

## Support

- **Semantic Mappings:** See `constants/semantic-mappings.ts` for 100+ feature mappings
- **Normalizers:** Review `normalizers/*.ts` for field-specific logic
- **API Docs:** See `NORMALIZATION_ENGINE.md` for endpoint details
