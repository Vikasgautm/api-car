-- =========================================================================
-- MySQL Migration Script for Table: RankingScores
-- Generated for API-Car database structure (MySQL-compatible)
-- =========================================================================

CREATE TABLE IF NOT EXISTS `RankingScores` (
        id INT AUTO_INCREMENT PRIMARY KEY,
        score_id VARCHAR(100) NOT NULL UNIQUE,
        entity_type VARCHAR(100) NOT NULL,
        entity_id VARCHAR(100) NOT NULL,
        popularity_score DECIMAL(10,4) DEFAULT 0,
        trending_score DECIMAL(10,4) DEFAULT 0,
        engagement_score DECIMAL(10,4) DEFAULT 0,
        buyer_intent_score DECIMAL(10,4) DEFAULT 0,
        comparison_pressure_score DECIMAL(10,4) DEFAULT 0,
        retention_score DECIMAL(10,4) DEFAULT 0,
        raw_signals JSON NULL,
        computed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        window_days INT DEFAULT 30,
        session_count INT DEFAULT 0,
        behavioral_confidence DECIMAL(5,4) DEFAULT 0,
        trending_direction VARCHAR(50) DEFAULT 'stable',
        trending_velocity DECIMAL(10,4) DEFAULT 0,
        rank_position INT NULL,
        is_anomaly TINYINT(1) DEFAULT 0,
        prev_popularity_score DECIMAL(10,4) DEFAULT 0,
        prev_trending_score DECIMAL(10,4) DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY `UIX_RankingScores_Entity` (`entity_type`, `entity_id`)
);
