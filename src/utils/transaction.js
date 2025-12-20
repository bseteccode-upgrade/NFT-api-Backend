'use strict';
/**
 * Utility to verify hashed admin IDs
 * Used to ensure only authorized admins can access sensitive APIs
 */
const { verifyHashedAdminId } = require('../utils/encryption');

/**
 * Build JSON-RPC request body
 *
 * @param {string} method - RPC method name (e.g. eth_getTransactionByHash)
 * @param {string} txHash - Ethereum transaction hash
 * @param {number} id - JSON-RPC request ID
 * @returns {Object} JSON-RPC formatted body
 */
const getRpcParams = (method, txHash, id) => {
    const body = {
        jsonrpc: '2.0',
        method: method,
        params: [txHash],
        id: id,
    };
    return body
}

/**
 * Send JSON-RPC request to the blockchain RPC endpoint
 *
 * @param {string} rpcUrl - RPC URL (Arbitrum Sepolia / Nova)
 * @param {Object} body - JSON-RPC request payload
 * @returns {Response|Error} Fetch response or error
 */
const getRpcResponse = async (rpcUrl, body) => {
    try {
        const response = await fetch(rpcUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        return response
    } catch (err) {
        return err
    }

}

/**
 * Validate admin access using hashed admin ID
 *
 * Flow:
 * 1. Check if admin ID exists in request headers
 * 2. Verify hashed admin ID against database
 *
 * @param {string} adminId - Hashed admin ID from x-api-key header
 * @param {Model} Admin - Admin database model
 * @returns {Object} Validation result with error/message
 */
const adminIdValidation = async (adminId, Admin) => {
    if (!adminId) {
        return {
            error: 'Admin ID is required',
            message: 'Please provide x-api-key in the request header: x-api-key: hashed-admin-id',
        };
    }

    // Verify hashed admin ID exists in database
    const admin = await verifyHashedAdminId(adminId, Admin);
    if (!admin) {
        return {
            error: 'Invalid admin ID',
            message: 'The provided admin ID is invalid or does not exist.',
        };
    }
    return {
        error: "",
        message: "",
    }

}


module.exports = {
    getRpcParams,
    getRpcResponse,
    adminIdValidation,
};