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
const { ethers } = require('ethers');
const { getRpcParams, getRpcResponse, adminIdValidation } = require('../utils/transaction');
const Admin = require('../models/Admin');

function isValidTxHash(hash) {
  return typeof hash === 'string' && /^0x[a-fA-F0-9]{64}$/.test(hash);
}

async function getTransactionDetails(req, res, next) {
  try {
    const { txHash } = req.params;
    const rpcUrl = process.env.ARBITRUM_RPC_URL;

    // Get admin ID from header (x-api-key)
    const adminId = req.headers['x-api-key'];
    const getAdminvalidation = await adminIdValidation(adminId, Admin)

    if (getAdminvalidation.error !== "") {
      return res.status(401).json({
        error: getAdminvalidation.error,
        message: getAdminvalidation.message
      })
    }

    const validationError = erc721TransactionValidation(txHash, rpcUrl)

    if (validationError?.error) {
      return res.status(400).json({
        error: validationError.error,
      });
    }

    const body = getRpcParams("eth_getTransactionByHash", txHash, 1)
    const response = await getRpcResponse(rpcUrl, body)
    if (!response.ok) {
      return res.status(502).json({
        error: 'Failed to fetch transaction details from RPC node.',
        status: response.status,
      });
    }

    const data = await response.json();

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

    // Return the provided admin ID (already validated)
    return res.json({
      txHash,
      network: 'arbitrum-sepolia',
      adminId: adminId,
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
    const rpcUrl = process.env.ARBITRUM_RPC_URL;

    // Get admin ID from header (x-api-key)
    const adminId = req.headers['x-api-key'];
    const getAdminvalidation = await adminIdValidation(adminId, Admin)

    if (getAdminvalidation.error !== "") {
      return res.status(401).json({
        error: getAdminvalidation.error,
        message: getAdminvalidation.message
      })
    }

    const validationError = erc721TransactionValidation(txHash, rpcUrl)
    if (validationError?.error) {
      return res.status(400).json({
        error: validationError.error,
      });
    }
    // First, check if transaction exists
    const body = getRpcParams("eth_getTransactionByHash", txHash, 1)
    const txResponse = await getRpcResponse(rpcUrl, body)

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
        adminId: adminId,
      });
    }

    const tx = txData.result;

    // If transaction exists but not in a block yet, it's pending
    if (!tx.blockNumber || tx.blockNumber === null) {
      return res.json({
        txHash,
        status: 'pending',
        message: 'Transaction is pending and not yet included in a block.',
        adminId: adminId,
        from: tx.from,
        to: tx.to,
        value: tx.value,
      });
    }

    const receiptBody = getRpcParams("eth_getTransactionReceipt", txHash, 2)
    const receiptResponse = await getRpcResponse(rpcUrl, receiptBody)
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
        adminId: adminId,
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
      adminId: adminId,
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

/**
 * Get token IDs from a transaction hash (ERC-721 only)
 * Extracts token IDs from ERC-721 Transfer events
 *
 * Endpoint (via router prefix):
 *   GET /get_Transaction_details/token-ids/:txHash
 *
 * Env variables:
 *   ARBITRUM_RPC_URL - required, your Arbitrum Sepolia RPC URL
 */
async function getTokenIdsFromTransaction(req, res, next) {
  try {
    const { txHash } = req.params;
    const rpcUrl = process.env.ARBITRUM_RPC_URL;

    // Get admin ID from header (x-api-key)
    const adminId = req.headers['x-api-key'];
    const getAdminvalidation = await adminIdValidation(adminId, Admin)

    if (getAdminvalidation.error !== "") {
      return res.status(401).json({
        error: getAdminvalidation.error,
        message: getAdminvalidation.message
      })
    }

    const validationError = erc721TransactionValidation(txHash, rpcUrl)
    if (validationError?.error) {
      return res.status(400).json({
        error: validationError.error,
      });
    }

    // Get transaction receipt which contains logs
    const receiptBody = getRpcParams("eth_getTransactionReceipt", txHash, 1)
    const receiptResponse = await getRpcResponse(rpcUrl, receiptBody)

    if (!receiptResponse.ok) {
      return res.status(502).json({
        error: 'Failed to fetch transaction receipt from RPC node.',
        status: receiptResponse.status,
      });
    }

    const receiptData = await receiptResponse.json();

    if (receiptData.error) {
      return res.status(502).json({
        error: 'RPC node returned error.',
        details: receiptData.error,
      });
    }

    if (!receiptData.result) {
      return res.status(404).json({
        error: 'Transaction receipt not found. Transaction may be pending or not exist.',
      });
    }

    const receipt = receiptData.result;

    // Check if transaction failed
    const statusCode = receipt.status;
    const isSuccess = statusCode === '0x1' || statusCode === '0x01' || parseInt(statusCode, 16) === 1;

    if (!isSuccess) {
      return res.status(400).json({
        error: 'Transaction failed (reverted). No token transfers occurred.',
        txHash,
        status: 'failed',
      });
    }

    const logs = receipt.logs || [];

    if (logs.length === 0) {
      return res.json({
        txHash,
        adminId: adminId,
        tokenIds: [],
      });
    }

    const transferEventSignature = ethers.id("Transfer(address,address,uint256)");
    const tokenIds = [];

    for (const log of logs) {
      const topics = log.topics || [];

      if (topics.length === 0) continue;

      const eventSignature = topics[0];

      if (eventSignature.toLowerCase() === transferEventSignature.toLowerCase() && topics.length === 4) {
        try {
          // tokenId is in topics[3] (indexed parameter)
          const tokenIdHex = topics[3];
          const tokenId = BigInt(tokenIdHex).toString();
          tokenIds.push(tokenId);
        } catch (error) {
          console.error('Error decoding ERC-721 Transfer event:', error);
        }
      }
    }

    // Remove duplicates from tokenIds array
    const uniqueTokenIds = [...new Set(tokenIds)];

    return res.json({
      txHash,
      adminId: adminId,
      tokenIds: uniqueTokenIds,
    });
  } catch (error) {
    next(error);
  }
}

// ERC 721 Transaction validation
const erc721TransactionValidation = (txHash, rpcUrl) => {
  if (!txHash || !isValidTxHash(txHash)) {
    return {
      error: 'Invalid transaction hash. Expected 0x-prefixed 66-character hex string.',
    };
  }

  if (!rpcUrl) {
    return {
      error: 'ARBITRUM_RPC_URL is not configured in environment.',
    };
  }
  return {}
}

module.exports = {
  getTransactionDetails,
  getTransactionStatus,
  getTokenIdsFromTransaction,
};