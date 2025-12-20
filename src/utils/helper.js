'use strict';
const Factory = require("../abi/ERC721A/Factory.json").abi;
const Nft = require("../abi/ERC721A/NFTBatch.json").abi;
const factory = require("../abi/ERC721/Factory.json").abi;
const nft = require("../abi/ERC721/NFTBatch.json").abi;
const { ethers } = require("ethers");

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