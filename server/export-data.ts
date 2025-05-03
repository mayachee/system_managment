import * as fs from 'fs';
import { storage } from './storage';

/**
 * This script exports all data from the Express.js storage to JSON files
 * which can be used to migrate data to the Django database.
 */
async function exportData() {
  console.log('Starting Express.js data export...');
  
  try {
    // Export users
    const users = await storage.getAllUsers();
    fs.writeFileSync('express_users.json', JSON.stringify(users, null, 2));
    console.log(`Exported ${users.length} users to express_users.json`);
    
    // Export locations
    const locations = await storage.getAllLocations();
    fs.writeFileSync('express_locations.json', JSON.stringify(locations, null, 2));
    console.log(`Exported ${locations.length} locations to express_locations.json`);
    
    // Export cars
    const cars = await storage.getAllCars();
    fs.writeFileSync('express_cars.json', JSON.stringify(cars, null, 2));
    console.log(`Exported ${cars.length} cars to express_cars.json`);
    
    // Export rentals
    const rentals = await storage.getAllRentals();
    fs.writeFileSync('express_rentals.json', JSON.stringify(rentals, null, 2));
    console.log(`Exported ${rentals.length} rentals to express_rentals.json`);
    
    // Export login history
    const loginHistory = await storage.getAllLoginHistory();
    fs.writeFileSync('express_login_history.json', JSON.stringify(loginHistory, null, 2));
    console.log(`Exported ${loginHistory.length} login history entries to express_login_history.json`);
    
    console.log('Data export completed successfully!');
  } catch (error) {
    console.error('Error exporting data:', error);
  }
}

// Run the export
exportData();