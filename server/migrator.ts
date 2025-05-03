import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import * as schema from "@shared/schema";
import { sql } from 'drizzle-orm';

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

export async function runMigration() {
  console.log('🔄 Setting up database schema...');

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });

  try {
    // Instead of using migrations folder, we'll create tables directly
    // Create schema first
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        email TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user'
      );
      
      CREATE TABLE IF NOT EXISTS locations (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        address TEXT NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS cars (
        id SERIAL PRIMARY KEY,
        make TEXT NOT NULL,
        model TEXT NOT NULL,
        year INTEGER NOT NULL,
        location_id INTEGER NOT NULL REFERENCES locations(id),
        status TEXT NOT NULL DEFAULT 'available',
        car_id TEXT NOT NULL UNIQUE
      );
      
      CREATE TABLE IF NOT EXISTS rentals (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        car_id INTEGER NOT NULL REFERENCES cars(id),
        start_date TIMESTAMP NOT NULL,
        end_date TIMESTAMP NOT NULL,
        status TEXT NOT NULL DEFAULT 'active'
      );
      
      CREATE TABLE IF NOT EXISTS login_history (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        timestamp TIMESTAMP NOT NULL DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS car_insurances (
        id SERIAL PRIMARY KEY,
        car_id INTEGER NOT NULL REFERENCES cars(id),
        policy_number TEXT NOT NULL UNIQUE,
        provider TEXT NOT NULL,
        coverage_type TEXT NOT NULL,
        premium NUMERIC NOT NULL,
        start_date TIMESTAMP NOT NULL,
        end_date TIMESTAMP NOT NULL,
        deductible NUMERIC NOT NULL,
        coverage_limit NUMERIC NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS user_insurances (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        policy_number TEXT NOT NULL UNIQUE,
        provider TEXT NOT NULL,
        coverage_type TEXT NOT NULL,
        premium NUMERIC NOT NULL,
        start_date TIMESTAMP NOT NULL,
        end_date TIMESTAMP NOT NULL,
        liability_coverage NUMERIC NOT NULL,
        personal_injury_coverage NUMERIC NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS session (
        sid VARCHAR NOT NULL PRIMARY KEY,
        sess JSON NOT NULL,
        expire TIMESTAMP(6) NOT NULL
      );
      
      CREATE INDEX IF NOT EXISTS IDX_session_expire ON session (expire);
    `);
    
    console.log('✅ Database schema created successfully!');
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    throw error;
  }

  await pool.end();
  return true;
}