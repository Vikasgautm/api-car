-- =========================================================================
-- MySQL Migration Script for Table: ImageSubcategories
-- Generated for API-Car database structure (MySQL-compatible)
-- =========================================================================

CREATE TABLE IF NOT EXISTS `ImageSubcategories` (
        id INT AUTO_INCREMENT PRIMARY KEY,
        subcategory_id VARCHAR(100) NOT NULL UNIQUE,
        category_id VARCHAR(100) NOT NULL,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        is_deleted TINYINT(1) DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        KEY `IX_ImageSubcategories_Category` (`category_id`),
        KEY `IX_ImageSubcategories_IsDeleted` (`is_deleted`)
);
