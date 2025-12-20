'use strict';

const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

/**
 * @dev Create a Sequelize instance
 * - Uses environment variables when available
 * - Falls back to sensible defaults for local development
 */
const sequelize = new Sequelize(
  process.env.DB_NAME || 'eth_accounts',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'postgres',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

/**
 * @dev Test database connectivity
 * @returns {Promise<boolean>} true if connected, false otherwise
 */
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    return false;
  }
}

/**
 * @dev Synchronize Sequelize models with database
 * @param {boolean} force - If true, drops and recreates tables (DANGEROUS)
 * @returns {Promise<boolean>} true if sync successful
 */
async function syncDatabase(force = false) {
  try {
    await sequelize.sync({ force });
    console.log('✅ Database synchronized successfully.');
    return true;
  } catch (error) {
    console.error('❌ Error synchronizing database:', error);
    return false;
  }
}

module.exports = {
  sequelize,
  testConnection,
  syncDatabase,
};

