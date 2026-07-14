const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, '../../../all_sql');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const tables = {
  '001_users': {
    name: 'Users',
    columns: [
      'id INT IDENTITY(1,1) PRIMARY KEY',
      'user_id NVARCHAR(100) NOT NULL UNIQUE',
      'user_name NVARCHAR(255) NOT NULL',
      'email NVARCHAR(255) NOT NULL UNIQUE',
      'password NVARCHAR(255) NULL',
      'phone NVARCHAR(50) NULL',
      'whatsapp_phone NVARCHAR(50) NULL',
      'whatsapp_opt_in BIT DEFAULT 0',
      'profile_pic NVARCHAR(1000) NULL',
      'role NVARCHAR(50) NOT NULL DEFAULT \'user\'',
      'governance_role NVARCHAR(50) NULL',
      'permissions NVARCHAR(MAX) NULL', // JSON
      'assigned_brands NVARCHAR(MAX) NULL', // JSON
      'assigned_domains NVARCHAR(MAX) NULL', // JSON
      'workflow_rights NVARCHAR(MAX) NULL', // JSON
      'security NVARCHAR(MAX) NULL', // JSON
      'is_email_verified BIT DEFAULT 0',
      'google_id NVARCHAR(100) NULL',
      'is_deleted BIT DEFAULT 0',
      'theme NVARCHAR(50) DEFAULT \'light\'',
      'is_active BIT DEFAULT 1',
      'last_login_at DATETIME NULL',
      'password_reset_token NVARCHAR(255) NULL',
      'password_reset_expires DATETIME NULL',
      'createdAt DATETIME DEFAULT GETDATE()',
      'updatedAt DATETIME DEFAULT GETDATE()'
    ],
    indexes: [
      'CREATE INDEX IX_Users_GoogleId ON Users(google_id) WHERE google_id IS NOT NULL',
      'CREATE INDEX IX_Users_IsDeleted ON Users(is_deleted)',
      'CREATE INDEX IX_Users_IsEmailVerified ON Users(is_email_verified)',
      'CREATE INDEX IX_Users_Role ON Users(role)'
    ]
  },
  '002_user_sessions': {
    name: 'UserSessions',
    columns: [
      'id INT IDENTITY(1,1) PRIMARY KEY',
      'session_id NVARCHAR(100) NOT NULL UNIQUE',
      'user_id NVARCHAR(100) NOT NULL',
      'refresh_token NVARCHAR(500) NOT NULL',
      'expires_at DATETIME NOT NULL',
      'is_revoked BIT DEFAULT 0',
      'device_info NVARCHAR(1000) NULL',
      'ip_address NVARCHAR(100) NULL',
      'revoked_at DATETIME NULL',
      'createdAt DATETIME DEFAULT GETDATE()',
      'updatedAt DATETIME DEFAULT GETDATE()'
    ],
    indexes: [
      'CREATE INDEX IX_UserSessions_UserId ON UserSessions(user_id)',
      'CREATE INDEX IX_UserSessions_RefreshToken ON UserSessions(refresh_token)',
      'CREATE INDEX IX_UserSessions_IsRevoked ON UserSessions(is_revoked)',
      'CREATE INDEX IX_UserSessions_ExpiresAt ON UserSessions(expires_at)'
    ]
  },
  '003_blogs': {
    name: 'Blogs',
    columns: [
      'id INT IDENTITY(1,1) PRIMARY KEY',
      'blog_id NVARCHAR(100) NOT NULL UNIQUE',
      'title NVARCHAR(255) NOT NULL',
      'slug NVARCHAR(255) NOT NULL UNIQUE',
      'excerpt NVARCHAR(500) NOT NULL',
      'content NVARCHAR(MAX) NOT NULL',
      'author_name NVARCHAR(255) NULL',
      'author_id NVARCHAR(100) NULL',
      'category NVARCHAR(255) NOT NULL',
      'tags NVARCHAR(MAX) NULL', // JSON
      'thumbnail NVARCHAR(MAX) NULL', // JSON
      'images NVARCHAR(MAX) NULL', // JSON
      'link NVARCHAR(1000) NULL',
      'is_published BIT DEFAULT 0',
      'is_deleted BIT DEFAULT 0',
      'is_featured BIT DEFAULT 0',
      'meta_title NVARCHAR(255) NULL',
      'meta_description NVARCHAR(500) NULL',
      'meta_keywords NVARCHAR(1000) NULL',
      'og_image NVARCHAR(1000) NULL',
      'canonical_url NVARCHAR(1000) NULL',
      'noindex BIT DEFAULT 0',
      'article_type NVARCHAR(50) NULL',
      'article_status NVARCHAR(50) DEFAULT \'draft\'',
      'article_intent NVARCHAR(50) NULL',
      'target_keyword NVARCHAR(255) NULL',
      'freshness_score INT DEFAULT 100',
      'seo_health_score INT NULL',
      'stale_flags NVARCHAR(MAX) NULL', // JSON
      'last_verified_at DATETIME NULL',
      'internal_link_count INT DEFAULT 0',
      'related_articles_count INT DEFAULT 0',
      'connected_cars NVARCHAR(MAX) NULL', // JSON
      'connected_variants NVARCHAR(MAX) NULL', // JSON
      'connected_brands NVARCHAR(MAX) NULL', // JSON
      'connected_body_types NVARCHAR(MAX) NULL', // JSON
      'connected_fuel_types NVARCHAR(MAX) NULL', // JSON
      'connected_comparisons NVARCHAR(MAX) NULL', // JSON
      'connected_collections NVARCHAR(MAX) NULL', // JSON
      'createdAt DATETIME DEFAULT GETDATE()',
      'updatedAt DATETIME DEFAULT GETDATE()'
    ],
    indexes: [
      'CREATE INDEX IX_Blogs_AuthorId ON Blogs(author_id)',
      'CREATE INDEX IX_Blogs_Category ON Blogs(category)',
      'CREATE INDEX IX_Blogs_IsPublished_IsDeleted ON Blogs(is_published, is_deleted)',
      'CREATE INDEX IX_Blogs_IsFeatured ON Blogs(is_featured)'
    ]
  },
  '004_body_types': {
    name: 'BodyTypes',
    columns: [
      'id INT IDENTITY(1,1) PRIMARY KEY',
      'type_id NVARCHAR(100) NOT NULL UNIQUE',
      'name NVARCHAR(255) NOT NULL',
      'slug NVARCHAR(255) NOT NULL UNIQUE',
      'description NVARCHAR(MAX) NULL',
      'is_deleted BIT DEFAULT 0',
      'createdAt DATETIME DEFAULT GETDATE()',
      'updatedAt DATETIME DEFAULT GETDATE()'
    ],
    indexes: [
      'CREATE INDEX IX_BodyTypes_IsDeleted ON BodyTypes(is_deleted)'
    ]
  },
  '005_brands': {
    name: 'Brands',
    columns: [
      'id INT IDENTITY(1,1) PRIMARY KEY',
      'brand_id NVARCHAR(100) NOT NULL UNIQUE',
      'name NVARCHAR(255) NOT NULL',
      'alias NVARCHAR(255) NULL',
      'slug NVARCHAR(255) NOT NULL UNIQUE',
      'slug_history NVARCHAR(MAX) NULL', // JSON
      'short_description NVARCHAR(500) NULL',
      'description NVARCHAR(MAX) NULL',
      'founded_year INT NULL',
      'country NVARCHAR(255) NULL',
      'parent_company NVARCHAR(255) NULL',
      'logo NVARCHAR(MAX) NULL', // JSON
      'brand_media NVARCHAR(MAX) NULL', // JSON
      'website NVARCHAR(1000) NULL',
      'is_published BIT DEFAULT 0',
      'is_deleted BIT DEFAULT 0',
      'is_featured BIT DEFAULT 0',
      'is_upcoming BIT DEFAULT 0',
      'is_discontinued BIT DEFAULT 0',
      'aggregates_cache NVARCHAR(MAX) NULL', // JSON
      'meta_title NVARCHAR(255) NULL',
      'meta_description NVARCHAR(500) NULL',
      'meta_keywords NVARCHAR(1000) NULL',
      'og_image NVARCHAR(1000) NULL',
      'canonical_url NVARCHAR(1000) NULL',
      'noindex BIT DEFAULT 0',
      'createdAt DATETIME DEFAULT GETDATE()',
      'updatedAt DATETIME DEFAULT GETDATE()'
    ],
    indexes: [
      'CREATE INDEX IX_Brands_IsDeleted ON Brands(is_deleted)',
      'CREATE INDEX IX_Brands_IsPublished_IsDeleted ON Brands(is_published, is_deleted)'
    ]
  },
  '006_cars': {
    name: 'Cars',
    columns: [
      'id INT IDENTITY(1,1) PRIMARY KEY',
      'car_id NVARCHAR(100) NOT NULL UNIQUE',
      'brand_id NVARCHAR(100) NOT NULL',
      'name NVARCHAR(255) NOT NULL',
      'slug NVARCHAR(255) NOT NULL UNIQUE',
      'slug_history NVARCHAR(MAX) NULL', // JSON
      'short_description NVARCHAR(500) NULL',
      'description NVARCHAR(MAX) NULL',
      'body_type NVARCHAR(100) NULL',
      'fuel_types NVARCHAR(MAX) NULL', // JSON
      'price_range NVARCHAR(MAX) NULL', // JSON
      'key_specifications NVARCHAR(MAX) NULL', // JSON
      'expert_rating DECIMAL(3,1) NULL',
      'user_rating DECIMAL(3,1) NULL',
      'is_published BIT DEFAULT 0',
      'is_deleted BIT DEFAULT 0',
      'is_featured BIT DEFAULT 0',
      'status NVARCHAR(50) DEFAULT \'upcoming\'',
      'launch_date DATETIME NULL',
      'discontinued_date DATETIME NULL',
      'meta_title NVARCHAR(255) NULL',
      'meta_description NVARCHAR(500) NULL',
      'meta_keywords NVARCHAR(1000) NULL',
      'og_image NVARCHAR(1000) NULL',
      'canonical_url NVARCHAR(1000) NULL',
      'noindex BIT DEFAULT 0',
      'aggregates_cache NVARCHAR(MAX) NULL', // JSON
      'spec_keys_cache NVARCHAR(MAX) NULL', // JSON
      'createdAt DATETIME DEFAULT GETDATE()',
      'updatedAt DATETIME DEFAULT GETDATE()'
    ],
    indexes: [
      'CREATE INDEX IX_Cars_BrandId ON Cars(brand_id)',
      'CREATE INDEX IX_Cars_IsDeleted ON Cars(is_deleted)',
      'CREATE INDEX IX_Cars_IsPublished_IsDeleted ON Cars(is_published, is_deleted)'
    ]
  },
  '007_car_variants': {
    name: 'CarVariants',
    columns: [
      'id INT IDENTITY(1,1) PRIMARY KEY',
      'variant_id NVARCHAR(100) NOT NULL UNIQUE',
      'car_id NVARCHAR(100) NOT NULL',
      'name NVARCHAR(255) NOT NULL',
      'slug NVARCHAR(255) NOT NULL UNIQUE',
      'price INT NOT NULL',
      'transmission NVARCHAR(100) NOT NULL',
      'fuel_type NVARCHAR(100) NOT NULL',
      'engine_displacement INT NULL',
      'power DECIMAL(6,2) NULL',
      'torque DECIMAL(6,2) NULL',
      'mileage DECIMAL(5,2) NULL',
      'seating_capacity INT NULL',
      'is_published BIT DEFAULT 0',
      'is_deleted BIT DEFAULT 0',
      'specifications NVARCHAR(MAX) NULL', // JSON
      'features NVARCHAR(MAX) NULL', // JSON
      'mileage_class NVARCHAR(100) NULL',
      'mileage_class_value DECIMAL(5,2) NULL',
      'mileage_class_source NVARCHAR(100) NULL',
      'range_class NVARCHAR(100) NULL',
      'range_class_value DECIMAL(5,2) NULL',
      'range_class_source NVARCHAR(100) NULL',
      'createdAt DATETIME DEFAULT GETDATE()',
      'updatedAt DATETIME DEFAULT GETDATE()'
    ],
    indexes: [
      'CREATE INDEX IX_CarVariants_CarId ON CarVariants(car_id)',
      'CREATE INDEX IX_CarVariants_IsDeleted ON CarVariants(is_deleted)'
    ]
  },
  '008_car_images': {
    name: 'CarImages',
    columns: [
      'id INT IDENTITY(1,1) PRIMARY KEY',
      'image_id NVARCHAR(100) NOT NULL UNIQUE',
      'car_id NVARCHAR(100) NOT NULL',
      'variant_id NVARCHAR(100) NULL',
      'url NVARCHAR(1000) NOT NULL',
      'caption NVARCHAR(255) NULL',
      'is_primary BIT DEFAULT 0',
      'category NVARCHAR(100) NULL',
      'is_deleted BIT DEFAULT 0',
      'createdAt DATETIME DEFAULT GETDATE()',
      'updatedAt DATETIME DEFAULT GETDATE()'
    ],
    indexes: [
      'CREATE INDEX IX_CarImages_CarId ON CarImages(car_id)',
      'CREATE INDEX IX_CarImages_IsDeleted ON CarImages(is_deleted)'
    ]
  },
  '009_cities': {
    name: 'Cities',
    columns: [
      'id INT IDENTITY(1,1) PRIMARY KEY',
      'city_id NVARCHAR(100) NOT NULL UNIQUE',
      'name NVARCHAR(255) NOT NULL',
      'state NVARCHAR(255) NOT NULL',
      'slug NVARCHAR(255) NOT NULL UNIQUE',
      'is_active BIT DEFAULT 1',
      'createdAt DATETIME DEFAULT GETDATE()',
      'updatedAt DATETIME DEFAULT GETDATE()'
    ],
    indexes: [
      'CREATE INDEX IX_Cities_IsActive ON Cities(is_active)'
    ]
  },
  '010_comparisons': {
    name: 'Comparisons',
    columns: [
      'id INT IDENTITY(1,1) PRIMARY KEY',
      'comparison_id NVARCHAR(100) NOT NULL UNIQUE',
      'car1_id NVARCHAR(100) NOT NULL',
      'car2_id NVARCHAR(100) NOT NULL',
      'variant1_id NVARCHAR(100) NULL',
      'variant2_id NVARCHAR(100) NULL',
      'slug NVARCHAR(255) NOT NULL UNIQUE',
      'title NVARCHAR(255) NOT NULL',
      'category NVARCHAR(255) NULL',
      'description NVARCHAR(MAX) NULL',
      'compareIntroContent NVARCHAR(MAX) NULL',
      'isPopular BIT DEFAULT 0',
      'isTrending BIT DEFAULT 0',
      'showOnHomepage BIT DEFAULT 0',
      'relatedComparisons NVARCHAR(MAX) NULL', // JSON
      'seoMetaTitle NVARCHAR(255) NULL',
      'seoMetaDescription NVARCHAR(500) NULL',
      'seoFAQSchema NVARCHAR(MAX) NULL', // JSON
      'status NVARCHAR(50) DEFAULT \'draft\'',
      'is_published BIT DEFAULT 0',
      'is_deleted BIT DEFAULT 0',
      'deleted_at DATETIME NULL',
      'created_by NVARCHAR(100) NULL',
      'updated_by NVARCHAR(100) NULL',
      'createdAt DATETIME DEFAULT GETDATE()',
      'updatedAt DATETIME DEFAULT GETDATE()'
    ],
    indexes: [
      'CREATE INDEX IX_Comparisons_Car1_Car2 ON Comparisons(car1_id, car2_id)',
      'CREATE INDEX IX_Comparisons_IsDeleted ON Comparisons(is_deleted)'
    ]
  },
  '011_comparison_rivals': {
    name: 'ComparisonRivals',
    columns: [
      'id INT IDENTITY(1,1) PRIMARY KEY',
      'primary_car_id NVARCHAR(100) NOT NULL',
      'rival_car_id NVARCHAR(100) NOT NULL',
      'relationship_strength INT DEFAULT 50',
      'manual_mapping BIT DEFAULT 0',
      'createdAt DATETIME DEFAULT GETDATE()',
      'updatedAt DATETIME DEFAULT GETDATE()'
    ],
    indexes: [
      'CREATE UNIQUE INDEX UIX_ComparisonRivals_Primary_Rival ON ComparisonRivals(primary_car_id, rival_car_id)'
    ]
  },
  '012_deletion_requests': {
    name: 'DeletionRequests',
    columns: [
      'id INT IDENTITY(1,1) PRIMARY KEY',
      'request_id NVARCHAR(100) NOT NULL UNIQUE',
      'entity_type NVARCHAR(50) NOT NULL',
      'entity_id NVARCHAR(100) NOT NULL',
      'action NVARCHAR(50) NOT NULL',
      'reason NVARCHAR(500) NULL',
      'redirect_to_slug NVARCHAR(255) NULL',
      'requested_by_user_id NVARCHAR(100) NOT NULL',
      'requested_by_email NVARCHAR(255) NULL',
      'requested_by_role NVARCHAR(50) NULL',
      'otp_hash NVARCHAR(255) NOT NULL',
      'otp_expires_at DATETIME NOT NULL',
      'otp_attempts INT DEFAULT 0',
      'otp_max_attempts INT DEFAULT 5',
      'otp_channel NVARCHAR(50) NOT NULL',
      'otp_sent_to NVARCHAR(255) NULL',
      'status NVARCHAR(50) NOT NULL DEFAULT \'pending\'',
      'approved_by_user_id NVARCHAR(100) NULL',
      'approved_at DATETIME NULL',
      'cancelled_at DATETIME NULL',
      'cancellation_reason NVARCHAR(500) NULL',
      'createdAt DATETIME DEFAULT GETDATE()',
      'updatedAt DATETIME DEFAULT GETDATE()'
    ],
    indexes: [
      'CREATE INDEX IX_DeletionRequests_Entity ON DeletionRequests(entity_type, entity_id)',
      'CREATE INDEX IX_DeletionRequests_Status ON DeletionRequests(status)'
    ]
  },
  '013_edit_locks': {
    name: 'EditLocks',
    columns: [
      'id INT IDENTITY(1,1) PRIMARY KEY',
      'lock_id NVARCHAR(100) NOT NULL UNIQUE',
      'entity_type NVARCHAR(50) NOT NULL',
      'entity_id NVARCHAR(100) NOT NULL',
      'user_id NVARCHAR(100) NOT NULL',
      'expires_at DATETIME NOT NULL',
      'createdAt DATETIME DEFAULT GETDATE()',
      'updatedAt DATETIME DEFAULT GETDATE()'
    ],
    indexes: [
      'CREATE UNIQUE INDEX UIX_EditLocks_Entity ON EditLocks(entity_type, entity_id)'
    ]
  },
  '014_faqs': {
    name: 'FAQs',
    columns: [
      'id INT IDENTITY(1,1) PRIMARY KEY',
      'faq_id NVARCHAR(100) NOT NULL UNIQUE',
      'question NVARCHAR(500) NOT NULL',
      'answer NVARCHAR(MAX) NOT NULL',
      'category NVARCHAR(100) NOT NULL',
      'is_published BIT DEFAULT 1',
      'is_deleted BIT DEFAULT 0',
      'entity_type NVARCHAR(50) NULL',
      'entity_id NVARCHAR(100) NULL',
      'createdAt DATETIME DEFAULT GETDATE()',
      'updatedAt DATETIME DEFAULT GETDATE()'
    ],
    indexes: [
      'CREATE INDEX IX_FAQs_Entity ON FAQs(entity_type, entity_id)',
      'CREATE INDEX IX_FAQs_IsDeleted ON FAQs(is_deleted)'
    ]
  },
  '015_fuel_types': {
    name: 'FuelTypes',
    columns: [
      'id INT IDENTITY(1,1) PRIMARY KEY',
      'fuel_id NVARCHAR(100) NOT NULL UNIQUE',
      'name NVARCHAR(255) NOT NULL',
      'slug NVARCHAR(255) NOT NULL UNIQUE',
      'description NVARCHAR(MAX) NULL',
      'is_deleted BIT DEFAULT 0',
      'createdAt DATETIME DEFAULT GETDATE()',
      'updatedAt DATETIME DEFAULT GETDATE()'
    ],
    indexes: [
      'CREATE INDEX IX_FuelTypes_IsDeleted ON FuelTypes(is_deleted)'
    ]
  },
  '016_images': {
    name: 'Images',
    columns: [
      'id INT IDENTITY(1,1) PRIMARY KEY',
      'image_id NVARCHAR(100) NOT NULL UNIQUE',
      'url NVARCHAR(1000) NOT NULL',
      'alt NVARCHAR(255) NULL',
      'category_id NVARCHAR(100) NULL',
      'subcategory_id NVARCHAR(100) NULL',
      'is_deleted BIT DEFAULT 0',
      'createdAt DATETIME DEFAULT GETDATE()',
      'updatedAt DATETIME DEFAULT GETDATE()'
    ],
    indexes: [
      'CREATE INDEX IX_Images_IsDeleted ON Images(is_deleted)'
    ]
  },
  '017_image_categories': {
    name: 'ImageCategories',
    columns: [
      'id INT IDENTITY(1,1) PRIMARY KEY',
      'category_id NVARCHAR(100) NOT NULL UNIQUE',
      'name NVARCHAR(255) NOT NULL',
      'slug NVARCHAR(255) NOT NULL UNIQUE',
      'is_deleted BIT DEFAULT 0',
      'createdAt DATETIME DEFAULT GETDATE()',
      'updatedAt DATETIME DEFAULT GETDATE()'
    ],
    indexes: [
      'CREATE INDEX IX_ImageCategories_IsDeleted ON ImageCategories(is_deleted)'
    ]
  },
  '018_image_subcategories': {
    name: 'ImageSubcategories',
    columns: [
      'id INT IDENTITY(1,1) PRIMARY KEY',
      'subcategory_id NVARCHAR(100) NOT NULL UNIQUE',
      'category_id NVARCHAR(100) NOT NULL',
      'name NVARCHAR(255) NOT NULL',
      'slug NVARCHAR(255) NOT NULL UNIQUE',
      'is_deleted BIT DEFAULT 0',
      'createdAt DATETIME DEFAULT GETDATE()',
      'updatedAt DATETIME DEFAULT GETDATE()'
    ],
    indexes: [
      'CREATE INDEX IX_ImageSubcategories_Category ON ImageSubcategories(category_id)',
      'CREATE INDEX IX_ImageSubcategories_IsDeleted ON ImageSubcategories(is_deleted)'
    ]
  },
  '019_import_key_mappings': {
    name: 'ImportKeyMappings',
    columns: [
      'id INT IDENTITY(1,1) PRIMARY KEY',
      'mapping_id NVARCHAR(100) NOT NULL UNIQUE',
      'source_key NVARCHAR(255) NOT NULL UNIQUE',
      'db_field NVARCHAR(255) NOT NULL',
      'transformation_rule NVARCHAR(MAX) NULL', // JSON
      'createdAt DATETIME DEFAULT GETDATE()',
      'updatedAt DATETIME DEFAULT GETDATE()'
    ],
    indexes: []
  },
  '020_lifecycle_requests': {
    name: 'LifecycleRequests',
    columns: [
      'id INT IDENTITY(1,1) PRIMARY KEY',
      'request_id NVARCHAR(100) NOT NULL UNIQUE',
      'entity_type NVARCHAR(50) NOT NULL',
      'entity_id NVARCHAR(100) NOT NULL',
      'transition NVARCHAR(50) NOT NULL',
      'reason NVARCHAR(500) NULL',
      'status NVARCHAR(50) NOT NULL DEFAULT \'pending\'',
      'otp_hash NVARCHAR(255) NOT NULL',
      'otp_expires_at DATETIME NOT NULL',
      'otp_attempts INT DEFAULT 0',
      'otp_max_attempts INT DEFAULT 5',
      'otp_channel NVARCHAR(50) NOT NULL',
      'otp_sent_to NVARCHAR(255) NULL',
      'requested_by_user_id NVARCHAR(100) NOT NULL',
      'requested_by_email NVARCHAR(255) NULL',
      'requested_by_role NVARCHAR(50) NULL',
      'approved_by_user_id NVARCHAR(100) NULL',
      'approved_at DATETIME NULL',
      'cancelled_at DATETIME NULL',
      'cancellation_reason NVARCHAR(500) NULL',
      'metadata NVARCHAR(MAX) NULL', // JSON
      'createdAt DATETIME DEFAULT GETDATE()',
      'updatedAt DATETIME DEFAULT GETDATE()'
    ],
    indexes: [
      'CREATE INDEX IX_LifecycleRequests_Status ON LifecycleRequests(status)'
    ]
  },
  '021_mileage_benchmark_overrides': {
    name: 'MileageBenchmarkOverrides',
    columns: [
      'id INT IDENTITY(1,1) PRIMARY KEY',
      'override_id NVARCHAR(100) NOT NULL UNIQUE',
      'fuel_type NVARCHAR(100) NOT NULL',
      'transmission NVARCHAR(100) NOT NULL',
      'benchmark_min DECIMAL(5,2) NOT NULL',
      'benchmark_max DECIMAL(5,2) NOT NULL',
      'notes NVARCHAR(500) NULL',
      'createdAt DATETIME DEFAULT GETDATE()',
      'updatedAt DATETIME DEFAULT GETDATE()'
    ],
    indexes: [
      'CREATE UNIQUE INDEX UIX_MileageBenchmarkOverrides_Fuel_Trans ON MileageBenchmarkOverrides(fuel_type, transmission)'
    ]
  },
  '022_platform_settings': {
    name: 'PlatformSettings',
    columns: [
      'id INT IDENTITY(1,1) PRIMARY KEY',
      'settings_id NVARCHAR(100) NOT NULL UNIQUE',
      'group_name NVARCHAR(100) NOT NULL',
      'settings_data NVARCHAR(MAX) NOT NULL', // JSON
      'createdAt DATETIME DEFAULT GETDATE()',
      'updatedAt DATETIME DEFAULT GETDATE()'
    ],
    indexes: [
      'CREATE UNIQUE INDEX UIX_PlatformSettings_Group ON PlatformSettings(group_name)'
    ]
  },
  '023_popular_collections': {
    name: 'PopularCollections',
    columns: [
      'id INT IDENTITY(1,1) PRIMARY KEY',
      'collection_id NVARCHAR(100) NOT NULL UNIQUE',
      'name NVARCHAR(255) NOT NULL',
      'slug NVARCHAR(255) NOT NULL UNIQUE',
      'title_h1 NVARCHAR(255) NULL',
      'description NVARCHAR(MAX) NULL',
      'preview_image NVARCHAR(1000) NULL',
      'is_published BIT DEFAULT 0',
      'is_deleted BIT DEFAULT 0',
      'filter_criteria NVARCHAR(MAX) NOT NULL', // JSON
      'custom_sorting NVARCHAR(MAX) NULL', // JSON
      'aggregates_cache NVARCHAR(MAX) NULL', // JSON
      'meta_title NVARCHAR(255) NULL',
      'meta_description NVARCHAR(500) NULL',
      'meta_keywords NVARCHAR(1000) NULL',
      'og_image NVARCHAR(1000) NULL',
      'canonical_url NVARCHAR(1000) NULL',
      'noindex BIT DEFAULT 0',
      'createdAt DATETIME DEFAULT GETDATE()',
      'updatedAt DATETIME DEFAULT GETDATE()'
    ],
    indexes: [
      'CREATE INDEX IX_PopularCollections_IsDeleted ON PopularCollections(is_deleted)',
      'CREATE INDEX IX_PopularCollections_IsPublished_IsDeleted ON PopularCollections(is_published, is_deleted)'
    ]
  },
  '024_ranking_collection_configs': {
    name: 'RankingCollectionConfigs',
    columns: [
      'id INT IDENTITY(1,1) PRIMARY KEY',
      'config_id NVARCHAR(100) NOT NULL UNIQUE',
      'collection_slug NVARCHAR(255) NOT NULL UNIQUE',
      'score_weights NVARCHAR(MAX) NOT NULL', // JSON
      'signal_parameters NVARCHAR(MAX) NOT NULL', // JSON
      'is_active BIT DEFAULT 1',
      'createdAt DATETIME DEFAULT GETDATE()',
      'updatedAt DATETIME DEFAULT GETDATE()'
    ],
    indexes: []
  },
  '025_ranking_scores': {
    name: 'RankingScores',
    columns: [
      'id INT IDENTITY(1,1) PRIMARY KEY',
      'score_id NVARCHAR(100) NOT NULL UNIQUE',
      'entity_type NVARCHAR(100) NOT NULL',
      'entity_id NVARCHAR(100) NOT NULL',
      'popularity_score DECIMAL(10,4) DEFAULT 0',
      'trending_score DECIMAL(10,4) DEFAULT 0',
      'engagement_score DECIMAL(10,4) DEFAULT 0',
      'buyer_intent_score DECIMAL(10,4) DEFAULT 0',
      'comparison_pressure_score DECIMAL(10,4) DEFAULT 0',
      'retention_score DECIMAL(10,4) DEFAULT 0',
      'raw_signals NVARCHAR(MAX) NULL', // JSON
      'computed_at DATETIME DEFAULT GETDATE()',
      'window_days INT DEFAULT 30',
      'session_count INT DEFAULT 0',
      'behavioral_confidence DECIMAL(5,4) DEFAULT 0',
      'trending_direction NVARCHAR(50) DEFAULT \'stable\'',
      'trending_velocity DECIMAL(10,4) DEFAULT 0',
      'rank_position INT NULL',
      'is_anomaly BIT DEFAULT 0',
      'prev_popularity_score DECIMAL(10,4) DEFAULT 0',
      'prev_trending_score DECIMAL(10,4) DEFAULT 0',
      'createdAt DATETIME DEFAULT GETDATE()',
      'updatedAt DATETIME DEFAULT GETDATE()'
    ],
    indexes: [
      'CREATE UNIQUE INDEX UIX_RankingScores_Entity ON RankingScores(entity_type, entity_id)'
    ]
  },
  '026_redirects': {
    name: 'Redirects',
    columns: [
      'id INT IDENTITY(1,1) PRIMARY KEY',
      'redirect_id NVARCHAR(100) NOT NULL UNIQUE',
      'source_url NVARCHAR(512) NOT NULL UNIQUE',
      'target_url NVARCHAR(512) NOT NULL',
      'status_code INT DEFAULT 301',
      'is_active BIT DEFAULT 1',
      'createdAt DATETIME DEFAULT GETDATE()',
      'updatedAt DATETIME DEFAULT GETDATE()'
    ],
    indexes: []
  },
  '027_seo_collections': {
    name: 'SeoCollections',
    columns: [
      'id INT IDENTITY(1,1) PRIMARY KEY',
      'collection_id NVARCHAR(100) NOT NULL UNIQUE',
      'name NVARCHAR(255) NOT NULL',
      'slug NVARCHAR(255) NOT NULL UNIQUE',
      'title_h1 NVARCHAR(255) NULL',
      'description NVARCHAR(MAX) NULL',
      'filter_criteria NVARCHAR(MAX) NOT NULL', // JSON
      'is_published BIT DEFAULT 0',
      'is_deleted BIT DEFAULT 0',
      'meta_title NVARCHAR(255) NULL',
      'meta_description NVARCHAR(500) NULL',
      'meta_keywords NVARCHAR(1000) NULL',
      'canonical_url NVARCHAR(1000) NULL',
      'noindex BIT DEFAULT 0',
      'createdAt DATETIME DEFAULT GETDATE()',
      'updatedAt DATETIME DEFAULT GETDATE()'
    ],
    indexes: [
      'CREATE INDEX IX_SeoCollections_IsDeleted ON SeoCollections(is_deleted)',
      'CREATE INDEX IX_SeoCollections_IsPublished_IsDeleted ON SeoCollections(is_published, is_deleted)'
    ]
  },
  '028_seo_presets': {
    name: 'SeoPresets',
    columns: [
      'id INT IDENTITY(1,1) PRIMARY KEY',
      'preset_id NVARCHAR(100) NOT NULL UNIQUE',
      'preset_type NVARCHAR(100) NOT NULL',
      'rule_pattern NVARCHAR(500) NOT NULL',
      'meta_title_template NVARCHAR(500) NOT NULL',
      'meta_description_template NVARCHAR(1000) NOT NULL',
      'h1_template NVARCHAR(500) NULL',
      'description_template NVARCHAR(MAX) NULL',
      'is_active BIT DEFAULT 1',
      'createdAt DATETIME DEFAULT GETDATE()',
      'updatedAt DATETIME DEFAULT GETDATE()'
    ],
    indexes: []
  },
  '029_seo_settings': {
    name: 'SeoSettings',
    columns: [
      'id INT IDENTITY(1,1) PRIMARY KEY',
      'settings_id NVARCHAR(100) NOT NULL UNIQUE',
      'page_type NVARCHAR(100) NOT NULL UNIQUE',
      'meta_title NVARCHAR(255) NOT NULL',
      'meta_description NVARCHAR(500) NOT NULL',
      'meta_keywords NVARCHAR(1000) NULL',
      'schema_templates NVARCHAR(MAX) NULL', // JSON
      'createdAt DATETIME DEFAULT GETDATE()',
      'updatedAt DATETIME DEFAULT GETDATE()'
    ],
    indexes: []
  },
  '030_tags': {
    name: 'Tags',
    columns: [
      'id INT IDENTITY(1,1) PRIMARY KEY',
      'tag_id NVARCHAR(100) NOT NULL UNIQUE',
      'name NVARCHAR(255) NOT NULL',
      'slug NVARCHAR(255) NOT NULL UNIQUE',
      'category_id NVARCHAR(100) NOT NULL',
      'description NVARCHAR(500) NULL',
      'is_deleted BIT DEFAULT 0',
      'createdAt DATETIME DEFAULT GETDATE()',
      'updatedAt DATETIME DEFAULT GETDATE()'
    ],
    indexes: [
      'CREATE INDEX IX_Tags_Category ON Tags(category_id)',
      'CREATE INDEX IX_Tags_IsDeleted ON Tags(is_deleted)'
    ]
  },
  '031_tag_categories': {
    name: 'TagCategories',
    columns: [
      'id INT IDENTITY(1,1) PRIMARY KEY',
      'category_id NVARCHAR(100) NOT NULL UNIQUE',
      'name NVARCHAR(255) NOT NULL',
      'slug NVARCHAR(255) NOT NULL UNIQUE',
      'description NVARCHAR(500) NULL',
      'is_deleted BIT DEFAULT 0',
      'createdAt DATETIME DEFAULT GETDATE()',
      'updatedAt DATETIME DEFAULT GETDATE()'
    ],
    indexes: [
      'CREATE INDEX IX_TagCategories_IsDeleted ON TagCategories(is_deleted)'
    ]
  },
  '032_variant_spec_keys': {
    name: 'VariantSpecKeys',
    columns: [
      'id INT IDENTITY(1,1) PRIMARY KEY',
      'spec_id NVARCHAR(100) NOT NULL UNIQUE',
      'category NVARCHAR(255) NOT NULL',
      'key_name NVARCHAR(255) NOT NULL',
      'display_name NVARCHAR(255) NOT NULL',
      'data_type NVARCHAR(50) DEFAULT \'string\'',
      'unit NVARCHAR(50) NULL',
      'is_filterable BIT DEFAULT 0',
      'is_comparable BIT DEFAULT 0',
      'is_essential BIT DEFAULT 0',
      'validation_rules NVARCHAR(MAX) NULL', // JSON
      'createdAt DATETIME DEFAULT GETDATE()',
      'updatedAt DATETIME DEFAULT GETDATE()'
    ],
    indexes: [
      'CREATE UNIQUE INDEX UIX_VariantSpecKeys_CatKey ON VariantSpecKeys(category, key_name)'
    ]
  },
  '033_workflow_items': {
    name: 'WorkflowItems',
    columns: [
      'id INT IDENTITY(1,1) PRIMARY KEY',
      'item_id NVARCHAR(100) NOT NULL UNIQUE',
      'entity_type NVARCHAR(50) NOT NULL',
      'entity_id NVARCHAR(100) NOT NULL',
      'state NVARCHAR(50) NOT NULL DEFAULT \'draft\'',
      'history NVARCHAR(MAX) NULL', // JSON
      'current_assigned_to NVARCHAR(100) NULL',
      'createdAt DATETIME DEFAULT GETDATE()',
      'updatedAt DATETIME DEFAULT GETDATE()'
    ],
    indexes: [
      'CREATE UNIQUE INDEX UIX_WorkflowItems_Entity ON WorkflowItems(entity_type, entity_id)'
    ]
  },
  '034_master_options': {
    name: 'MasterOptions',
    columns: [
      'id INT IDENTITY(1,1) PRIMARY KEY',
      'option_id NVARCHAR(100) NOT NULL UNIQUE',
      'category_key NVARCHAR(100) NOT NULL',
      'label NVARCHAR(255) NOT NULL',
      'value NVARCHAR(255) NOT NULL',
      'sort_order INT DEFAULT 0',
      'is_active BIT DEFAULT 1',
      'is_system BIT DEFAULT 0',
      'metadata NVARCHAR(MAX) NULL', // JSON
      'createdAt DATETIME DEFAULT GETDATE()',
      'updatedAt DATETIME DEFAULT GETDATE()'
    ],
    indexes: [
      'CREATE INDEX IX_MasterOptions_CategoryKey ON MasterOptions(category_key)',
      'CREATE INDEX IX_MasterOptions_CategoryKey_Value ON MasterOptions(category_key, value)'
    ]
  },
  '035_unknown_values': {
    name: 'UnknownValues',
    columns: [
      'id INT IDENTITY(1,1) PRIMARY KEY',
      'unknown_id NVARCHAR(100) NOT NULL UNIQUE',
      'category_key NVARCHAR(100) NOT NULL',
      'raw_value NVARCHAR(255) NOT NULL',
      'context NVARCHAR(500) NULL',
      'occurrence_count INT DEFAULT 1',
      'is_resolved BIT DEFAULT 0',
      'resolved_to NVARCHAR(255) NULL',
      'resolved_at DATETIME NULL',
      'createdAt DATETIME DEFAULT GETDATE()',
      'updatedAt DATETIME DEFAULT GETDATE()'
    ],
    indexes: [
      'CREATE INDEX IX_UnknownValues_CategoryKey ON UnknownValues(category_key)',
      'CREATE INDEX IX_UnknownValues_IsResolved ON UnknownValues(is_resolved)',
      'CREATE INDEX IX_UnknownValues_CategoryKey_RawValue ON UnknownValues(category_key, raw_value)'
    ]
  }
};

const jsonColumns = [
  'permissions', 'assigned_brands', 'assigned_domains', 'workflow_rights', 'security',
  'tags', 'thumbnail', 'images', 'stale_flags', 'connected_cars', 'connected_variants',
  'connected_brands', 'connected_body_types', 'connected_fuel_types', 'connected_comparisons',
  'connected_collections', 'slug_history', 'logo', 'brand_media', 'aggregates_cache',
  'fuel_types', 'price_range', 'key_specifications', 'spec_keys_cache', 'specifications',
  'features', 'relatedComparisons', 'seoFAQSchema', 'metadata', 'settings_data',
  'filter_criteria', 'custom_sorting', 'score_weights', 'signal_parameters', 'raw_signals',
  'validation_rules', 'history', 'schema_templates'
];

for (const [prefix, def] of Object.entries(tables)) {
  const filePath = path.join(outDir, `${prefix}.sql`);
  
  const cleanColumns = def.columns.map(col => {
    let c = col;
    // Convert INT IDENTITY(1,1) to INT AUTO_INCREMENT
    c = c.replace(/INT IDENTITY\(1,1\)/gi, 'INT AUTO_INCREMENT');
    // Convert NVARCHAR(MAX) to JSON or LONGTEXT
    if (c.includes('NVARCHAR(MAX)')) {
      const colName = c.trim().split(/\s+/)[0];
      if (jsonColumns.includes(colName)) {
        c = c.replace(/NVARCHAR\(MAX\)/gi, 'JSON');
      } else {
        c = c.replace(/NVARCHAR\(MAX\)/gi, 'LONGTEXT');
      }
    }
    // Convert other NVARCHARs: NVARCHAR(255) -> VARCHAR(255)
    c = c.replace(/NVARCHAR/gi, 'VARCHAR');
    // Convert BIT -> TINYINT(1)
    c = c.replace(/\bBIT\b/gi, 'TINYINT(1)');
    // Convert GETDATE() -> CURRENT_TIMESTAMP
    c = c.replace(/GETDATE\(\)/gi, 'CURRENT_TIMESTAMP');
    
    return c;
  });

  const cleanIndexes = def.indexes.map(idx => {
    let indexSql = idx;
    // Remove SQL Server partial index syntax "WHERE col IS NOT NULL"
    indexSql = indexSql.replace(/\s+WHERE\s+.*$/i, '').trim();
    
    // Parse to inline index definition: KEY `name` (`col1`, `col2`)
    const match = indexSql.match(/CREATE\s+(UNIQUE\s+)?INDEX\s+(\w+)\s+ON\s+\w+\s*\(([^)]+)\)/i);
    if (match) {
      const isUnique = !!match[1];
      const indexName = match[2];
      const cols = match[3].split(',').map(c => {
        const cleaned = c.replace(/[\[\]`]/g, '').trim();
        return `\`${cleaned}\``;
      }).join(', ');
      return `${isUnique ? 'UNIQUE KEY' : 'KEY'} \`${indexName}\` (${cols})`;
    }
    return '';
  }).filter(Boolean);

  const sql = `
-- =========================================================================
-- MySQL Migration Script for Table: ${def.name}
-- Generated for API-Car database structure (MySQL-compatible)
-- =========================================================================

CREATE TABLE IF NOT EXISTS \`${def.name}\` (
    ${[...cleanColumns, ...cleanIndexes].map(c => `    ${c}`).join(',\n    ')}
);
  `.trim();

  fs.writeFileSync(filePath, sql + '\n');
  console.log(`Generated: ${prefix}.sql`);
}
