'use strict';

const crypto = require('crypto');
const CryptoJS = require('crypto-js');

// Get encryption key from environment or generate a default (NOT RECOMMENDED FOR PRODUCTION)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const ALGORITHM = 'aes-256-cbc';

/**
 * Encrypt sensitive data (mnemonic, private keys)
 */
function encrypt(text) {
  if (!text) return null;
  
  try {
    const encrypted = CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
    return encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt sensitive data
 */
function decrypt(encryptedText) {
  if (!encryptedText) return null;
  
  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedText, ENCRYPTION_KEY);
    const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);
    return decryptedText;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Hash data (one-way, for fingerprints)
 */
function hash(text) {
  if (!text) return null;
  return crypto.createHash('sha256').update(text).digest('hex');
}

/**
 * Hash admin ID for secure response
 */
function hashAdminId(adminId) {
  if (!adminId) return null;
  // Hash the admin ID with a salt for security
  const salt = process.env.ENCRYPTION_KEY || 'default-salt';
  return crypto.createHash('sha256').update(`${adminId}-${salt}`).digest('hex');
}

module.exports = {
  encrypt,
  decrypt,
  hash,
  hashAdminId,
  ENCRYPTION_KEY, // Export for reference (should be set in .env)
};

