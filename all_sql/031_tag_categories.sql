-- =========================================================================
-- MySQL Migration Script for Table: TagCategories
-- Generated for API-Car database structure (MySQL-compatible)
-- =========================================================================

CREATE TABLE IF NOT EXISTS `TagCategories` (
        id INT AUTO_INCREMENT PRIMARY KEY,
        category_id VARCHAR(100) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        description VARCHAR(500) NULL,
        is_deleted TINYINT(1) DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        KEY `IX_TagCategories_IsDeleted` (`is_deleted`)
);
