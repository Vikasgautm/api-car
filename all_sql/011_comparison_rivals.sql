-- =========================================================================
-- MySQL Migration Script for Table: ComparisonRivals
-- Generated for API-Car database structure (MySQL-compatible)
-- =========================================================================

CREATE TABLE IF NOT EXISTS `ComparisonRivals` (
        id INT AUTO_INCREMENT PRIMARY KEY,
        primary_car_id VARCHAR(100) NOT NULL,
        rival_car_id VARCHAR(100) NOT NULL,
        relationship_strength INT DEFAULT 50,
        manual_mapping TINYINT(1) DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY `UIX_ComparisonRivals_Primary_Rival` (`primary_car_id`, `rival_car_id`)
);
