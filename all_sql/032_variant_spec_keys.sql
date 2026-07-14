-- =========================================================================
-- MySQL Migration Script for Table: VariantSpecKeys
-- Generated for API-Car database structure (MySQL-compatible)
-- =========================================================================

CREATE TABLE IF NOT EXISTS `VariantSpecKeys` (
        id INT AUTO_INCREMENT PRIMARY KEY,
        spec_id VARCHAR(100) NOT NULL UNIQUE,
        category VARCHAR(255) NOT NULL,
        key_name VARCHAR(255) NOT NULL,
        display_name VARCHAR(255) NOT NULL,
        data_type VARCHAR(50) DEFAULT 'string',
        unit VARCHAR(50) NULL,
        is_filterable TINYINT(1) DEFAULT 0,
        is_comparable TINYINT(1) DEFAULT 0,
        is_essential TINYINT(1) DEFAULT 0,
        validation_rules JSON NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY `UIX_VariantSpecKeys_CatKey` (`category`, `key_name`)
);
