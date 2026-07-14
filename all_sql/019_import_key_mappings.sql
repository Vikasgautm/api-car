-- =========================================================================
-- MySQL Migration Script for Table: ImportKeyMappings
-- Generated for API-Car database structure (MySQL-compatible)
-- =========================================================================

CREATE TABLE IF NOT EXISTS `ImportKeyMappings` (
        id INT AUTO_INCREMENT PRIMARY KEY,
        mapping_id VARCHAR(100) NOT NULL UNIQUE,
        source_key VARCHAR(255) NOT NULL UNIQUE,
        db_field VARCHAR(255) NOT NULL,
        transformation_rule LONGTEXT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
