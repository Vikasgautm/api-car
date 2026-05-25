import { FuelType } from '../models/fuel-type.model';
import { v4 as uuidv4 } from 'uuid';

export const seedFuelTypes = async () => {
  const fuelTypes = [
    {
      fuel_type_id: uuidv4(),
      name: 'Diesel',
      slug: 'diesel',
      description: 'Diesel fuel type for internal combustion engine vehicles.',
      is_published: true,
      is_deleted: false,
      is_featured: false,
    },
    {
      fuel_type_id: uuidv4(),
      name: 'Petrol',
      slug: 'petrol',
      description: 'Petrol fuel type for internal combustion engine vehicles.',
      is_published: true,
      is_deleted: false,
      is_featured: false,
    },
    {
      fuel_type_id: uuidv4(),
      name: 'Hybrid',
      slug: 'hybrid',
      description: 'Hybrid fuel type for vehicles using both engine and electric motor.',
      is_published: true,
      is_deleted: false,
      is_featured: false,
    },
    {
      fuel_type_id: uuidv4(),
      name: 'EV',
      slug: 'ev',
      description: 'Electric vehicle fuel type.',
      is_published: true,
      is_deleted: false,
      is_featured: false,
    },
    {
      fuel_type_id: uuidv4(),
      name: 'CNG',
      slug: 'cng',
      description: 'CNG fuel type for compressed natural gas vehicles.',
      is_published: true,
      is_deleted: false,
      is_featured: false,
    },
  ];

  for (const fuelType of fuelTypes) {
    const existing = await FuelType.findOne({ slug: fuelType.slug });
    if (!existing) {
      await FuelType.create(fuelType);
    }
  }
};
