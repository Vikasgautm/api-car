-- =========================================================================
-- MySQL Migration Script for Table: Cars
-- Generated for API-Car database structure (MySQL-compatible)
-- =========================================================================

CREATE TABLE IF NOT EXISTS `Cars` (
        id INT AUTO_INCREMENT PRIMARY KEY,
        car_id VARCHAR(100) NOT NULL UNIQUE,
        brand_id VARCHAR(100) NOT NULL,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        slug_history JSON NULL,
        short_description VARCHAR(500) NULL,
        description LONGTEXT NULL,
        body_type VARCHAR(100) NULL,
        fuel_types JSON NULL,
        price_range JSON NULL,
        key_specifications JSON NULL,
        expert_rating DECIMAL(3,1) NULL,
        user_rating DECIMAL(3,1) NULL,
        is_published TINYINT(1) DEFAULT 0,
        is_deleted TINYINT(1) DEFAULT 0,
        is_featured TINYINT(1) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'upcoming',
        launch_date DATETIME NULL,
        discontinued_date DATETIME NULL,
        meta_title VARCHAR(255) NULL,
        meta_description VARCHAR(500) NULL,
        meta_keywords VARCHAR(1000) NULL,
        og_image VARCHAR(1000) NULL,
        canonical_url VARCHAR(1000) NULL,
        noindex TINYINT(1) DEFAULT 0,
        aggregates_cache JSON NULL,
        spec_keys_cache JSON NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        KEY `IX_Cars_BrandId` (`brand_id`),
        KEY `IX_Cars_IsDeleted` (`is_deleted`),
        KEY `IX_Cars_IsPublished_IsDeleted` (`is_published`, `is_deleted`)
);
