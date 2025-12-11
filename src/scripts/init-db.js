'use strict';

/**
 * Database initialization script
 * Run this to create tables: node src/scripts/init-db.js
 */

const { sequelize, testConnection, syncDatabase } = require('../config/database');

// Import models to ensure they are registered with Sequelize
require('../models/Admin');

async function initializeDatabase() {
  try {
    console.log('🔄 Initializing database...');
    
    const connected = await testConnection();
    if (!connected) {
      console.error('❌ Database connection failed. Please check your .env configuration.');
      process.exit(1);
    }

    // Sync database (create tables)
    // WARNING: Set force: true will DROP all existing tables!
    const force = process.argv.includes('--force');
    if (force) {
      console.warn('⚠️  WARNING: --force flag detected. This will DROP all existing tables!');
    }

    await syncDatabase(force);
    
    console.log('✅ Database initialized successfully!');
    console.log('📋 Tables created:');
    console.log('   - admin_users (for admin authentication)');
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

initializeDatabase();

