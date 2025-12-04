'use strict';

const express = require('express');
const router = express.Router();
const { initSeed, getSeedStatus } = require('../controllers/seedController');

// Initialize seed (one-time)
router.post('/init', initSeed);

// Get seed status
router.get('/status', getSeedStatus);

module.exports = router;

