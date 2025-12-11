'use strict';

const { getcontractconnection } = require("../utils/helper")
const Nft = require("../abi/NFTBatch.json").abi;
const Admin = require('../models/Admin');
const { adminIdValidation } = require('../utils/transaction')

async function deploycontract(req, res, next) {
    try {
        let { name, symbol, network } = req.body;
        // Get admin ID from header (x-api-key)
        const adminId = req.headers['x-api-key'];
        const getAdminvalidation = await adminIdValidation(adminId, Admin)

        if (getAdminvalidation.error !== "") {
            return res.status(401).json({
                error: getAdminvalidation.error,
                message: getAdminvalidation.message
            })
        }
        if (!name || !symbol) {
            return res.status(400).json({ error: "name & symbol are required" });
        }
        if (!network) {
            network = process.env.ARBITRUM_SEPOLIA_CHAINID
        }
        const factory = await getcontractconnection(network, '')
        const tx = await factory.createClone(name, symbol);
        console.log("Tx sent:", tx.hash);
        const receipt = await tx.wait();
        console.log("Tx confirmed:", receipt.hash);
        const event = receipt.logs
            .map(log => {
                try { return factory.interface.parseLog(log); }
                catch { return null; }
            })
            .find(e => e && e.name === "CloneCreated");

        const cloneAddress = event?.args?.cloneAddress;
        if (!cloneAddress) {
            console.error(" CloneCreated event NOT found!");

            return res.status(500).json({
                status: false,
                message: "Clone creation failed — event not emitted",
                txhash: tx.hash,
                logs: receipt.logs.map(l => l.topics)
            });
        }

        return res.json({
            status: true,
            message: "Clone created successfully",
            cloneAddress,
            txhash: tx.hash
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: err.message });
    }
}

async function mintnfts(req, res) {
    try {
        let { contractAddress, recipientAddress, ipfsUri, network } = req.body;
        console.log(req.body, '------------body');
        // Get admin ID from header (x-api-key)
        const adminId = req.headers['x-api-key'];
        const getAdminvalidation = await adminIdValidation(adminId, Admin)
        console.log(adminId, getAdminvalidation, '-------------------------AdminID')
        if (getAdminvalidation.error !== "") {
            return res.status(401).json({
                error: getAdminvalidation.error,
                message: getAdminvalidation.message
            })
        }
        if (!contractAddress || recipientAddress.length <= 0 || ipfsUri.length <= 0) {
            return res.status(400).json({ status: false, error: "Contract Address , recipient Address , tokenuris are required" });
        }
        if (recipientAddress.length !== ipfsUri.length) {
            return res.status(400).json({ status: false, error: "Reciepient address and the token uri doesn't match" });
        }
        if (!network) {
            network = process.env.ARBITRUM_SEPOLIA_CHAINID
        }

        const nftcontract = await getcontractconnection(network, contractAddress)

        const tx = await nftcontract.mintToMany(recipientAddress, ipfsUri)
        console.log("Tx sent:", tx.hash);
        const receipt = await tx.wait();
        console.log(receipt, '---------------------------Logs of the reciept')
        console.log(tx, '---------------------------tx')
        console.log("Tx confirmed:", receipt.hash);
        const event = receipt.logs
            .map(log => {
                try { return nftcontract.interface.parseLog(log); }
                catch { return null }
            })
            .find(e => e && e.name === "BatchMinted");
        if (!event) {
            console.error(" BatchMinted event NOT found!");
            return res.status(500).json({
                status: false,
                message: "Batch Mint failed — event not emitted",
                txhash: tx.hash,
                logs: receipt.logs.map(l => l.topics)
            });
        }
        console.log(event?.args, '------------___Argument')
        const recievers = event?.args.receivers
        const tokenIDs = event?.args.tokenIds
        return res.json({
            status: true,
            message: "Nft Minted successfully",
            recievers,
            tokenIDs,
            txhash: tx.hash
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: err.message });
    }
}

async function settokenuris(req, res) {
    try {
        let { contractAddress, tokenIds, ipfsUris, network } = req.body;
        console.log(req.body, '------------body');
        const adminId = req.headers['x-api-key'];
        const getAdminvalidation = await adminIdValidation(adminId, Admin)
        console.log(adminId, getAdminvalidation, '-------------------------AdminID')
        if (getAdminvalidation.error !== "") {
            return res.status(401).json({
                error: getAdminvalidation.error,
                message: getAdminvalidation.message
            })
        }
        if (!contractAddress || tokenIds.length <= 0 || ipfsUris.length <= 0) {
            return res.status(400).json({ status: false, error: "Contract Address , TokenIds , tokenuris are required" });
        }
        if (tokenIds.length !== ipfsUris.length) {
            return res.status(400).json({ status: false, error: "Token Ids and the Token uris doesn't match" });
        }
        if (!network) {
            network = process.env.ARBITRUM_SEPOLIA_CHAINID
        }

        const nftcontract = await getcontractconnection(network, contractAddress)
        const tx = await nftcontract.setTokenURI(tokenIds, ipfsUris)
        console.log("Tx sent:", tx.hash);
        const receipt = await tx.wait();
        console.log(receipt, '---------------------------Logs of the reciept')
        console.log(tx, '---------------------------tx')
        console.log("Tx confirmed:", receipt.hash);
        const event = receipt.logs
            .map(log => {
                try { return nftcontract.interface.parseLog(log); }
                catch { return null }
            })
            .find(e => e && e.name === "ReplacedTokenUris");
        if (!event) {
            console.error(" ReplacedTokenUris event NOT found!");
            return res.status(500).json({
                status: false,
                message: "Replacing TokenUris failed — event not emitted",
                txhash: tx.hash,
                logs: receipt.logs.map(l => l.topics)
            });
        }
        console.log(event?.args, '------------___Argument')
        const tokenuris = event?.args.tokenuris
        const tokenIDs = event?.args.tokenIds
        return res.json({
            status: true,
            message: "Token Uris Replaced successfully",
            tokenuris,
            tokenIDs,
            txhash: tx.hash
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: err.message });
    }
}


module.exports = {
    deploycontract,
    mintnfts,
    settokenuris
};

