-- =========================================================================
-- MySQL Migration Script for Table: MileageBenchmarkOverrides
-- Generated for API-Car database structure (MySQL-compatible)
-- =========================================================================

CREATE TABLE IF NOT EXISTS `MileageBenchmarkOverrides` (
        id INT AUTO_INCREMENT PRIMARY KEY,
        override_id VARCHAR(100) NOT NULL UNIQUE,
        fuel_type VARCHAR(100) NOT NULL,
        transmission VARCHAR(100) NOT NULL,
        benchmark_min DECIMAL(5,2) NOT NULL,
        benchmark_max DECIMAL(5,2) NOT NULL,
        notes VARCHAR(500) NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY `UIX_MileageBenchmarkOverrides_Fuel_Trans` (`fuel_type`, `transmission`)
);
