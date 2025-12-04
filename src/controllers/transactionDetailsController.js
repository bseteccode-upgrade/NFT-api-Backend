'use strict';

/**
 * Get transaction details from Arbitrum Sepolia RPC node
 *
 * Endpoint (via router prefix):
 *   GET /get_Transaction_details/:txHash
 *
 * Env variables:
 *   ARBITRUM_RPC_URL - required, your Arbitrum Sepolia RPC URL
 */

function isValidTxHash(hash) {
  return typeof hash === 'string' && /^0x[a-fA-F0-9]{64}$/.test(hash);
}

async function getTransactionDetails(req, res, next) {
  try {
    const { txHash } = req.params;

    if (!txHash || !isValidTxHash(txHash)) {
      return res.status(400).json({
        error: 'Invalid transaction hash. Expected 0x-prefixed 66-character hex string.',
      });
    }

    const rpcUrl = process.env.ARBITRUM_RPC_URL;
    if (!rpcUrl) {
      return res.status(500).json({
        error: 'ARBITRUM_RPC_URL is not configured in environment.',
      });
    }

    const body = {
      jsonrpc: '2.0',
      method: 'eth_getTransactionByHash',
      params: [txHash],
      id: 1,
    };

    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return res.status(502).json({
        error: 'Failed to fetch transaction details from RPC node.',
        status: response.status,
      });
    }

    const data = await response.json();
    console.log("data============= : ", data);
    if (data.error) {
      return res.status(502).json({
        error: 'RPC node returned error.',
        details: data.error,
      });
    }

    if (!data.result) {
      return res.status(404).json({
        error: 'Transaction not found.',
        raw: data,
      });
    }

    const tx = data.result;

    return res.json({
      txHash,
      network: 'arbitrum-sepolia',
      raw: tx,
      from: tx.from,
      to: tx.to,
      value: tx.value,
      blockNumber: tx.blockNumber,
      gas: tx.gas,
      gasPrice: tx.gasPrice,
      nonce: tx.nonce,
      input: tx.input,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get transaction status (confirmed, failed, or pending)
 *
 * Endpoint (via router prefix):
 *   GET /get_Transaction_status/:txHash
 *
 * Env variables:
 *   ARBITRUM_RPC_URL - required, your Arbitrum Sepolia RPC URL
 */
async function getTransactionStatus(req, res, next) {
  try {
    const { txHash } = req.params;
    console.log("req.params============ : ", req.params)

    if (!txHash || !isValidTxHash(txHash)) {
      return res.status(400).json({
        error: 'Invalid transaction hash. Expected 0x-prefixed 66-character hex string.',
      });
    }

    const rpcUrl = process.env.ARBITRUM_RPC_URL;
    if (!rpcUrl) {
      return res.status(500).json({
        error: 'ARBITRUM_RPC_URL is not configured in environment.',
      });
    }

    // First, check if transaction exists
    const txBody = {
      jsonrpc: '2.0',
      method: 'eth_getTransactionByHash',
      params: [txHash],
      id: 1,
    };

    const txResponse = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(txBody),
    });

    if (!txResponse.ok) {
      return res.status(502).json({
        error: 'Failed to fetch transaction from RPC node.',
        status: txResponse.status,
      });
    }

    const txData = await txResponse.json();

    if (txData.error) {
      return res.status(502).json({
        error: 'RPC node returned error.',
        details: txData.error,
      });
    }

    if (!txData.result) {
      return res.json({
        txHash,
        status: 'not_found',
        message: 'Transaction not found on the network.',
      });
    }

    const tx = txData.result;

    // If transaction exists but not in a block yet, it's pending
    if (!tx.blockNumber || tx.blockNumber === null) {
      return res.json({
        txHash,
        status: 'pending',
        message: 'Transaction is pending and not yet included in a block.',
        from: tx.from,
        to: tx.to,
        value: tx.value,
      });
    }

    const receiptBody = {
      jsonrpc: '2.0',
      method: 'eth_getTransactionReceipt',
      params: [txHash],
      id: 2,
    };
    const receiptResponse = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(receiptBody),
    });
    if (!receiptResponse.ok) {
      return res.status(502).json({
        error: 'Failed to fetch transaction receipt from RPC node.',
        status: receiptResponse.status,
      });
    }

    const receiptData = await receiptResponse.json();

    if (receiptData.error) {
      return res.status(502).json({
        error: 'RPC node returned error when fetching receipt.',
        details: receiptData.error,
      });
    }

    if (!receiptData.result) {
      return res.json({
        txHash,
        status: 'pending',
        message: 'Transaction is in a block but receipt not yet available.',
        blockNumber: tx.blockNumber,
      });
    }

    const receipt = receiptData.result;

    // Check receipt status: 0x0 = failed, 0x1 = succeeded
    const statusCode = receipt.status;
    const isSuccess = statusCode === '0x1' || statusCode === '0x01' || parseInt(statusCode, 16) === 1;

    return res.json({
      txHash,
      status: isSuccess ? 'confirmed' : 'failed',
      message: isSuccess
        ? 'Transaction confirmed and succeeded.'
        : 'Transaction confirmed but failed (reverted).',
      blockNumber: receipt.blockNumber,
      blockHash: receipt.blockHash,
      from: receipt.from,
      to: receipt.to,
      gasUsed: receipt.gasUsed,
      cumulativeGasUsed: receipt.cumulativeGasUsed,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getTransactionDetails,
  getTransactionStatus,
};