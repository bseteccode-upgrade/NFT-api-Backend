'use strict';
const express = require('express');
const router = express.Router();
const upload = require("../utils/multerConfig");
const {uploadToIPFS,uploadMetadataToIPFS } = require("../controllers/ipfsController");

const { authenticateAdmin } = require('../middleware/adminAuthMiddleware');

// Protect all transaction routes with admin authentication
router.use(authenticateAdmin);
// Upload IPFS image to pinata
// Accept multipart/form-data; Python client is sending both `file` and `filename` inside `files`
router.post('/ipfs-image', upload.any(), uploadToIPFS);
// Upload metadata to pinata
router.post('/ipfs-metadata', uploadMetadataToIPFS);

module.exports = router;


