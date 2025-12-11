'use strict';

const express = require('express');
const router = express.Router();

const {
  addAdmin,
  getAdminUser,
  verifyAdminToken,
} = require('../controllers/adminAuthController');

const { authenticateAdmin } = require('../middleware/adminAuthMiddleware');

// Public route - Add new admin (email only, returns hashed admin ID and JWT token)
router.post('/add', addAdmin);

// Public route - Get admin user info and JWT token (no authentication required)
// Accepts email as query parameter (GET)
// Returns admin's hashed ID and JWT token
router.get('/user', getAdminUser);

// Protected route (require authentication) - Verify token validity
router.get('/verify', authenticateAdmin, verifyAdminToken);

module.exports = router;

