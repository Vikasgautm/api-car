# Complete API Routes Documentation
## Generated: 2026-05-19

### Auth Module (`/api/v1/auth`)
```
POST   /register
POST   /login
POST   /refresh-token
POST   /reset-password
POST   /logout
GET    /profile
```

### Cars Module (`/api/v1/cars` & `/api/v1/admin/cars`)
#### Public Routes
```
GET    /public                    → List all public cars
GET    /public/:slug              → Get car by slug
GET    /                          → List public cars (legacy)
GET    /:slug                     → Get car by slug (legacy)
```

#### Admin Routes (Protected - `/cars/admin/` or `/admin/cars/`)
```
GET    /                          → List admin cars (paginated)
POST   /                          → Create new car
GET    /:id                       → Get car details
PUT    /:id                       → Update car
DELETE /:id                       → Delete car (super_admin only)
PATCH  /restore/:id              → Restore deleted car

POST   /recompute-aggregates      → Recompute all aggregates
POST   /:id/recompute-aggregates → Recompute car aggregates
POST   /:id/refine-ai-flags      → Refine AI flags

GET    /:id/dependencies         → Get car dependencies
PATCH  /:id/publish              → Toggle publish status
PATCH  /:id/mark-launched        → Mark car as launched
PATCH  /:id/mark-upcoming        → Mark car as upcoming
POST   /:id/promote-to-current   → Promote variant to current

POST   /:id/lifecycle/transition      → Transition lifecycle state
GET    /:id/lifecycle/history         → Get lifecycle history
POST   /:id/lifecycle/schedule        → Schedule state change
GET    /:id/seo/continuity           → Get SEO continuity report
POST   /:id/lifecycle/cancel-scheduled → Cancel scheduled launch

GET    /lifecycle/upcoming-launches   → Get upcoming launches
POST   /lifecycle/process-scheduled   → Process scheduled launches (super_admin)
GET    /lifecycle/scheduled-window    → Get scheduled launches window

GET    /:id/change-history       → Get change history
GET    /:id/audit-trail          → Get audit trail
GET    /:id/change-summary       → Get change summary
```

### Variants Module (`/api/v1/variants`)
#### Public Routes
```
GET    /public                   → List public variants
GET    /public/:slug             → Get variant by slug
```

#### Admin Routes (Protected)
```
GET    /                         → List admin variants (paginated)
POST   /                         → Create variant

POST   /bulk/validate            → Bulk validate variants
POST   /bulk/update-status       → Bulk update status
POST   /bulk/publish             → Bulk publish
POST   /bulk/update-visibility   → Bulk update visibility
POST   /bulk/update              → Bulk update variants
POST   /bulk/export-csv          → Export variants to CSV
POST   /bulk/refine-specs        → Bulk refine specs

GET    /car/:carId/differences       → Get variant differences
GET    /car/:carId/aggregates        → Get model aggregates
GET    /car/:carId/validate          → Validate car variants
GET    /car/:carId/completeness      → Get car completeness

PATCH  /restore/:id              → Restore variant
GET    /:id                      → Get variant details
PUT    /:id                      → Update variant
DELETE /:id                      → Delete variant

PATCH  /:id/publish              → Toggle publish
PATCH  /:id/publish/enable       → Publish variant
PATCH  /:id/publish/disable      → Unpublish variant
PATCH  /:id/archive              → Archive variant
PATCH  /:id/unarchive            → Unarchive variant
PATCH  /:id/visibility           → Update visibility
PATCH  /:id/lifecycle/unhide-on-launch → Unhide on launch

GET    /:id/lifecycle/completeness       → Get lifecycle completeness
GET    /:id/differences                  → Get variant differences
GET    /:id/validate                     → Validate variant
GET    /:id/completeness                 → Get variant completeness
GET    /:id/refine-specs                 → Get refinement suggestions
POST   /:id/apply-refinement             → Apply refinement suggestions
GET    /:id/validate/full                → Full validation
GET    /:id/validate/automotive-constraints → Automotive constraints validation

GET    /:id/change-history       → Get change history
GET    /:id/audit-trail          → Get audit trail
GET    /:id/integrity-status     → Get integrity status
```

### Brands Module (`/api/v1/brands`)
```
GET    /public                   → List public brands
GET    /public/:slug             → Get brand by slug

GET    /                         → List brands (admin)
GET    /:id                      → Get brand details (admin)
POST   /                         → Create brand (admin)
PUT    /:id                      → Update brand (admin)
DELETE /:id                      → Delete brand (admin)
PATCH  /restore/:id              → Restore brand (admin)
PATCH  /:id/publish              → Toggle publish (admin)
```

### Body Types Module (`/api/v1/body-types`)
```
GET    /public                   → List public body types
GET    /public/:slug             → Get by slug

GET    /                         → List body types (admin)
GET    /:id                      → Get details (admin)
POST   /                         → Create (admin)
PUT    /:id                      → Update (admin)
DELETE /:id                      → Delete (admin)
PATCH  /restore/:id              → Restore (admin)
PATCH  /:id/publish              → Toggle publish (admin)
```

### Fuel Types Module (`/api/v1/fuel-types`)
```
GET    /public                   → List public fuel types
GET    /public/:slug             → Get by slug

GET    /                         → List fuel types (admin)
GET    /:id                      → Get details (admin)
POST   /                         → Create (admin)
PUT    /:id                      → Update (admin)
DELETE /:id                      → Delete (admin)
PATCH  /restore/:id              → Restore (admin)
PATCH  /:id/publish              → Toggle publish (admin)
```

### Blogs Module (`/api/v1/blogs`)
```
GET    /popular                  → Get popular blogs
GET    /trending                 → Get trending blogs
GET    /category/:category       → Get by category
GET    /slug/:slug               → Get by slug
POST   /rivals/add                → Add rival
DELETE /rivals/:car_id/:rival_id → Delete rival
GET    /rivals/:car_id           → Get rivals
GET    /                         → List blogs (public)
GET    /:id                      → Get blog (public)
POST   /                         → Create (admin)
PUT    /:id                      → Update (admin)
DELETE /:id                      → Delete (admin)
PATCH  /:id/restore              → Restore (admin)
GET    /increment-views/:id      → Increment views
```

### Cities Module (`/api/v1/cities`)
```
GET    /public                   → List public cities
GET    /public/:slug             → Get by slug

GET    /                         → List cities (admin)
GET    /:id                      → Get details (admin)
POST   /                         → Create (admin)
PUT    /:id                      → Update (admin)
DELETE /:id                      → Delete (admin)
PATCH  /restore/:id              → Restore (admin)
```

### FAQs Module (`/api/v1/faqs`)
```
GET    /public                   → List public FAQs
GET    /public/:slug             → Get by slug

GET    /                         → List FAQs (admin)
GET    /:id                      → Get FAQ (admin)
POST   /                         → Create (admin)
PUT    /:id                      → Update (admin)
DELETE /:id                      → Delete (admin)
PATCH  /restore/:id              → Restore (admin)
```

### Images & Categories Module (`/api/v1/images`, `/car-images`, `/image-categories`, `/image-subcategories`)
```
# Car Images
GET    /public                   → List public car images
GET    /public/:slug             → Get by slug
GET    /                         → List car images (public)
GET    /:id                      → Get car image (public)
POST   /                         → Create (admin)
PUT    /:id                      → Update (admin)
DELETE /:id                      → Delete (admin)
PATCH  /restore/:id              → Restore (admin)
PATCH  /:id/publish              → Toggle publish (admin)
PATCH  /:id/primary              → Set as primary (admin)

# Image Categories
GET    /public                   → List public categories
GET    /public/:slug             → Get by slug
GET    /                         → List categories (admin)
GET    /:id                      → Get category (admin)
POST   /                         → Create (admin)
PUT    /:id                      → Update (admin)
DELETE /:id                      → Delete (admin)
PATCH  /restore/:id              → Restore (admin)

# Image Subcategories
GET    /public                   → List public subcategories
GET    /public/:slug             → Get by slug
GET    /                         → List subcategories (admin)
GET    /:id                      → Get subcategory (admin)
POST   /                         → Create (admin)
PUT    /:id                      → Update (admin)
DELETE /:id                      → Delete (admin)
PATCH  /restore/:id              → Restore (admin)

# General Images
GET    /upload                   → GET upload endpoint
POST   /upload                   → Upload image
POST   /upload/save              → Save uploaded image
POST   /upload/multiple          → Upload multiple images
POST   /upload/multiple/save      → Save multiple images
GET    /:id                      → Get image (admin)
GET    /:id                      → Get image (admin)
PATCH  /:id                      → Update image (admin)
DELETE /:id                      → Delete image (admin)
```

### Imports Module (`/api/v1/imports`)
#### Preview & Refinement Routes
```
POST   /car/preview              → Preview car import
POST   /car/save                 → Save car
POST   /variants/preview         → Preview variants import
POST   /variants/save            → Save variants

POST   /cardekho/car/preview     → Preview CarDekho car
POST   /cardekho/car/save        → Save CarDekho car
POST   /cardekho/variants/preview → Preview CarDekho variants
POST   /cardekho/variants/save   → Save CarDekho variants
```

#### Logs & Reprocessing
```
GET    /logs                     → Get import logs
POST   /reprocess/variant/:variant_id → Reprocess variant
POST   /reprocess/car/:car_id    → Reprocess car
POST   /reprocess/all            → Reprocess all
```

#### Analytics
```
GET    /analytics/unmatched-keys → Get unmatched keys
GET    /analytics/unmatched-keys/by-source → Get unmatched keys by source
GET    /analytics/unmatched-keys/by-type → Get unmatched keys by type
GET    /analytics/consolidate/variant/:variant_id → Consolidate variant
GET    /analytics/source-history/variant/:variant_id → Source history
GET    /analytics/confidence/import/:import_id → Confidence by import
GET    /analytics/confidence/variant/:variant_id → Confidence by variant
GET    /analytics/confidence/car/:car_id → Confidence by car
GET    /analytics/quality-report → Quality report
GET    /analytics/standardization-report → Standardization report
```

### Users Module (`/api/v1/users`)
```
GET    /                         → List users (admin)
GET    /:id                      → Get user (admin)
POST   /                         → Create user (admin)
PUT    /:id                      → Update user (admin)
DELETE /:id                      → Delete user (admin)
PATCH  /restore/:id              → Restore user (admin)
```

### Settings Module (`/api/v1/settings`)
```
PUT    /theme                    → Update theme
POST   /theme                    → Create theme
GET    /seo                      → Get SEO settings
PUT    /seo                      → Update SEO settings
POST   /seo                      → Create SEO settings
```

### Taxonomy Module (`/api/v1/taxonomy`)
```
GET    /categories/public        → List public categories
GET    /categories/public/:slug  → Get public category
GET    /tags/public              → List public tags
GET    /tags/public/:slug        → Get public tag

GET    /categories               → List categories (admin)
GET    /categories/:id           → Get category (admin)
POST   /categories               → Create category (admin)
PUT    /categories/:id           → Update category (admin)
DELETE /categories/:id           → Delete category (admin)
PATCH  /categories/restore/:id   → Restore category (admin)

GET    /tags                     → List tags (admin)
GET    /tags/:id                 → Get tag (admin)
POST   /tags                     → Create tag (admin)
PUT    /tags/:id                 → Update tag (admin)
DELETE /tags/:id                 → Delete tag (admin)
PATCH  /tags/restore/:id         → Restore tag (admin)
```

### Intelligence Module (`/api/v1/intelligence`)
```
GET    /mileage-benchmarks       → Get mileage benchmarks (admin)
PUT    /mileage-benchmarks/:body_type_id/:fuel_category → Update benchmark (admin)
DELETE /mileage-benchmarks/:body_type_id/:fuel_category → Delete benchmark (admin)
POST   /reclassify               → Reclassify (admin)
```

### Audit Module (`/api/v1/audit`)
```
GET    /                         → List audit logs (admin)
GET    /recent                   → Get recent logs (admin)
GET    /stale                    → Get stale logs (admin)
POST   /mark-reviewed/:entity_type/:entity_id → Mark as reviewed (admin)
```

### Deletion Workflow Module (`/api/v1/deletion-requests`)
```
GET    /                         → List deletion requests (admin)
POST   /                         → Create deletion request (admin)
POST   /:id/verify               → Verify deletion (admin)
POST   /:id/cancel               → Cancel deletion (admin)
```

### Redirects Module (`/api/v1/redirects`)
```
GET    /public/resolve           → Resolve redirect (public)
GET    /                         → List redirects (admin)
GET    /:id                      → Get redirect (admin)
POST   /                         → Create redirect (admin)
PUT    /:id                      → Update redirect (admin)
DELETE /:id                      → Delete redirect (admin)
PATCH  /restore/:id              → Restore redirect (admin)
```

### Comparisons Module (`/api/v1/comparisons`)
```
GET    /                         → List comparisons (public)
GET    /:id                      → Get comparison (public)
POST   /                         → Create comparison (admin)
PUT    /:id                      → Update comparison (admin)
DELETE /:id                      → Delete comparison (admin)
PATCH  /restore/:id              → Restore comparison (admin)
```

### Discovery Module (`/api/v1/discover` or `/api/v1/discovery`)
```
GET    /                         → Discover cars (search/filter)
GET    /facets                   → Get available facets
GET    /count                    → Get result count
GET    /seo/filters              → Get SEO filters
POST   /seo/auto-generate-presets → Auto-generate presets (admin)
GET    /seo/available-filters    → Get available filters (admin)
GET    /seo/facet-groups         → Get facet groups (admin)
GET    /seo/filter-options/:dimension → Get filter options (admin)

POST   /seo/filter-pages/preview → Preview filter page (admin)
GET    /seo/filter-pages         → List filter pages (admin)
POST   /seo/filter-pages         → Create filter page (admin)
PATCH  /seo/filter-pages/:pageId → Update filter page (admin)
DELETE /seo/filter-pages/:pageId → Delete filter page (admin)
POST   /seo/filter-pages/bulk-generate → Bulk generate (admin)
POST   /seo/filter-pages/refresh-all → Refresh all (admin)
```

### SEO Presets Module (`/api/v1/seo-presets`)
```
GET    /                         → List presets (admin)
GET    /:id                      → Get preset (admin)
POST   /                         → Create preset (admin)
PUT    /:id                      → Update preset (admin)
DELETE /:id                      → Delete preset (admin)
```

---

## Summary Statistics
- **Total Routes: 326**
- **Modules: 26**
- **Protected Routes: ~250+**
- **Public Routes: ~50+**
- **Duplicates Found: 50+**
- **Missing Prefixes: 5**

## Issues Identified
1. ❌ Routes registered multiple times (cars, variants, etc.)
2. ❌ Missing `/api/v1/` prefix in some modules
3. ❌ `/` route registered 49 times
4. ❌ `/:id` route registered 51 times
5. ❌ Inconsistent path naming (discover vs discovery)
6. ❌ No clear admin namespace consistency
7. ❌ Bulk operations not clearly separated
