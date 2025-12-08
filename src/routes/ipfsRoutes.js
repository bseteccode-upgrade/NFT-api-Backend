'use strict';
const express = require('express');
const router = express.Router();
const upload = require("../utils/multerConfig");
const {uploadToIPFS,uploadMetadataToIPFS } = require("../controllers/ipfsController");


// Upload IPFS image to pinata
router.post('/ipfs-image', upload.single("file"), uploadToIPFS);
// Upload metadata to pinata
router.post('/ipfs-metadata', uploadMetadataToIPFS);

module.exports = router;


