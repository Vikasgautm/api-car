-- =========================================================================
-- MySQL Migration Script for Table: BodyTypes
-- Generated for API-Car database structure (MySQL-compatible)
-- =========================================================================

CREATE TABLE IF NOT EXISTS `BodyTypes` (
        id INT AUTO_INCREMENT PRIMARY KEY,
        type_id VARCHAR(100) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        description LONGTEXT NULL,
        is_deleted TINYINT(1) DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        KEY `IX_BodyTypes_IsDeleted` (`is_deleted`)
);
