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
      apiVersion: '1.18.22',
      slot: 302900219,
    },
    value: {
      blockhash: 'F9CSnuc5Z1FDrWTVXM4cB3SmDuFgkFB4QR4ikkrchDe3',
      lastValidBlockHeight: 1,
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
    context: {
      apiVersion: '1.18.22',
      slot: 302900219,
    },
    value: {
      signature:
        '4TnmpaFDrKLcYc9sn5PKeGdQPyWsShDVJY5Hbaq1iZLBviaD1cVZuXYGQMezi8wqJBiHYupmrCfvyhxFGp92aZ19',
    },
  },
  id: '0',
};
