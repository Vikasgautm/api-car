-- =========================================================================
-- MySQL Migration Script for Table: UserSessions
-- Generated for API-Car database structure (MySQL-compatible)
-- =========================================================================

CREATE TABLE IF NOT EXISTS `UserSessions` (
        id INT AUTO_INCREMENT PRIMARY KEY,
        session_id VARCHAR(100) NOT NULL UNIQUE,
        user_id VARCHAR(100) NOT NULL,
        refresh_token VARCHAR(500) NOT NULL,
        expires_at DATETIME NOT NULL,
        is_revoked TINYINT(1) DEFAULT 0,
        device_info VARCHAR(1000) NULL,
        ip_address VARCHAR(100) NULL,
        revoked_at DATETIME NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        KEY `IX_UserSessions_UserId` (`user_id`),
        KEY `IX_UserSessions_RefreshToken` (`refresh_token`),
        KEY `IX_UserSessions_IsRevoked` (`is_revoked`),
        KEY `IX_UserSessions_ExpiresAt` (`expires_at`)
);
