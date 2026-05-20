# Import Normalization Engine

The import normalization engine cleans messy automotive data from multiple sources, converting raw specs into a canonical, normalized format that powers dynamic variant visibility, SEO automation, and buyer-first filtering.

## Architecture

### 1. Semantic Mappings Registry
**File:** `constants/semantic-mappings.ts`

Maps 100+ feature name synonyms to canonical CarSalahakar keys:
- "Wireless Phone Charging" → `wireless_charger`
- "360 Camera" → `camera_360`
- "Auto Climate Control" → `automatic_climate_control`

Features:
- Fast lookup table (normalized synonym → canonical key)
- Organized by category (comfort, safety, adas, infotainment, etc.)
- Confidence boosting for mapped features

### 2. Normalizers (Pipeline Architecture)

#### Boolean Normalizer
**File:** `normalizers/boolean-normalizer.ts`

Converts messy yes/no/na/— values to clean `true`/`false`/`null`:
```
Input: "Yes", "N/A", "", 1, 0
Output: true, false, null, true, false
Confidence: 0-1
```

#### String Normalizer
**File:** `normalizers/string-normalizer.ts`

Cleans text:
- Trims whitespace
- Collapses multiple spaces
- Normalizes casing (lowercase)
- Removes leading/trailing punctuation
- Extracts numeric values ("60 kWh" → 60)

#### Semantic Normalizer
**File:** `normalizers/semantic-normalizer.ts`

Maps feature names to canonical keys:
- Exact matching (fast lookup)
- Fuzzy matching (substring, word overlap)
- Zero confidence if unmapped

### 3. Import Normalizer Service
**File:** `services/import-normalizer.service.ts`

Orchestrator that:
1. Takes `specs_raw` (messy imported data)
2. Routes each field through appropriate normalizers
3. Builds `specs_normalized` with clean values
4. Tracks confidence scores and unmapped keys
5. Returns detailed mapping report

**Input:**
```typescript
specs_raw: {
  "Wireless Phone Charging": "Yes",
  "360 Camera": "Available",
  "Engine Displacement": "1998 cc",
  "Max Power": "190 bhp @ 6000 rpm",
  "Airbags": 6,
  "Unknown Feature": "Something weird"
}
```

**Output:**
```typescript
NormalizationReport {
  specs_normalized: {
    comfort_convenience: {
      wireless_charger: true
    },
    safety: {
      camera_360: true
    },
    engine_performance: {
      displacement: "1998",
      max_power: "190 bhp @ 6000 rpm"
    },
    // ... more normalized fields
  },
  normalization_stats: {
    total_fields_processed: 6,
    mapped_fields: 5,
    unmapped_fields: 1,
    estimated_fields: 0,
    overall_confidence: 0.83
  },
  unmapped_keys: [
    { key: "Unknown Feature", raw_value: "Something weird" }
  ],
  mapping_details: {
    // Per-field normalization details
  }
}
```

### 4. Powertrain Detector Service
**File:** `services/powertrain-detector.service.ts`

Analyzes normalized specs to determine vehicle capabilities:

```typescript
PowertrainFlags {
  has_engine: true,           // ICE/Hybrid
  has_battery: true,          // EV/Hybrid
  has_motor: true,            // EV/Hybrid
  has_external_charging: true // EV/Plug-in Hybrid only
  confidence: 0.95,
  detected_type: 'plug_in_hybrid'
}
```

**Detection Logic:**
1. **Pure ICE** — Has engine, no battery/motor
2. **Pure EV** — Has battery, motor, charging port
3. **Strong Hybrid** — Has engine, battery, motor, NO charging port
4. **Plug-in Hybrid** — Has engine, battery, motor, charging port
5. **Fallback** — Uses fuel_type slug if specs unavailable

These flags enable dynamic, powertrain-aware visibility of categories and fields.

## API Endpoints

### Test Normalization
```
POST /admin/imports/normalize
Content-Type: application/json

{
  "specs_raw": {
    "Wireless Charger": "Yes",
    "Engine Displacement": "1998 cc"
  },
  "fuel_type_slug": "petrol"
}

Response:
{
  "specs_normalized": { ... },
  "powertrain_flags": { ... },
  "normalization_stats": { ... },
  "unmapped_keys": [ ... ]
}
```

### Detect Powertrain
```
POST /admin/imports/detect-powertrain

{
  "specs_normalized": { ... },
  "fuel_type_slug": "electric"
}

Response:
{
  "has_engine": false,
  "has_battery": true,
  "has_motor": true,
  "has_external_charging": true,
  "confidence": 0.95,
  "detected_type": "ev"
}
```

## Integration Points

### Current Status
✅ Normalization engine built and functional
⏳ Integration with variant import pipeline (next phase)

### Integration Plan
1. **Update MultiSourceVariantService** — Use normalizer on each import
2. **Add to VariantCreation** — Normalize specs_raw → specs_normalized on create
3. **Add to VariantUpdate** — Auto-update powertrain flags when specs change
4. **Update VariantEditorPage** — Show dynamic category visibility based on powertrain flags

## Field Mapping Reference

### Semantic Categories
- `comfort_convenience` — 15+ fields (wireless charger, climate control, seats, etc.)
- `safety` — 25+ fields (airbags, ABS, cameras, parking sensors, ADAS, etc.)
- `adas` — 10+ fields (collision warning, lane assist, etc.)
- `infotainment_connectivity` — 15+ fields (Apple CarPlay, Android Auto, Bluetooth, etc.)
- `exterior` — 10+ fields (LED lights, roof rails, wipers, etc.)
- `interior` — 8+ fields (sunroof, ambient lighting, materials, etc.)
- `battery_charging` — 15+ fields (capacity, motor, charging, V2L, V2V, etc.)
- `storage_cabin_practicality` — 10+ fields (cupholders, storage, etc.)
- `connected_car` — 10+ fields (tracking, geofencing, digital key, etc.)

### Direct Field Mappings
Raw names mapped directly (case/space-insensitive):
- `engine_displacement_cc` → `engine_performance.displacement`
- `max_power_bhp` → `engine_performance.max_power`
- `battery_capacity_kwh` → `battery_charging.battery_capacity_kwh`
- `length_mm` → `dimensions_practicality.length`
- etc.

## Extending the System

### Add a New Semantic Mapping
```typescript
// In constants/semantic-mappings.ts
{
  key: 'new_feature_key',
  category: 'comfort_convenience',
  label: 'User-Friendly Feature Name',
  synonyms: [
    'new feature',
    'similar name',
    'variant name'
  ]
}
```

### Add a New Direct Field Mapping
```typescript
// In ImportNormalizerService.mapRawKeyToNormalized()
const mappings = {
  new_raw_field: {
    category: 'category_name',
    key: 'normalized_field',
    type: 'boolean' | 'number' | 'string'
  }
}
```

## Performance Characteristics

- **Lookup table building:** O(1) amortized (built once, cached)
- **Normalizing a field:** O(n) for fuzzy matching, where n = # synonyms (~3-5 avg)
- **Normalizing a full variant:** ~50-100ms for 100+ raw fields
- **Memory:** ~50KB for semantic lookup table

## Future Enhancements

1. **ML-based similarity** — Levenshtein distance for better fuzzy matching
2. **Source-specific mappings** — Different rules for CardekHo vs CarWale vs others
3. **Incremental mapping** — Track unmapped fields over time, suggest additions
4. **Batch reporting** — Show normalization success rate per source/import
5. **User-contributed synonyms** — Admin UI to add missing synonyms

## Testing

```bash
# Test normalization on raw specs
curl -X POST http://localhost:3000/admin/imports/normalize \
  -H "Content-Type: application/json" \
  -d '{
    "specs_raw": {
      "Wireless Charger": "Yes",
      "Engine Type": "Turbocharged Petrol"
    },
    "fuel_type_slug": "petrol"
  }'

# Test powertrain detection
curl -X POST http://localhost:3000/admin/imports/detect-powertrain \
  -H "Content-Type: application/json" \
  -d '{
    "specs_normalized": {
      "engine_performance": { "displacement": "1998" },
      "battery_charging": {}
    },
    "fuel_type_slug": "petrol"
  }'
```
