'use strict';

const express = require('express');
const router = express.Router();
const { deploycontract, mintnfts, settokenuris } = require('../controllers/NFTController');

// Initialize seed (one-time)
router.post('/deploy', deploycontract);
router.post('/mint', mintnfts);
router.post('/settoken', settokenuris);

module.exports = router;