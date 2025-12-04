'use strict';

const { ethers } = require('ethers');

function buildDerivationPath(index) {
  // BIP44 for Ethereum: m/44'/60'/0'/0/index
  return `m/44'/60'/0'/0/${index}`;
}

function deriveAccountFromMnemonic(mnemonic, index) {
  if (!Number.isInteger(index) || index < 0) {
    throw new Error('index must be a non-negative integer');
  }
  const path = buildDerivationPath(index);
  
  const mnemonicObj = ethers.Mnemonic.fromPhrase(mnemonic);
  const seed = mnemonicObj.computeSeed();
  const masterNode = ethers.HDNodeWallet.fromSeed(seed);
  const wallet = masterNode.derivePath(path);
  
  return {
    derivationPath: path,
    address: wallet.address,
    publicKey: wallet.publicKey,
    privateKey: wallet.privateKey,
  };
}

module.exports = {
  buildDerivationPath,
  deriveAccountFromMnemonic,
};

