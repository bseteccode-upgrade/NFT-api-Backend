'use strict';

/**
 * Admin JWT Authentication Middleware
 * 
 * This middleware verifies JWT tokens for admin users and attaches admin information to the request object.
 * Use this middleware to protect routes that require admin authentication.
 * 
 * Usage:
 *   router.get('/protected', authenticateAdmin, controllerFunction);
 */

const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

const JWT_SECRET = process.env.JWT_SECRET || process.env.ADMIN_JWT_SECRET || 'admin-secret-key-change-in-production';

/**
 * Authenticate admin JWT token
 * Extracts token from Authorization header and verifies it
 */
async function authenticateAdmin(req, res, next) {
  try {
    // Get token from Authorization header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    if (!token) {
      return res.status(401).json({
        error: 'Access denied. No token provided.',
        message: 'Please provide a valid JWT token in the Authorization header: Bearer <token>',
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      // TokenExpiredError won't occur since tokens don't expire
      // But we keep the check for backward compatibility with old tokens
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          error: 'Token expired',
          message: 'Your authentication token has expired. Please get a new token.',
        });
      } else if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          error: 'Invalid token',
          message: 'The provided token is invalid.',
        });
      }
      throw error;
    }

    // Get admin from database
    const admin = await Admin.findByPk(decoded.adminId);
    if (!admin) {
      return res.status(401).json({
        error: 'Admin not found',
        message: 'The admin associated with this token no longer exists.',
      });
    }

    // Check if admin is active
    if (!admin.isActive) {
      return res.status(403).json({
        error: 'Account disabled',
        message: 'Your admin account has been disabled.',
      });
    }

    // Attach admin to request object
    req.admin = {
      id: admin.id,
      adminId: admin.id,
      email: admin.email,
    };

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Optional authentication - doesn't fail if no token provided
 * Useful for routes that work with or without authentication
 */
async function optionalAdminAuth(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const admin = await Admin.findByPk(decoded.adminId);
        if (admin && admin.isActive) {
          req.admin = {
            id: admin.id,
            adminId: admin.id,
            email: admin.email,
          };
        }
      } catch (error) {
        // Ignore token errors for optional auth
      }
    }
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  authenticateAdmin,
  optionalAdminAuth,
  JWT_SECRET,
};

