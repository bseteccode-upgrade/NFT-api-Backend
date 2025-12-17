'use strict';
const Factory = require("../abi/Factory.json").abi;
const Nft = require("../abi/NFTBatch.json").abi;
const { ethers } = require("ethers");

async function getcontractconnection(network, contractAddress) {
    const Address = contractAddress === "" ? process.env.FACTORY_ADDRESS : contractAddress;
    const abi = contractAddress === "" ? Factory : Nft;
    const rpc_url = network === "42170" ? process.env.ARBITRUM_NOVA_RPC_URL : process.env.ARBITRUM_RPC_URL;
    const provider = new ethers.JsonRpcProvider(rpc_url);
    const wallet = new ethers.Wallet(process.env.ARBITRUM_PRIVATE_KEY, provider);
    const contract = new ethers.Contract(Address, abi, wallet);
    console.log(rpc_url, process.env.ARBITRUM_PRIVATE_KEY, Address, '-------------l0ist')
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