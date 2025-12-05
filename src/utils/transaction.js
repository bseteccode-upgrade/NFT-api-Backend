'use strict';

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


module.exports = {
    getRpcParams,
    getRpcResponse,
};