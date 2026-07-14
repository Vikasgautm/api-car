-- =========================================================================
-- MySQL Migration Script for Table: Tags
-- Generated for API-Car database structure (MySQL-compatible)
-- =========================================================================

CREATE TABLE IF NOT EXISTS `Tags` (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tag_id VARCHAR(100) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        category_id VARCHAR(100) NOT NULL,
        description VARCHAR(500) NULL,
        is_deleted TINYINT(1) DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        KEY `IX_Tags_Category` (`category_id`),
        KEY `IX_Tags_IsDeleted` (`is_deleted`)
);
