'use strict';

const express = require('express');
const router = express.Router();
const { deploycontract, mintnfts, settokenuris, gettokenuri, getbalance, getOwner, transfernft } = require('../controllers/NFTController');

const { authenticateAdmin } = require('../middleware/adminAuthMiddleware');

// Protect all transaction routes with admin authentication
router.use(authenticateAdmin);

router.post('/deploy', deploycontract);
router.post('/batchMint', mintnfts);
router.post('/tokenUriUpdateBatch', settokenuris);
router.post('/gettokenuri', gettokenuri);
router.post('/getbalance', getbalance);
router.post('/getowner', getOwner);
router.post('/transfer', transfernft);


module.exports = router;