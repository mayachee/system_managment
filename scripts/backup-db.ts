/**
 * Database Backup Script
 * 
 * This script exports all data from the database into JSON files
 * Run it using: npm run db:backup
 */

import { db } from '../server/db';
import { cars, locations, users, rentals, carMaintenance } from '../shared/schema';
import fs from 'fs';
import path from 'path';

const BACKUP_DIR = path.join(process.cwd(), 'backups');

// Ensure backup directory exists
function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    console.log(`✅ Created backup directory: ${BACKUP_DIR}`);
  }
}

// Generate timestamp for backup files
function getTimestamp() {
  const now = new Date();
  return now.toISOString().replace(/:/g, '-').replace(/\..+/, '');
}

// Create backup file with formatted JSON
async function backupTable(tableName: string, data: any[]) {
  const timestamp = getTimestamp();
  const fileName = `${tableName}_${timestamp}.json`;
  const filePath = path.join(BACKUP_DIR, fileName);
  
  try {
    // Format JSON with indentation for readability
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`✅ Backed up ${data.length} records from ${tableName} to ${fileName}`);
  } catch (error) {
    console.error(`❌ Error backing up ${tableName}:`, error);
    throw error;
  }
}

// Export all data from a single table
async function exportTable(tableName: string, tableQuery: any) {
  try {
    const data = await db.select().from(tableQuery);
    await backupTable(tableName, data);
    return data;
  } catch (error) {
    console.error(`❌ Error exporting ${tableName}:`, error);
    throw error;
  }
}

// Main backup function
async function backupDatabase() {
  console.log('🔄 Starting database backup...');
  
  try {
    ensureBackupDir();
    
    // Backup all tables
    await exportTable('users', users);
    await exportTable('locations', locations);
    await exportTable('cars', cars);
    await exportTable('rentals', rentals);
    await exportTable('car_maintenance', carMaintenance);
    
    console.log('✅ Database backup completed successfully!');
    console.log(`📂 Backup files saved to: ${BACKUP_DIR}`);
  } catch (error) {
    console.error('❌ Database backup failed:', error);
    process.exit(1);
  }
}

// Run the backup
backupDatabase();