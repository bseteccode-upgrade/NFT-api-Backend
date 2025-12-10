'use strict';
const { verifyHashedAdminId } = require('../utils/encryption');

const getRpcParams = (method, txHash, id) => {
    const body = {
        jsonrpc: '2.0',
        method: method,
        params: [txHash],
        id: id,
    };
    return body
}

const getRpcResponse = async (rpcUrl, body) => {
    const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    return response
}

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