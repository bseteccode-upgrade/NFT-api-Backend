'use strict';

const { default: Wallet } = require('ethereumjs-wallet');


/**
 * Create next account with auto-incremented index
 * Only stores the index, not the account details
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

