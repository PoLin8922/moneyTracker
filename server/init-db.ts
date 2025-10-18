// Database initialization script
import { db } from './db';
import { sql } from 'drizzle-orm';

async function initDatabase() {
  try {
    console.log('Testing database connection...');
    
    // Test connection
    await db.execute(sql`SELECT 1`);
    console.log('✅ Database connection successful!');
    
    // The tables should be automatically created by Drizzle
    // This script is just for testing connection
    
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

initDatabase();
