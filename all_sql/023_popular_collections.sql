-- =========================================================================
-- MySQL Migration Script for Table: PopularCollections
-- Generated for API-Car database structure (MySQL-compatible)
-- =========================================================================

CREATE TABLE IF NOT EXISTS `PopularCollections` (
        id INT AUTO_INCREMENT PRIMARY KEY,
        collection_id VARCHAR(100) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        title_h1 VARCHAR(255) NULL,
        description LONGTEXT NULL,
        preview_image VARCHAR(1000) NULL,
        is_published TINYINT(1) DEFAULT 0,
        is_deleted TINYINT(1) DEFAULT 0,
        filter_criteria JSON NOT NULL,
        custom_sorting JSON NULL,
        aggregates_cache JSON NULL,
        meta_title VARCHAR(255) NULL,
        meta_description VARCHAR(500) NULL,
        meta_keywords VARCHAR(1000) NULL,
        og_image VARCHAR(1000) NULL,
        canonical_url VARCHAR(1000) NULL,
        noindex TINYINT(1) DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        KEY `IX_PopularCollections_IsDeleted` (`is_deleted`),
        KEY `IX_PopularCollections_IsPublished_IsDeleted` (`is_published`, `is_deleted`)
);
