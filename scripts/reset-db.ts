/**
 * Database Reset Script
 * 
 * This script clears all data from the database.
 * Use with caution - this will delete all your data!
 * Run it using: npm run db:reset
 */

import { db } from '../server/db';
import { cars, locations, users, rentals, carMaintenance } from '../shared/schema';
import readline from 'readline';

// Create readline interface for user confirmation
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function clearAllData() {
  console.log('🧹 Clearing all data from database...');
  
  try {
    // Delete in order to avoid foreign key constraints
    await db.delete(rentals);
    console.log('✅ Rentals table cleared');
    
    await db.delete(carMaintenance);
    console.log('✅ Car maintenance table cleared');
    
    await db.delete(cars);
    console.log('✅ Cars table cleared');
    
    await db.delete(locations);
    console.log('✅ Locations table cleared');
    
    await db.delete(users);
    console.log('✅ Users table cleared');
    
    console.log('✅ All data cleared successfully');
  } catch (error) {
    console.error('❌ Error clearing data:', error);
    process.exit(1);
  }
}

function confirmReset() {
  return new Promise<boolean>((resolve) => {
    rl.question('⚠️  WARNING: This will delete ALL data in the database. Are you sure? (yes/no): ', (answer) => {
      resolve(answer.toLowerCase() === 'yes');
    });
  });
}

async function resetDatabase() {
  console.log('🔄 Database Reset Tool');
  console.log('=====================');
  
  const confirmed = await confirmReset();
  
  if (confirmed) {
    await clearAllData();
    console.log('Database has been reset. All data has been deleted.');
  } else {
    console.log('Operation cancelled. No data was deleted.');
  }
  
  rl.close();
  process.exit(0);
}

// Run the reset
resetDatabase();