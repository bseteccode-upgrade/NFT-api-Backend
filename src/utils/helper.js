'use strict';
/**
 * ABI Imports
 * -----------
 * - ERC721A versions (gas-optimized batch minting)
 * - Standard ERC721 versions (fallback / legacy support)
 */
const Factory = require("../abi/ERC721A/Factory.json").abi;
const Nft = require("../abi/ERC721A/NFTBatch.json").abi;
const factory = require("../abi/ERC721/Factory.json").abi;
const nft = require("../abi/ERC721/NFTBatch.json").abi;
const { ethers } = require("ethers");

/**
 * Get smart contract instance based on:
 * - Network (Arbitrum Sepolia / Arbitrum Nova)
 * - ERC721 vs ERC721A
 * - Factory or NFT contract
 *
 * @param {string} network - Chain ID (e.g. "42170" for Arbitrum Nova)
 * @param {string} contractAddress - NFT contract address (empty = Factory)
 * @returns {ethers.Contract} Connected contract instance with signer
 */
async function getcontractconnection(network, contractAddress) {
    const trust = process.env.IS_ERC721A === "true" ? "truue" : "false"
    console.log(trust, '-------------------trust')
    const factory_abi = process.env.IS_ERC721A === "true" ? Factory : factory;
    const nft_abi = process.env.IS_ERC721A === "true" ? Nft : nft;
    const Address = contractAddress === "" ? process.env.FACTORY_ADDRESS : contractAddress;
    const abi = contractAddress === "" ? factory_abi : nft_abi;
    const rpc_url = network === "42170" ? process.env.ARBITRUM_NOVA_RPC_URL : process.env.ARBITRUM_RPC_URL;
    const provider = new ethers.JsonRpcProvider(rpc_url);
    const wallet = new ethers.Wallet(process.env.ARBITRUM_PRIVATE_KEY, provider);
    const contract = new ethers.Contract(Address, abi, wallet);
    console.log(rpc_url, process.env.ARBITRUM_PRIVATE_KEY, Address, '-------------list')
    console.log(network, contract, 'NETWORK')
    return contract;
}

/**
 * Safely convert objects containing BigInt values into JSON
 *
 * Problem:
 * - JSON.stringify does NOT support BigInt
 *
 * @param {Object} obj
 * @returns {Object} JSON-safe object
 */
function toJSON(obj) {
    return JSON.parse(
        JSON.stringify(obj, (key, value) =>
            typeof value === "bigint" ? value.toString() : value
        )
    );
}

module.exports = {
    getcontractconnection, toJSON
};