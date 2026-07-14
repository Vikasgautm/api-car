-- =========================================================================
-- MySQL Migration Script for Table: Cities
-- Generated for API-Car database structure (MySQL-compatible)
-- =========================================================================

CREATE TABLE IF NOT EXISTS `Cities` (
        id INT AUTO_INCREMENT PRIMARY KEY,
        city_id VARCHAR(100) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        state VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        is_active TINYINT(1) DEFAULT 1,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        KEY `IX_Cities_IsActive` (`is_active`)
);
