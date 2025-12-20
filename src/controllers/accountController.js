'use strict';

const { default: Wallet } = require('ethereumjs-wallet');


/**
 * @dev Create a new Ethereum account
 * 1. Generate a random Ethereum wallet
 * 2. Extract public address
 * 3. Extract private key
 * 4. Return both in the response
 */
async function createAccount(req, res, next) {
  try {
    var myWallet = Wallet.generate();
    var myAddress = myWallet.getAddressString();
    var myPrivate = myWallet.getPrivateKeyString();

    return res.json({
      address: myAddress,
      private: myPrivate,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createAccount,
};

