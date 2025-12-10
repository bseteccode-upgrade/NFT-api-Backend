'use strict';

const express = require('express');
const router = express.Router();
const { deploycontract, mintnfts } = require('../controllers/NFTController');

const { authenticateAdmin } = require('../middleware/adminAuthMiddleware');

// Protect all transaction routes with admin authentication
router.use(authenticateAdmin);
// Initialize seed (one-time)
router.post('/deploy', deploycontract);
router.post('/mint', mintnfts);

module.exports = router;