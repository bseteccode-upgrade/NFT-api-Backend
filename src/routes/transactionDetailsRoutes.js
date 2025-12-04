'use strict';

const express = require('express');
const router = express.Router();

const {
  getTransactionDetails,
  getTransactionStatus,
} = require('../controllers/transactionDetailsController');

// GET /get_Transaction_status/:txHash - Check transaction status (must be before /:txHash route)
router.get('/status/:txHash', getTransactionStatus);

// GET /get_Transaction_details/:txHash - Get full transaction details
router.get('/:txHash', getTransactionDetails);

module.exports = router;

