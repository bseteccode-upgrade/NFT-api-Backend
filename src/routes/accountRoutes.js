'use strict';

const express = require('express');
const router = express.Router();
const {
  createAccount,
} = require('../controllers/accountController');

// Create next account (auto-increment index)
router.get('/', createAccount);

module.exports = router;

