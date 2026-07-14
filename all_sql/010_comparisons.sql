-- =========================================================================
-- MySQL Migration Script for Table: Comparisons
-- Generated for API-Car database structure (MySQL-compatible)
-- =========================================================================

CREATE TABLE IF NOT EXISTS `Comparisons` (
        id INT AUTO_INCREMENT PRIMARY KEY,
        comparison_id VARCHAR(100) NOT NULL UNIQUE,
        car1_id VARCHAR(100) NOT NULL,
        car2_id VARCHAR(100) NOT NULL,
        variant1_id VARCHAR(100) NULL,
        variant2_id VARCHAR(100) NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        title VARCHAR(255) NOT NULL,
        category VARCHAR(255) NULL,
        description LONGTEXT NULL,
        compareIntroContent LONGTEXT NULL,
        isPopular TINYINT(1) DEFAULT 0,
        isTrending TINYINT(1) DEFAULT 0,
        showOnHomepage TINYINT(1) DEFAULT 0,
        relatedComparisons JSON NULL,
        seoMetaTitle VARCHAR(255) NULL,
        seoMetaDescription VARCHAR(500) NULL,
        seoFAQSchema JSON NULL,
        status VARCHAR(50) DEFAULT 'draft',
        is_published TINYINT(1) DEFAULT 0,
        is_deleted TINYINT(1) DEFAULT 0,
        deleted_at DATETIME NULL,
        created_by VARCHAR(100) NULL,
        updated_by VARCHAR(100) NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        KEY `IX_Comparisons_Car1_Car2` (`car1_id`, `car2_id`),
        KEY `IX_Comparisons_IsDeleted` (`is_deleted`)
);
