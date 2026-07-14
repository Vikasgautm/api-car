-- =========================================================================
-- MySQL Migration Script for Table: RankingCollectionConfigs
-- Generated for API-Car database structure (MySQL-compatible)
-- =========================================================================

CREATE TABLE IF NOT EXISTS `RankingCollectionConfigs` (
        id INT AUTO_INCREMENT PRIMARY KEY,
        config_id VARCHAR(100) NOT NULL UNIQUE,
        collection_slug VARCHAR(255) NOT NULL UNIQUE,
        score_weights JSON NOT NULL,
        signal_parameters JSON NOT NULL,
        is_active TINYINT(1) DEFAULT 1,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
