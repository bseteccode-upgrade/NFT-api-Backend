'use strict';

const Seed = require('../models/Seed');
const { deriveAccountFromMnemonic } = require('../utils/derivation');
const { getDecryptedMnemonic } = require('./seedController');
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
// async function createAccount(req, res, next) {
//   try {
//     // const mnemonic = await getDecryptedMnemonic();

//     // if (!mnemonic) {
//     //   return res.status(400).json({
//     //     error: 'Master seed not initialized. Initialize via POST /seed/init',
//     //   });
//     // }

//     // const seed = await Seed.findOne();
//     // if (!seed) {
//     //   return res.status(400).json({
//     //     error: 'Master seed not initialized. Initialize via POST /seed/init',
//     //   });
//     // }

//     // const nextIndex = seed.lastIndex + 1;
//     // const accountData = deriveAccountFromMnemonic(mnemonic, nextIndex);
//     // await seed.update({ lastIndex: nextIndex });

//     return res.json({
//       address: accountData.address,
//       privateKey: accountData.privatekey,
//     });
//   } catch (error) {
//     next(error);
//   }
// }


module.exports = {
  createAccount,
};

