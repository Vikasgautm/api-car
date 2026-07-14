-- =========================================================================
-- MySQL Migration Script for Table: Brands
-- Generated for API-Car database structure (MySQL-compatible)
-- =========================================================================

CREATE TABLE IF NOT EXISTS `Brands` (
        id INT AUTO_INCREMENT PRIMARY KEY,
        brand_id VARCHAR(100) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        alias VARCHAR(255) NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        slug_history JSON NULL,
        short_description VARCHAR(500) NULL,
        description LONGTEXT NULL,
        founded_year INT NULL,
        country VARCHAR(255) NULL,
        parent_company VARCHAR(255) NULL,
        logo JSON NULL,
        brand_media JSON NULL,
        website VARCHAR(1000) NULL,
        is_published TINYINT(1) DEFAULT 0,
        is_deleted TINYINT(1) DEFAULT 0,
        is_featured TINYINT(1) DEFAULT 0,
        is_upcoming TINYINT(1) DEFAULT 0,
        is_discontinued TINYINT(1) DEFAULT 0,
        aggregates_cache JSON NULL,
        meta_title VARCHAR(255) NULL,
        meta_description VARCHAR(500) NULL,
        meta_keywords VARCHAR(1000) NULL,
        og_image VARCHAR(1000) NULL,
        canonical_url VARCHAR(1000) NULL,
        noindex TINYINT(1) DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        KEY `IX_Brands_IsDeleted` (`is_deleted`),
        KEY `IX_Brands_IsPublished_IsDeleted` (`is_published`, `is_deleted`)
);
