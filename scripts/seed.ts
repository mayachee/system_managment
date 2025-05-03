/**
 * Database Seeder Script
 * 
 * This script populates the database with initial data for testing and development.
 * Run it using: npm run db:seed
 */

import { db } from '../server/db';
import { cars, locations, users, rentals, carMaintenance } from '../shared/schema';
import { eq } from 'drizzle-orm';
import { randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString('hex')}.${salt}`;
}

async function clearAllData() {
  console.log('🧹 Clearing existing data...');
  
  try {
    // Delete in order to avoid foreign key constraints
    await db.delete(rentals);
    await db.delete(carMaintenance);
    await db.delete(cars);
    await db.delete(locations);
    await db.delete(users);
    
    console.log('✅ All data cleared successfully');
  } catch (error) {
    console.error('❌ Error clearing data:', error);
    process.exit(1);
  }
}

async function seedUsers() {
  console.log('👤 Seeding users...');
  
  try {
    // Create admin user
    const adminPassword = await hashPassword('admin123');
    const admin = await db.insert(users).values({
      username: 'admin',
      email: 'admin@example.com',
      password: adminPassword,
      role: 'admin'
    }).returning();
    
    // Create regular user
    const userPassword = await hashPassword('user123');
    const regularUser = await db.insert(users).values({
      username: 'user',
      email: 'user@example.com',
      password: userPassword,
      role: 'user'
    }).returning();
    
    console.log('✅ Users seeded successfully');
    return { admin: admin[0], regularUser: regularUser[0] };
  } catch (error) {
    console.error('❌ Error seeding users:', error);
    process.exit(1);
  }
}

async function seedLocations() {
  console.log('📍 Seeding locations...');
  
  try {
    const locationData = [
      {
        name: 'Downtown Office',
        address: '123 Main Street, Downtown, City'
      },
      {
        name: 'Airport Branch',
        address: 'Terminal 2, International Airport, City'
      },
      {
        name: 'Suburban Office',
        address: '456 Oak Avenue, Suburb Area, City'
      }
    ];
    
    const seededLocations = [];
    
    for (const location of locationData) {
      const result = await db.insert(locations).values(location).returning();
      seededLocations.push(result[0]);
    }
    
    console.log('✅ Locations seeded successfully');
    return seededLocations;
  } catch (error) {
    console.error('❌ Error seeding locations:', error);
    process.exit(1);
  }
}

async function seedCars(locationData: any[]) {
  console.log('🚗 Seeding cars...');
  
  try {
    const carData = [
      {
        make: 'Toyota',
        model: 'Corolla',
        year: 2022,
        locationId: locationData[0].id,
        status: 'available',
        carId: 'CAR-001'
      },
      {
        make: 'Honda',
        model: 'Civic',
        year: 2023,
        locationId: locationData[0].id,
        status: 'available',
        carId: 'CAR-002'
      },
      {
        make: 'Ford',
        model: 'Escape',
        year: 2022,
        locationId: locationData[1].id,
        status: 'available',
        carId: 'CAR-003'
      },
      {
        make: 'Nissan',
        model: 'Altima',
        year: 2021,
        locationId: locationData[1].id,
        status: 'maintenance',
        carId: 'CAR-004'
      },
      {
        make: 'Chevrolet',
        model: 'Malibu',
        year: 2023,
        locationId: locationData[2].id,
        status: 'available',
        carId: 'CAR-005'
      }
    ];
    
    const seededCars = [];
    
    for (const car of carData) {
      const result = await db.insert(cars).values(car).returning();
      seededCars.push(result[0]);
    }
    
    console.log('✅ Cars seeded successfully');
    return seededCars;
  } catch (error) {
    console.error('❌ Error seeding cars:', error);
    process.exit(1);
  }
}

async function seedRentals(userData: any, carData: any[]) {
  console.log('📅 Seeding rentals...');
  
  try {
    // Create some rentals with different statuses
    const now = new Date();
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const oneWeekFromNow = new Date(now);
    oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
    
    const twoWeeksFromNow = new Date(now);
    twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);
    
    const rentalData = [
      {
        userId: userData.admin.id,
        carId: carData[0].id,
        startDate: oneWeekAgo,
        endDate: now,
        status: 'completed'
      },
      {
        userId: userData.regularUser.id,
        carId: carData[1].id,
        startDate: now,
        endDate: oneWeekFromNow,
        status: 'active'
      },
      {
        userId: userData.admin.id,
        carId: carData[2].id,
        startDate: oneWeekFromNow,
        endDate: twoWeeksFromNow,
        status: 'active'
      }
    ];
    
    const seededRentals = [];
    
    for (const rental of rentalData) {
      const result = await db.insert(rentals).values(rental).returning();
      seededRentals.push(result[0]);
      
      // Update car status if rental is active
      if (rental.status === 'active') {
        await db.update(cars)
          .set({ status: 'rented' })
          .where(eq(cars.id, rental.carId));
      }
    }
    
    console.log('✅ Rentals seeded successfully');
    return seededRentals;
  } catch (error) {
    console.error('❌ Error seeding rentals:', error);
    process.exit(1);
  }
}

async function seedMaintenance(carData: any[]) {
  console.log('🔧 Seeding maintenance records...');
  
  try {
    const now = new Date();
    const oneMonthFromNow = new Date(now);
    oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
    
    const threeMonthsFromNow = new Date(now);
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
    
    const oneMonthAgo = new Date(now);
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    const maintenanceData = [
      {
        carId: carData[3].id,
        maintenanceType: 'Oil Change',
        description: 'Regular oil change and filter replacement',
        serviceDate: now,
        nextServiceDate: threeMonthsFromNow,
        cost: 85.99,
        completed: true,
        serviceProvider: 'Auto Service Center',
        mileage: 15000,
        notes: 'Used synthetic oil as recommended'
      },
      {
        carId: carData[2].id,
        maintenanceType: 'Tire Rotation',
        description: 'Rotate tires to ensure even wear',
        serviceDate: oneMonthAgo,
        nextServiceDate: oneMonthFromNow,
        cost: 45.00,
        completed: true,
        serviceProvider: 'Tire Express',
        mileage: 12500,
        notes: 'All tires in good condition'
      },
      {
        carId: carData[0].id,
        maintenanceType: 'Annual Inspection',
        description: 'Complete annual safety and emissions inspection',
        serviceDate: oneMonthFromNow,
        nextServiceDate: threeMonthsFromNow,
        cost: 150.00,
        completed: false,
        serviceProvider: 'Car Inspection Center',
        mileage: 20000,
        notes: 'Schedule for full inspection'
      }
    ];
    
    const seededMaintenance = [];
    
    for (const maintenance of maintenanceData) {
      const result = await db.insert(carMaintenance).values(maintenance).returning();
      seededMaintenance.push(result[0]);
    }
    
    console.log('✅ Maintenance records seeded successfully');
    return seededMaintenance;
  } catch (error) {
    console.error('❌ Error seeding maintenance records:', error);
    process.exit(1);
  }
}

async function seedDatabase() {
  console.log('🔄 Starting database seeding...');
  
  try {
    await clearAllData();
    const userData = await seedUsers();
    const locationData = await seedLocations();
    const carData = await seedCars(locationData);
    await seedRentals(userData, carData);
    await seedMaintenance(carData);
    
    console.log('✅ Database seeded successfully!');
    console.log('Login credentials:');
    console.log('  Admin User: admin / admin123');
    console.log('  Regular User: user / user123');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during seeding process:', error);
    process.exit(1);
  }
}

// Run the seeder
seedDatabase();