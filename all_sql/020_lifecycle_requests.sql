-- =========================================================================
-- MySQL Migration Script for Table: LifecycleRequests
-- Generated for API-Car database structure (MySQL-compatible)
-- =========================================================================

CREATE TABLE IF NOT EXISTS `LifecycleRequests` (
        id INT AUTO_INCREMENT PRIMARY KEY,
        request_id VARCHAR(100) NOT NULL UNIQUE,
        entity_type VARCHAR(50) NOT NULL,
        entity_id VARCHAR(100) NOT NULL,
        transition VARCHAR(50) NOT NULL,
        reason VARCHAR(500) NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        otp_hash VARCHAR(255) NOT NULL,
        otp_expires_at DATETIME NOT NULL,
        otp_attempts INT DEFAULT 0,
        otp_max_attempts INT DEFAULT 5,
        otp_channel VARCHAR(50) NOT NULL,
        otp_sent_to VARCHAR(255) NULL,
        requested_by_user_id VARCHAR(100) NOT NULL,
        requested_by_email VARCHAR(255) NULL,
        requested_by_role VARCHAR(50) NULL,
        approved_by_user_id VARCHAR(100) NULL,
        approved_at DATETIME NULL,
        cancelled_at DATETIME NULL,
        cancellation_reason VARCHAR(500) NULL,
        metadata JSON NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        KEY `IX_LifecycleRequests_Status` (`status`)
);
