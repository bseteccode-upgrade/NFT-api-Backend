'use strict';

const express = require('express');
const router = express.Router();
const { deploycontract, mintnfts, settokenuris } = require('../controllers/NFTController');

const { authenticateAdmin } = require('../middleware/adminAuthMiddleware');

// Protect all transaction routes with admin authentication
router.use(authenticateAdmin);

router.post('/deploy', deploycontract);
router.post('/mint', mintnfts);
router.post('/settoken', settokenuris);

module.exports = router;