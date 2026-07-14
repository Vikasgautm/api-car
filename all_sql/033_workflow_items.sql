-- =========================================================================
-- MySQL Migration Script for Table: WorkflowItems
-- Generated for API-Car database structure (MySQL-compatible)
-- =========================================================================

CREATE TABLE IF NOT EXISTS `WorkflowItems` (
        id INT AUTO_INCREMENT PRIMARY KEY,
        item_id VARCHAR(100) NOT NULL UNIQUE,
        entity_type VARCHAR(50) NOT NULL,
        entity_id VARCHAR(100) NOT NULL,
        state VARCHAR(50) NOT NULL DEFAULT 'draft',
        history JSON NULL,
        current_assigned_to VARCHAR(100) NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY `UIX_WorkflowItems_Entity` (`entity_type`, `entity_id`)
);
