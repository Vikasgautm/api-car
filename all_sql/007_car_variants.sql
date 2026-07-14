-- =========================================================================
-- MySQL Migration Script for Table: CarVariants
-- Generated for API-Car database structure (MySQL-compatible)
-- =========================================================================

CREATE TABLE IF NOT EXISTS `CarVariants` (
        id INT AUTO_INCREMENT PRIMARY KEY,
        variant_id VARCHAR(100) NOT NULL UNIQUE,
        car_id VARCHAR(100) NOT NULL,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        price INT NOT NULL,
        transmission VARCHAR(100) NOT NULL,
        fuel_type VARCHAR(100) NOT NULL,
        engine_displacement INT NULL,
        power DECIMAL(6,2) NULL,
        torque DECIMAL(6,2) NULL,
        mileage DECIMAL(5,2) NULL,
        seating_capacity INT NULL,
        is_published TINYINT(1) DEFAULT 0,
        is_deleted TINYINT(1) DEFAULT 0,
        specifications JSON NULL,
        features JSON NULL,
        mileage_class VARCHAR(100) NULL,
        mileage_class_value DECIMAL(5,2) NULL,
        mileage_class_source VARCHAR(100) NULL,
        range_class VARCHAR(100) NULL,
        range_class_value DECIMAL(5,2) NULL,
        range_class_source VARCHAR(100) NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        KEY `IX_CarVariants_CarId` (`car_id`),
        KEY `IX_CarVariants_IsDeleted` (`is_deleted`)
);
