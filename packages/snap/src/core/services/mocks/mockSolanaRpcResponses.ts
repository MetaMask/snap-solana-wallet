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
      '3Avy1mZnwzwmo3EqhxXkHfuzGfMhfvw8tqkoNimgJWhrFEpoNzmUdPFx79VKJTo4XPfkepmoD5qvmhMFDX24tstq',
  },
  id: '0',
};

/**
 * Sample response from the Solana RPC `getFeeForMessage` method
 */
export const MOCK_SOLANA_RPC_GET_FEE_FOR_MESSAGE_RESPONSE = {
  jsonrpc: '2.0',
  result: {
    value: 15000,
  },
  id: '0',
};

/**
 * Sample response from the Solana RPC `simulateTransaction` method
 */
export const MOCK_SOLANA_RPC_SIMULATE_TRANSACTION_RESPONSE = {
  jsonrpc: '2.0',
  result: {
    context: {
      slot: 218,
    },
    value: {
      // eslint-disable-next-line id-denylist
      err: null,
      accounts: null,
      logs: [
        'Program 83astBRguLMdt2h5U1Tpdq5tjFoJ6noeGwaY3mDLVcri invoke [1]',
        'Program 83astBRguLMdt2h5U1Tpdq5tjFoJ6noeGwaY3mDLVcri consumed 2366 of 1400000 compute units',
        'Program return: 83astBRguLMdt2h5U1Tpdq5tjFoJ6noeGwaY3mDLVcri KgAAAAAAAAA=',
        'Program 83astBRguLMdt2h5U1Tpdq5tjFoJ6noeGwaY3mDLVcri success',
      ],
      returnData: {
        data: ['Kg==', 'base64'],
        programId: '83astBRguLMdt2h5U1Tpdq5tjFoJ6noeGwaY3mDLVcri',
      },
      unitsConsumed: 2366,
    },
  },
  id: 1,
};

/**
 * Sample response from the Solana RPC `getTokenAccountsByOwner` method
 */
export const MOCK_SOLANA_RPC_GET_TOKEN_ACCOUNTS_BY_OWNER_RESPONSE = {
  jsonrpc: '2.0',
  result: {
    context: {
      slot: 302900219,
    },
    value: [
      {
        account: {
          data: {
            parsed: {
              info: {
                mint: 'address1',
                owner: 'owner1',
                isNative: false,
                tokenAmount: {
                  amount: '123456789',
                  decimals: 9,
                },
              },
            },
          },
        },
      },
      {
        account: {
          data: {
            parsed: {
              info: {
                mint: 'address2',
                owner: 'owner2',
                isNative: false,
                tokenAmount: {
                  amount: '987654321',
                  decimals: 9,
                },
              },
            },
          },
        },
      },
    ],
  },
  id: '0',
};

export const MOCK_SOLANA_RPC_GET_TRANSACTION_RESPONSE = {
  jsonrpc: '2.0',
  result: {
    signature: '123',
  },
  id: '0',
};

export const MOCK_SOLANA_RPC_GET_MULTIPLE_ACCOUNTS_RESPONSE = {
  jsonrpc: '2.0',
  result: {
    context: { apiVersion: '2.0.15', slot: 341197247 },
    value: [
      {
        data: ['', 'base58'],
        executable: false,
        lamports: 88849814690250,
        owner: '11111111111111111111111111111111',
        rentEpoch: 1844674407370955,
        space: 0,
      },
      {
        data: ['', 'base58'],
        executable: false,
        lamports: 998763433,
        owner: '2WRuhE4GJFoE23DYzp2ij6ZnuQ8p9mJeU6gDgfsjR4or',
        rentEpoch: 1844674407370955,
        space: 0,
      },
    ],
  },
  id: '0',
};
