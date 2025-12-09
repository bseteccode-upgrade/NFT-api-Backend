'use strict';

/**
 * Admin Authentication Controller
 * 
 * Handles admin authentication operations.
 * Admin credentials from env are stored in DB, and this endpoint retrieves admin info with JWT token.
 */

const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const Admin = require('../models/Admin');
const { hashAdminId } = require('../utils/encryption');
const { JWT_SECRET } = require('../middleware/adminAuthMiddleware');

/**
 * Validate email format
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Check if any admin exists in database
 */
async function checkIfAnyAdminExists() {
  const count = await Admin.count({ where: { isActive: true } });
  return count > 0;
}

/**
 * Get the first admin (super admin) from database
 */
async function getSuperAdmin() {
  const admin = await Admin.findOne({
    where: { isActive: true },
    order: [['id', 'ASC']], // Get the first admin (super admin)
    attributes: ['id', 'email'],
  });
  return admin;
}

/**
 * Generate JWT token for a given admin
 * Token never expires (no expiration time set)
 */
function generateJWTTokenForAdmin(admin) {
  const token = jwt.sign(
    { adminId: admin.id, email: admin.email, role: 'admin' },
    JWT_SECRET
    // No expiresIn option - token never expires
  );
  return token;
}

/**
 * Get JWT token from environment or generate new one
 * If ADMIN_JWT_TOKEN is set in env, use it
 * Otherwise, generate new token for the admin
 */
async function getJWTToken(admin) {
  // Check if token is set in environment
  const envToken = process.env.ADMIN_JWT_TOKEN;
  
  if (envToken) {
    // Use token from environment
    return envToken;
  }
  
  // Generate new token for the admin
  return generateJWTTokenForAdmin(admin);
}

/**
 * Add new admin (email only)
 * POST /admin/auth/add
 * 
 * Creates a new admin with only email.
 * - If this is the first admin (super admin), generates JWT token and returns it
 * - If admins already exist, uses ADMIN_JWT_TOKEN from environment
 * Returns hashed admin ID and JWT token.
 */
async function addAdmin(req, res, next) {
  try {
    const { email } = req.body;

    // Validation
    if (!email) {
      return res.status(400).json({
        error: 'Email is required',
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        error: 'Invalid email format',
      });
    }

    // Check if admin with this email already exists
    const existingAdmin = await Admin.findOne({
      where: { email: email.toLowerCase() },
    });

    if (existingAdmin) {
      return res.status(409).json({
        error: 'Admin already exists',
        message: 'An admin with this email already exists.',
      });
    }

    // Check if this is the first admin (super admin)
    const isFirstAdmin = !(await checkIfAnyAdminExists());

    // Create admin with only email
    const admin = await Admin.create({
      email: email.toLowerCase(),
      isActive: true,
    });

    let token;
    let isSuperAdmin = false;

    if (isFirstAdmin) {
      // First admin = Super admin - Generate new JWT token
      token = generateJWTTokenForAdmin(admin);
      isSuperAdmin = true;
    } else {
      // Subsequent admins - Use token from environment
      const superAdmin = await getSuperAdmin();
      if (!superAdmin) {
        return res.status(500).json({
          error: 'Super admin not found',
          message: 'Unable to retrieve super admin for token generation.',
        });
      }
      token = await getJWTToken(superAdmin);
    }

    // Hash the current admin's ID for secure response
    const hashedAdminId = hashAdminId(admin.id);

    const response = {
      success: true,
      message: isSuperAdmin 
        ? 'Super admin created successfully. Please set ADMIN_JWT_TOKEN in your .env file with the token below.'
        : 'Admin created successfully',
      admin: {
        hashedId: hashedAdminId,
        email: admin.email,
        isActive: admin.isActive,
        createdAt: admin.createdAt,
        isSuperAdmin,
      },
      token,
      expiresIn: null, // Token never expires
    };

    if (isSuperAdmin) {
      response.note = 'This is the super admin. Set ADMIN_JWT_TOKEN=' + token + ' in your .env file for subsequent admin operations.';
    }

    return res.status(201).json(response);
  } catch (error) {
    // Handle Sequelize unique constraint errors
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        error: 'Admin already exists',
        message: 'An admin with this email already exists.',
      });
    }
    next(error);
  }
}

/**
 * Get admin user info with JWT token
 * GET /admin/auth/user?email=admin@example.com
 * 
 * Retrieves admin info by email and returns JWT token.
 * Uses ADMIN_JWT_TOKEN from environment if set, otherwise generates new token.
 * No authentication required - this is the entry point to get admin token.
 */
async function getAdminUser(req, res, next) {
  try {
    // Get email from query parameter or request body
    const email = req.query?.email || req.body?.email;
    // Validation
    if (!email) {
      return res.status(400).json({
        error: 'Email is required',
        message: 'Please provide an email address as query parameter: ?email=admin@example.com',
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        error: 'Invalid email format',
        message: 'Please provide a valid email address.',
      });
    }

    // Find admin by email
    const admin = await Admin.findOne({
      where: { 
        email: email.toLowerCase(),
        isActive: true 
      },
      attributes: ['id', 'email', 'isActive', 'createdAt', 'updatedAt'],
    });

    if (!admin) {
      return res.status(404).json({
        error: 'Admin not found',
        message: 'No admin found with this email address.',
      });
    }

    // Check if this is the super admin (first admin)
    const superAdmin = await getSuperAdmin();
    const isSuperAdmin = superAdmin && superAdmin.id === admin.id;

    // Get JWT token from environment or generate new one
    // Use super admin for token generation (all admins share same token)
    const token = await getJWTToken(superAdmin || admin);

    // Hash the admin ID for secure response
    const hashedAdminId = hashAdminId(admin.id);

    return res.json({
      success: true,
      admin: {
        hashedId: hashedAdminId,
        email: admin.email,
        isActive: admin.isActive,
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt,
        isSuperAdmin: isSuperAdmin || false,
      },
      token,
      expiresIn: null, // Token never expires
    });
  } catch (error) {
    if (error.message && error.message.includes('not found')) {
      return res.status(404).json({
        error: 'Admin not found',
        message: error.message,
      });
    }
    next(error);
  }
}

/**
 * Verify token validity
 * GET /admin/auth/verify
 * Requires authentication
 */
async function verifyAdminToken(req, res, next) {
  try {
    // If we reach here, token is valid (authenticateAdmin middleware passed)
    return res.json({
      success: true,
      message: 'Token is valid',
      admin: req.admin,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  addAdmin,
  getAdminUser,
  verifyAdminToken,
};

