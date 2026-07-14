-- =========================================================================
-- MySQL Migration Script for Table: UnknownValues
-- Generated for API-Car database structure (MySQL-compatible)
-- =========================================================================

CREATE TABLE IF NOT EXISTS `UnknownValues` (
        id INT AUTO_INCREMENT PRIMARY KEY,
        unknown_id VARCHAR(100) NOT NULL UNIQUE,
        category_key VARCHAR(100) NOT NULL,
        raw_value VARCHAR(255) NOT NULL,
        context VARCHAR(500) NULL,
        occurrence_count INT DEFAULT 1,
        is_resolved TINYINT(1) DEFAULT 0,
        resolved_to VARCHAR(255) NULL,
        resolved_at DATETIME NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        KEY `IX_UnknownValues_CategoryKey` (`category_key`),
        KEY `IX_UnknownValues_IsResolved` (`is_resolved`),
        KEY `IX_UnknownValues_CategoryKey_RawValue` (`category_key`, `raw_value`)
);
