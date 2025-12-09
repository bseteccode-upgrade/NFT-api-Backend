'use strict';

const express = require('express');
const dotenv = require('dotenv');
const helmet = require('helmet');
const morgan = require('morgan');
const cors = require('cors');
const bodyParser = require('body-parser');

// Load environment variables
dotenv.config();

// Import database and models
const { sequelize, testConnection, syncDatabase } = require('./config/database');

// Import models to ensure they are registered with Sequelize
require('./models/Seed');
require('./models/Admin');

// Import routes
const seedRoutes = require('./routes/seedRoutes');
const accountRoutes = require('./routes/accountRoutes');
const adminAuthRoutes = require('./routes/adminAuthRoutes');
const TransactionDetailRoutes = require('./routes/transactionDetailsRoutes')
const uploadRoutes = require("./routes/ipfsRoutes");

// Import middleware
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const PORT = Number(process.env.PORT || 3000);

// API Routes
app.use('/seed', seedRoutes);
app.use('/generateAddress', accountRoutes);
app.use('/getTransactionDetails', TransactionDetailRoutes);
app.use('/admin/auth', adminAuthRoutes);
app.use("/upload", uploadRoutes);


// Error handling middleware (must be last)
app.use(errorHandler);

// Initialize database connection and start server
async function startServer() {
  try {
    const connected = await testConnection();
    if (!connected) {
      console.error('❌ Failed to connect to database. Please check your database configuration.');
      process.exit(1);
    }

    await syncDatabase(false);

    // Start server
    app.listen(PORT, () => {
      console.log(`✅ Server listening on http://0.0.0.0:${PORT}`);
      console.log(`📊 Database: ${process.env.DB_NAME || 'eth_accounts'}`);
      console.log(`🔐 Encryption: ${process.env.ENCRYPTION_KEY ? 'Configured' : 'Using default (NOT SECURE!)'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing database connection...');
  await sequelize.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing database connection...');
  await sequelize.close();
  process.exit(0);
});

// Start the server
startServer();

module.exports = app;
