/**
 * Sample response from the Solana RPC `getBalance` method
 */
export const MOCK_SOLANA_RPC_GET_BALANCE_RESPONSE = {
  jsonrpc: '2.0',
  result: {
    context: {
      apiVersion: '1.18.22',
      slot: 302900219,
    },
    value: 123456789,
  },
  id: '0',
};

/**
 * Sample response from the Solana RPC `getLatestBlockhash` method
 */
export const MOCK_SOLANA_RPC_GET_LATEST_BLOCKHASH_RESPONSE = {
  jsonrpc: '2.0',
  result: {
    context: {
      apiVersion: '2.0.18',
      slot: 346468641,
    },
    value: {
      blockhash: '8HSvyvQvdRoFkCPnrtqF3dAS4SpPEbMKUVTdrK9auMR',
      lastValidBlockHeight: 334650256,
    },
  },
  id: '0',
};

/**
 * Sample response from the Solana RPC `sendTransaction` method
 */
export const MOCK_SOLANA_RPC_SEND_TRANSACTION_RESPONSE = {
  jsonrpc: '2.0',
  result: {
    signature:
      '64B85Y9vphG3nDvNx1j2cVrkFh8JdJE9whyj4m226JiUAcQxUn7gFuZZsDfjQioG8PTxSrEX9VdXTr63Tq8woRWk',
  },
  id: '0',
};
