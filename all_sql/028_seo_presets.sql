-- =========================================================================
-- MySQL Migration Script for Table: SeoPresets
-- Generated for API-Car database structure (MySQL-compatible)
-- =========================================================================

CREATE TABLE IF NOT EXISTS `SeoPresets` (
        id INT AUTO_INCREMENT PRIMARY KEY,
        preset_id VARCHAR(100) NOT NULL UNIQUE,
        preset_type VARCHAR(100) NOT NULL,
        rule_pattern VARCHAR(500) NOT NULL,
        meta_title_template VARCHAR(500) NOT NULL,
        meta_description_template VARCHAR(1000) NOT NULL,
        h1_template VARCHAR(500) NULL,
        description_template LONGTEXT NULL,
        is_active TINYINT(1) DEFAULT 1,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
