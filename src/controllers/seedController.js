'use strict';

const Seed = require('../models/Seed');
const { encrypt } = require('../utils/encryption');
const { generateMnemonic } = require('../utils/seed');
const { decrypt } = require('../utils/encryption');
/**
 * Initialize seed (one-time operation)
 */
async function initSeed(req, res, next) {
  try {
    const existingSeed = await Seed.findOne();
    if (existingSeed) {
      return res.status(409).json({
        error: 'Seed already initialized.',
      });
    }

    // Generate new mnemonic
    const mnemonic = generateMnemonic();
    const encryptedMnemonic = encrypt(mnemonic);
    const seed = await Seed.create({
      encryptedMnemonic,
    });

    return res.status(201).json({
      message: 'Master seed created and stored securely.',
      mnemonic: mnemonic,
      createdAt: seed.createdAt,
      note: 'Seed is encrypted and stored in database.',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get seed status
 */
async function getSeedStatus(req, res, next) {
  try {
    const seed = await Seed.findOne();
    
    if (!seed) {
      return res.json({
        initialized: false,
        source: null,
      });
    }

    return res.json({
      initialized: true,
      source: 'database',
      lastIndex: seed.lastIndex,
      totalAccounts: seed.lastIndex + 1, 
      createdAt: seed.createdAt,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get decrypted mnemonic (internal use only - never expose via API)
 * Priority: 1. MASTER_MNEMONIC from env, 2. Decrypted from database
 */
async function getDecryptedMnemonic() {
  try {
    const envMnemonic = process.env.MASTER_MNEMONIC && String(process.env.MASTER_MNEMONIC).trim();
    if (envMnemonic) {
      return envMnemonic;
    }

    const seed = await Seed.findOne();
    if (!seed) {
      return null;
    }
    return decrypt(seed.encryptedMnemonic);
  } catch (error) {
    console.error('Error getting mnemonic:', error);
    return null;
  }
}

module.exports = {
  initSeed,
  getSeedStatus,
  getDecryptedMnemonic,
};

