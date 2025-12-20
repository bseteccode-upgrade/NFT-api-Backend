'use strict';

const express = require('express');
const router = express.Router();

const {
  getTransactionDetails,
  getTransactionStatus,
  getTokenIdsFromTransaction,
} = require('../controllers/transactionDetailsController');
const { authenticateAdmin } = require('../middleware/adminAuthMiddleware');

// Protect all transaction routes with admin authentication
router.use(authenticateAdmin);

// GET /get_Transaction_status/:txHash - Check transaction status (must be before /:txHash route)
router.get('/txInfo/:txHash', getTransactionStatus);

// GET /get_Transaction_details/token-ids/:txHash - Get token IDs from transaction
router.get('/token-ids/:txHash', getTokenIdsFromTransaction);

// GET /get_Transaction_details/:txHash - Get full transaction details
router.get('/:txHash', getTransactionDetails);

module.exports = router;

