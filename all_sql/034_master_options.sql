-- =========================================================================
-- MySQL Migration Script for Table: MasterOptions
-- Generated for API-Car database structure (MySQL-compatible)
-- =========================================================================

CREATE TABLE IF NOT EXISTS `MasterOptions` (
        id INT AUTO_INCREMENT PRIMARY KEY,
        option_id VARCHAR(100) NOT NULL UNIQUE,
        category_key VARCHAR(100) NOT NULL,
        label VARCHAR(255) NOT NULL,
        value VARCHAR(255) NOT NULL,
        sort_order INT DEFAULT 0,
        is_active TINYINT(1) DEFAULT 1,
        is_system TINYINT(1) DEFAULT 0,
        metadata JSON NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        KEY `IX_MasterOptions_CategoryKey` (`category_key`),
        KEY `IX_MasterOptions_CategoryKey_Value` (`category_key`, `value`)
);
