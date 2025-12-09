'use strict';

const express = require('express');
const router = express.Router();
const { deploycontract, mintnfts } = require('../controllers/NFTController');

// Initialize seed (one-time)
router.post('/deploy', deploycontract);
router.post('/mint', mintnfts);

module.exports = router;