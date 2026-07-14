-- =========================================================================
-- MySQL Migration Script for Table: Users
-- Generated for API-Car database structure (MySQL-compatible)
-- =========================================================================

CREATE TABLE IF NOT EXISTS `Users` (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(100) NOT NULL UNIQUE,
        user_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NULL,
        phone VARCHAR(50) NULL,
        whatsapp_phone VARCHAR(50) NULL,
        whatsapp_opt_in TINYINT(1) DEFAULT 0,
        profile_pic VARCHAR(1000) NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'user',
        governance_role VARCHAR(50) NULL,
        permissions JSON NULL,
        assigned_brands JSON NULL,
        assigned_domains JSON NULL,
        workflow_rights JSON NULL,
        security JSON NULL,
        is_email_verified TINYINT(1) DEFAULT 0,
        google_id VARCHAR(100) NULL,
        is_deleted TINYINT(1) DEFAULT 0,
        theme VARCHAR(50) DEFAULT 'light',
        is_active TINYINT(1) DEFAULT 1,
        last_login_at DATETIME NULL,
        password_reset_token VARCHAR(255) NULL,
        password_reset_expires DATETIME NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        KEY `IX_Users_GoogleId` (`google_id`),
        KEY `IX_Users_IsDeleted` (`is_deleted`),
        KEY `IX_Users_IsEmailVerified` (`is_email_verified`),
        KEY `IX_Users_Role` (`role`)
);
