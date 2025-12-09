
'use strict';
const fs = require("fs");
const pinataSDK = require("@pinata/sdk");
const dotenv = require('dotenv');
dotenv.config();
const pinata = new pinataSDK({
  pinataJWTKey: process.env.PINATA_JWT
});
const { generateCustomTimestamp } = require('../utils/seed');


/**
 * Uploads the image to ipfs network using pinata
 */
async function uploadToIPFS(req, res) {
  try {
    console.log("HEADERS:", req.headers);
    console.log("BODY:", req.body);

    // --- AUTH ---
    const adminId = req.headers['x-application-vkn'];

    // Validate admin ID
    if (!adminId) {
      return res.status(400).json({
        error: 'Admin ID is required',
        message: 'Please provide x-application-vkn in the request header: x-application-vkn: hashed-admin-id',
      });
    }

    // Verify hashed admin ID exists in database
    const admin = await verifyHashedAdminId(adminId, Admin);
    if (!admin) {
      return res.status(401).json({
        error: 'Invalid admin ID',
        message: 'The provided admin ID is invalid or does not exist.',
      });
    }

    // --- INPUT VALIDATION ---
    const filename = req.body.filename;
    const file = req.file;

    if (!filename || !file) {
      return res.status(400).json({ error: "filename and file are required" });
    }

    if (typeof filename !== "string") {
      return res.status(400).json({ error: "filename must be a string" });
    }

    const filepath = file.path;

    // --- UPLOAD TO PINATA ---
    const stream = fs.createReadStream(filepath);

    const result = await pinata.pinFileToIPFS(stream, {
      pinataMetadata: { name: filename },
    });

    return res.status(201).json({
      hash: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`,
    });

  } catch (err) {
    console.error("Upload Error:", err);
    return res.status(503).json({ error: "Upload failed" });
  }
}


/**
 * Uploads the metada to ipfs network using pinata
 */
async function uploadMetadataToIPFS(req, res) {
  try {
    const appKey = req.headers["authorization"]?.replace("Bearer ", "");
    const appId = req.headers["x-application-vkn"];

    if (!appKey || !appId) {
      return res.status(400).json({ error: "Missing appKey or appId in headers" });
    }

    if (appKey !== process.env.MY_APP_KEY || appId !== process.env.MY_APP_ID) {
      return res.status(401).json({ error: "Unauthorized client" });
    }

    // Validate metadata
    const metadata = req.body;

    if (!metadata || typeof metadata !== "object") {
      return res.status(400).json({ error: "Invalid metadata JSON" });
    }
    // --- REQUIRED FIELDS ---
    const requiredFields = ["name", "image", "description", "attributes"];

    for (let f of requiredFields) {
      if (!metadata[f]) {
        return res.status(400).json({ error: `${f} field is required` });
      }
    }

    // --- TYPE VALIDATIONS ---
    const stringFields = [
      "name",
      "image",
      "description",
      "edition",
      "external_url",
      "animation_url",
    ];

    for (let f of stringFields) {
      if (metadata[f] && typeof metadata[f] !== "string") {
        return res.status(400).json({ error: `${f} must be a string` });
      }
    }

    // --- ATTRIBUTES VALIDATION ---
    if (!Array.isArray(metadata.attributes)) {
      return res.status(400).json({ error: "attributes must be an array" });
    }

    for (let i = 0; i < metadata.attributes.length; i++) {
      const attr = metadata.attributes[i];

      if (!attr.trait_type) {
        return res.status(400).json({ error: `attributes[${i}].trait_type is required` });
      }
      if (!attr.value) {
        return res.status(400).json({ error: `attributes[${i}].value is required` });
      }

      if (typeof attr.trait_type !== "string") {
        return res.status(400).json({ error: `attributes[${i}].trait_type must be a string` });
      }

      if (attr.display_type && typeof attr.display_type !== "string") {
        return res.status(400).json({ error: `attributes[${i}].display_type must be a string` });
      }

      if (attr.max_value && typeof attr.max_value !== "number") {
        return res.status(400).json({ error: `attributes[${i}].max_value must be an integer` });
      }
    }

    // --- DATA FIELD VALIDATION ---
    if (metadata.data && typeof metadata.data !== "object") {
      return res.status(400).json({ error: "data must be a JSON object" });
    }

    // Upload to Pinata
    const result = await pinata.pinJSONToIPFS(metadata, {
      pinataMetadata: {
        name: metadata.name || "metadata.json",
      },
    });

    const cid = result.IpfsHash;
    const pinSize = Buffer.byteLength(JSON.stringify(metadata));
    const gatewayURL = `https://gateway.pinata.cloud/ipfs/${cid}`;
    const timestamp = generateCustomTimestamp();


    return res.status(201).json({
      IpfsHash: gatewayURL,
      PinSize: pinSize,
      Timestamp: timestamp
    });

  } catch (err) {
    console.error("Pinata Metadata Upload Error:", err);
    return res.status(503).json({ error: "Pinata service error" });
  }
};


module.exports = {
  uploadToIPFS,
  uploadMetadataToIPFS,
};

