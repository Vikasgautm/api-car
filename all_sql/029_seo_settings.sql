-- =========================================================================
-- MySQL Migration Script for Table: SeoSettings
-- Generated for API-Car database structure (MySQL-compatible)
-- =========================================================================

CREATE TABLE IF NOT EXISTS `SeoSettings` (
        id INT AUTO_INCREMENT PRIMARY KEY,
        settings_id VARCHAR(100) NOT NULL UNIQUE,
        page_type VARCHAR(100) NOT NULL UNIQUE,
        meta_title VARCHAR(255) NOT NULL,
        meta_description VARCHAR(500) NOT NULL,
        meta_keywords VARCHAR(1000) NULL,
        schema_templates JSON NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
