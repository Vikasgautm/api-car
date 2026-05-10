"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedFuelTypes = void 0;
const fuel_type_model_1 = require("../models/fuel-type.model");
const uuid_1 = require("uuid");
const seedFuelTypes = async () => {
    const fuelTypes = [
        {
            fuel_type_id: (0, uuid_1.v4)(),
            name: 'Diesel',
            slug: 'diesel',
            description: 'Diesel fuel type for internal combustion engine vehicles.',
            is_published: true,
            is_deleted: false,
            is_featured: false,
        },
        {
            fuel_type_id: (0, uuid_1.v4)(),
            name: 'Petrol',
            slug: 'petrol',
            description: 'Petrol fuel type for internal combustion engine vehicles.',
            is_published: true,
            is_deleted: false,
            is_featured: false,
        },
        {
            fuel_type_id: (0, uuid_1.v4)(),
            name: 'Hybrid',
            slug: 'hybrid',
            description: 'Hybrid fuel type for vehicles using both engine and electric motor.',
            is_published: true,
            is_deleted: false,
            is_featured: false,
        },
        {
            fuel_type_id: (0, uuid_1.v4)(),
            name: 'EV',
            slug: 'ev',
            description: 'Electric vehicle fuel type.',
            is_published: true,
            is_deleted: false,
            is_featured: false,
        },
        {
            fuel_type_id: (0, uuid_1.v4)(),
            name: 'CNG',
            slug: 'cng',
            description: 'CNG fuel type for compressed natural gas vehicles.',
            is_published: true,
            is_deleted: false,
            is_featured: false,
        },
    ];
    for (const fuelType of fuelTypes) {
        const existing = await fuel_type_model_1.FuelType.findOne({ slug: fuelType.slug });
        if (!existing) {
            await fuel_type_model_1.FuelType.create(fuelType);
            console.log(`Created fuel type: ${fuelType.name}`);
        }
        else {
            console.log(`Fuel type already exists: ${fuelType.name}`);
        }
    }
    console.log('Fuel types seeded successfully');
};
exports.seedFuelTypes = seedFuelTypes;
//# sourceMappingURL=fuel-type.seed.js.map