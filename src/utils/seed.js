'use strict';

const bip39 = require('bip39');

function generateMnemonic(strengthBits = 128) {
  return bip39.generateMnemonic(strengthBits);
}

function validateMnemonic(mnemonic) {
  return bip39.validateMnemonic(mnemonic);
}

module.exports = {
  generateMnemonic,
  validateMnemonic,
};

