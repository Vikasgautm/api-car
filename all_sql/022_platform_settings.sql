-- =========================================================================
-- MySQL Migration Script for Table: PlatformSettings
-- Generated for API-Car database structure (MySQL-compatible)
-- =========================================================================

CREATE TABLE IF NOT EXISTS `PlatformSettings` (
        id INT AUTO_INCREMENT PRIMARY KEY,
        settings_id VARCHAR(100) NOT NULL UNIQUE,
        group_name VARCHAR(100) NOT NULL,
        settings_data JSON NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY `UIX_PlatformSettings_Group` (`group_name`)
);
