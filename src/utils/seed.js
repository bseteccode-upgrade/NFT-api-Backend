'use strict';

const bip39 = require('bip39');

function generateMnemonic(strengthBits = 128) {
  return bip39.generateMnemonic(strengthBits);
}

function validateMnemonic(mnemonic) {
  return bip39.validateMnemonic(mnemonic);
}
function generateCustomTimestamp() {
  const now = new Date();

  const date = now.toISOString().split("T")[0]; 

  const time = now
    .toISOString()
    .split("T")[1]
    .replace("Z", "")
    .replace(":", ":") 
    .replace(":", ":");

  const nano = String(now.getMilliseconds()).padEnd(9, "0"); 

  const secondsSinceStart = (now.getTime() / 1000).toFixed(6);

  return `${date} ${time}${nano} +0000 UTC m=+${secondsSinceStart}`;
}


module.exports = {
  generateMnemonic,
  validateMnemonic,
  generateCustomTimestamp
};

