/**
 * Database Restore Script
 * 
 * This script restores data from backup JSON files into the database
 * Run it using: npm run db:restore
 */

import { db } from '../server/db';
import { cars, locations, users, rentals, carMaintenance } from '../shared/schema';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

const BACKUP_DIR = path.join(process.cwd(), 'backups');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper to ask questions
function askQuestion(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// List all backup files in the backup directory
function listBackupFiles(): { [key: string]: string[] } {
  if (!fs.existsSync(BACKUP_DIR)) {
    console.error(`❌ Backup directory not found: ${BACKUP_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(BACKUP_DIR);
  const backupFiles: { [key: string]: string[] } = {};

  files.forEach(file => {
    if (file.endsWith('.json')) {
      const tableName = file.split('_')[0];
      if (!backupFiles[tableName]) {
        backupFiles[tableName] = [];
      }
      backupFiles[tableName].push(file);
    }
  });

  return backupFiles;
}

// Get the latest backup file for each table
function getLatestBackups(backupFiles: { [key: string]: string[] }): { [key: string]: string } {
  const latestBackups: { [key: string]: string } = {};

  for (const tableName in backupFiles) {
    // Sort files by timestamp (newest first)
    const files = backupFiles[tableName].sort().reverse();
    if (files.length > 0) {
      latestBackups[tableName] = files[0];
    }
  }

  return latestBackups;
}

// Restore data to a specific table
async function restoreTable(tableName: string, fileName: string, tableSchema: any) {
  const filePath = path.join(BACKUP_DIR, fileName);
  
  try {
    console.log(`🔄 Restoring ${tableName} from ${fileName}...`);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileContent);
    
    // Insert all records
    if (data.length > 0) {
      await db.insert(tableSchema).values(data).onConflictDoUpdate({
        target: [tableSchema.id],
        set: Object.fromEntries(
          Object.keys(data[0])
            .filter(key => key !== 'id')
            .map(key => [key, { ref: key }])
        )
      });
      console.log(`✅ Restored ${data.length} records to ${tableName}`);
    } else {
      console.log(`ℹ️ No records to restore for ${tableName}`);
    }
  } catch (error) {
    console.error(`❌ Error restoring ${tableName}:`, error);
    throw error;
  }
}

// Clear all existing data
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
    throw error;
  }
}

// Restore database from backup files
async function restoreDatabase() {
  console.log('🔄 Database Restore Tool');
  console.log('=======================');
  
  try {
    const backupFiles = listBackupFiles();
    if (Object.keys(backupFiles).length === 0) {
      console.error('❌ No backup files found in the backup directory.');
      return;
    }
    
    console.log('📁 Available backup files:');
    for (const tableName in backupFiles) {
      console.log(`\n${tableName}:`);
      backupFiles[tableName].forEach((file, i) => {
        console.log(`  ${i + 1}. ${file}`);
      });
    }
    
    const useLatest = await askQuestion('\nDo you want to use the latest backups for all tables? (yes/no): ');
    
    if (useLatest.toLowerCase() === 'yes') {
      const latestBackups = getLatestBackups(backupFiles);
      console.log('\n🔄 Using latest backups:');
      for (const tableName in latestBackups) {
        console.log(`  ${tableName}: ${latestBackups[tableName]}`);
      }
      
      const confirmRestore = await askQuestion('\n⚠️ This will overwrite all existing data. Continue? (yes/no): ');
      if (confirmRestore.toLowerCase() !== 'yes') {
        console.log('❌ Restore operation cancelled.');
        rl.close();
        return;
      }
      
      await clearAllData();
      
      // Restore in correct order for foreign key constraints
      if (latestBackups['users']) {
        await restoreTable('users', latestBackups['users'], users);
      }
      if (latestBackups['locations']) {
        await restoreTable('locations', latestBackups['locations'], locations);
      }
      if (latestBackups['cars']) {
        await restoreTable('cars', latestBackups['cars'], cars);
      }
      if (latestBackups['rentals']) {
        await restoreTable('rentals', latestBackups['rentals'], rentals);
      }
      if (latestBackups['car_maintenance']) {
        await restoreTable('car_maintenance', latestBackups['car_maintenance'], carMaintenance);
      }
    } else {
      console.log('\n❌ Manual backup selection is not implemented yet.');
      console.log('Please run the script again and choose to use the latest backups.');
    }
    
    console.log('\n✅ Database restore completed successfully!');
  } catch (error) {
    console.error('\n❌ Database restore failed:', error);
  } finally {
    rl.close();
  }
}

// Run the restore
restoreDatabase();