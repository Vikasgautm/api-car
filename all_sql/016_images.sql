-- =========================================================================
-- MySQL Migration Script for Table: Images
-- Generated for API-Car database structure (MySQL-compatible)
-- =========================================================================

CREATE TABLE IF NOT EXISTS `Images` (
        id INT AUTO_INCREMENT PRIMARY KEY,
        image_id VARCHAR(100) NOT NULL UNIQUE,
        url VARCHAR(1000) NOT NULL,
        alt VARCHAR(255) NULL,
        category_id VARCHAR(100) NULL,
        subcategory_id VARCHAR(100) NULL,
        is_deleted TINYINT(1) DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        KEY `IX_Images_IsDeleted` (`is_deleted`)
);
