-- =========================================================================
-- MySQL Migration Script for Table: EditLocks
-- Generated for API-Car database structure (MySQL-compatible)
-- =========================================================================

CREATE TABLE IF NOT EXISTS `EditLocks` (
        id INT AUTO_INCREMENT PRIMARY KEY,
        lock_id VARCHAR(100) NOT NULL UNIQUE,
        entity_type VARCHAR(50) NOT NULL,
        entity_id VARCHAR(100) NOT NULL,
        user_id VARCHAR(100) NOT NULL,
        expires_at DATETIME NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY `UIX_EditLocks_Entity` (`entity_type`, `entity_id`)
);
