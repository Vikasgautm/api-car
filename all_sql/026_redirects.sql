-- =========================================================================
-- MySQL Migration Script for Table: Redirects
-- Generated for API-Car database structure (MySQL-compatible)
-- =========================================================================

CREATE TABLE IF NOT EXISTS `Redirects` (
        id INT AUTO_INCREMENT PRIMARY KEY,
        redirect_id VARCHAR(100) NOT NULL UNIQUE,
        source_url VARCHAR(512) NOT NULL UNIQUE,
        target_url VARCHAR(512) NOT NULL,
        status_code INT DEFAULT 301,
        is_active TINYINT(1) DEFAULT 1,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
