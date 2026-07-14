-- =========================================================================
-- MySQL Migration Script for Table: FAQs
-- Generated for API-Car database structure (MySQL-compatible)
-- =========================================================================

CREATE TABLE IF NOT EXISTS `FAQs` (
        id INT AUTO_INCREMENT PRIMARY KEY,
        faq_id VARCHAR(100) NOT NULL UNIQUE,
        question VARCHAR(500) NOT NULL,
        answer LONGTEXT NOT NULL,
        category VARCHAR(100) NOT NULL,
        is_published TINYINT(1) DEFAULT 1,
        is_deleted TINYINT(1) DEFAULT 0,
        entity_type VARCHAR(50) NULL,
        entity_id VARCHAR(100) NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        KEY `IX_FAQs_Entity` (`entity_type`, `entity_id`),
        KEY `IX_FAQs_IsDeleted` (`is_deleted`)
);
