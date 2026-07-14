-- =========================================================================
-- MySQL Migration Script for Table: CarImages
-- Generated for API-Car database structure (MySQL-compatible)
-- =========================================================================

CREATE TABLE IF NOT EXISTS `CarImages` (
        id INT AUTO_INCREMENT PRIMARY KEY,
        image_id VARCHAR(100) NOT NULL UNIQUE,
        car_id VARCHAR(100) NOT NULL,
        variant_id VARCHAR(100) NULL,
        url VARCHAR(1000) NOT NULL,
        caption VARCHAR(255) NULL,
        is_primary TINYINT(1) DEFAULT 0,
        category VARCHAR(100) NULL,
        is_deleted TINYINT(1) DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        KEY `IX_CarImages_CarId` (`car_id`),
        KEY `IX_CarImages_IsDeleted` (`is_deleted`)
);
