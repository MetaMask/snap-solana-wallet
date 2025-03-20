import type {
  Address,
  Base58EncodedBytes,
  Slot,
  StringifiedBigInt,
  StringifiedNumber,
  UnixTimestamp,
} from '@solana/kit';
import { address, blockhash, lamports } from '@solana/kit';

import type { SolanaTransaction } from '../../../types/solana';

/**
 * Mainnet - Swap
 * Transaction: 5LuTa5k9UvgM2eJknVUD9MjfcmcTP7nvFrCedU8d7ZLXCHbrrwqhXDQYTSfncm1wTSNFPZj3Y4cRkWC8CLG6Zcvh
 *
 * Fee Payer:
 * DtMUkCoeyzs35B6EpQQxPyyog6TRwXxV1W1Acp8nWBNa pays 0.000074798 SOL
 *
 * Senders:
 * DtMUkCoeyzs35B6EpQQxPyyog6TRwXxV1W1Acp8nWBNa sends 1.1 USDC
 *
 * Receivers:
 * DtMUkCoeyzs35B6EpQQxPyyog6TRwXxV1W1Acp8nWBNa gets 2.143812 JUP
 *
 */
export const EXPECTED_SWAP_USDC_TO_JUP_DATA: SolanaTransaction = {
  blockTime: 1742297902n as UnixTimestamp,
  meta: {
    computeUnitsConsumed: 61355n,
    // eslint-disable-next-line id-denylist
    err: null,
    fee: lamports(80001n),
    innerInstructions: [
      {
        index: 2,
        instructions: [
          {
            accounts: [1, 3, 0],
            data: '3bttrrSseTqq' as Base58EncodedBytes,
            programIdIndex: 15,
            stackHeight: 2,
          },
          {
            accounts: [7],
            data: '2qWhKzSZDTHhTkHUC1NYnTjhAu5u5AHWvB5YkwobfvwkhzLAN4fRrYt3YWSuCBjhKsmhdPfwmMZEoy3TiqnMvuU8McaZeXqyoQemK1mDgnfp2z3rnpnkQgM5Z' as Base58EncodedBytes,
            programIdIndex: 5,
            stackHeight: 2,
          },
          {
            accounts: [9, 11, 10, 12, 13, 1, 2, 0, 15, 14],
            data: '4Ts9LwHY3pMtj4MjmTzmKu1' as Base58EncodedBytes,
            programIdIndex: 16,
            stackHeight: 2,
          },
          {
            accounts: [1, 10, 0],
            data: '3UctjiT2vt9m' as Base58EncodedBytes,
            programIdIndex: 15,
            stackHeight: 3,
          },
          {
            accounts: [13, 2, 13],
            data: '3Qx9e2USBsUT' as Base58EncodedBytes,
            programIdIndex: 15,
            stackHeight: 3,
          },
          {
            accounts: [7],
            data: 'QMqFu4fYGGeUEysFnenhAvCS196iqPeVBXisaezTjxHaPsVUKhQ7dGWecKHhLP29PQen8zkCfLVaJVey8xQeBj6JMRuZiVT5RFhaoRYGBdbJJGiF7gDdAzFU3Etb4NbGV7d5YgRSYwo6wYsaymaneEQrcVnYMgvtWV55jUKWY6sdcE3' as Base58EncodedBytes,
            programIdIndex: 5,
            stackHeight: 2,
          },
        ],
      },
    ],
    loadedAddresses: {
      readonly: [
        address('Sysvar1nstructions1111111111111111111111111'),
        address('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
        address('ZERor4xhbUycZ6gb9ntrhqscUcZmAbQDjEAtCf4hbZY'),
      ],
      writable: [
        address('1amiJLvkVHjPz7t8dwBsWHknHitcpqwPPuuUCfHyzjB'),
        address('8cjeuVV3KQ9k8RqW1JUyCfey2TDAhuo7f4hPDMeGfxv'),
        address('3YTcuZp6cuT9VvdeTJ8wK5apjZX1Mz8FZAZbhX28uj4L'),
        address('4oeU2MYpcLRpKxuNnsDue8HawERCrCce4pswasL4EkEm'),
        address('HWcEXBF7Gu2HnjBPfrSYpUKYrV4bBrkMJRWnb5Qn1zUe'),
      ],
    },
    logMessages: [
      'Program ComputeBudget111111111111111111111111111111 invoke [1]',
      'Program ComputeBudget111111111111111111111111111111 success',
      'Program ComputeBudget111111111111111111111111111111 invoke [1]',
      'Program ComputeBudget111111111111111111111111111111 success',
      'Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 invoke [1]',
      'Program log: Instruction: Route',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]',
      'Program log: Instruction: Transfer',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4644 of 72312 compute units',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
      'Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 invoke [2]',
      'Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 consumed 184 of 66293 compute units',
      'Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 success',
      'Program ZERor4xhbUycZ6gb9ntrhqscUcZmAbQDjEAtCf4hbZY invoke [2]',
      'Program log: Instruction: swap',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [3]',
      'Program log: Instruction: Transfer',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4645 of 47573 compute units',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [3]',
      'Program log: Instruction: Transfer',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4554 of 40788 compute units',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
      'Program data: Q3AAHurUU32hq/7cNFJFoKPTxDE76dGiDn/896crKwjhqPh10wksYSSzBkRclFF8C+yNEehgubDZCqAglD9uT7sLKCifBPJ3GwK/yODnPr+hH2f+1V2cVqy6Zuj7KgnRuRG6NrI4KJVBEFPc74cJwEbZ9oaJ31u0yZA0jtKppcJCcAAe6tRTffspwY/LvptLRldW4xF3e9FxbSX54eAxcFlQR/l+0ZYzm8cCt0LXR7586BbZxcUGQZ/VoR9P/GV4Kph5rP2WBjRBpq/I4Oc+v+WpR/7VXZxWxvEh//Ns6e65Ebo2sjjYqmxLirvvhwnARtn2honfW7TJkDSO0qmlwkJwAB7q1FN9oY3Rj8u+m0sC4XbjEXd70Z1jJfnh4DFwGRJI+X7RljObxwK3QtdHvnzoFtnFxQZBn9WhH0/8ZXgqmHms/ZYGNEGmr8jg5z6/5alH/tVdnFbG8SH/82zp7rkRujayONiqbEuKu++HCcBG2faGid9btMmQNI7SqaXCQnAAHurUU32hjdGPy76bSwLhduMRd3vRnWMl+eHgMXAZEkj5ftGWM5vHArdC10e+fOgW2cXFBkGf1aEfT/xleCqYeaz9lgY0QaavyODnPr/lqUf+1V2cVsbxIf/zbOnuuRG6NrI42KpsS4q774cJwEbZ9oaJ31u0yZA0jtKppcJCcAAe6tRTfaGN0Y/LvptLAuF24xF3e9GdYyX54eAxcH8XSPl+0ZYzd8kCt0LXR76U6xbZxcUGQZ/VoR9P/GV4Kph5rP2WBjRBpq/I4Oc+v+WpR/7VXZxWxvEh//Ns6e65Ebo2sjjYqmxLirvvhwnARtn2honfW7TJkDSO0qmlwkJwAB7q1FN9oY3Rj8u+m0sC4XbjEXd70Q==',
      'Program ZERor4xhbUycZ6gb9ntrhqscUcZmAbQDjEAtCf4hbZY consumed 45476 of 63205 compute units',
      'Program ZERor4xhbUycZ6gb9ntrhqscUcZmAbQDjEAtCf4hbZY success',
      'Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 invoke [2]',
      'Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 consumed 184 of 15994 compute units',
      'Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 success',
      'Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 consumed 61055 of 75283 compute units',
      'Program return: JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 RLYgAAAAAAA=',
      'Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 success',
    ],
    postBalances: [
      lamports(47568321n),
      lamports(2039280n),
      lamports(2039280n),
      lamports(2039280n),
      lamports(1n),
      lamports(1141440n),
      lamports(69942826115n),
      lamports(0n),
      lamports(0n),
      lamports(52784640n),
      lamports(2039280n),
      lamports(8352000n),
      lamports(8352000n),
      lamports(2039280n),
      lamports(0n),
      lamports(934087680n),
      lamports(1141440n),
    ],
    postTokenBalances: [
      {
        accountIndex: 1,
        mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' as Address,
        owner: 'DtMUkCoeyzs35B6EpQQxPyyog6TRwXxV1W1Acp8nWBNa' as Address,
        programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' as Address,
        uiTokenAmount: {
          amount: '1828521' as StringifiedBigInt,
          decimals: 6,
          uiAmount: 1.828521,
          uiAmountString: '1.828521' as StringifiedNumber,
        },
      },
      {
        accountIndex: 2,
        mint: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN' as Address,
        owner: 'DtMUkCoeyzs35B6EpQQxPyyog6TRwXxV1W1Acp8nWBNa' as Address,
        programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' as Address,
        uiTokenAmount: {
          amount: '4881197' as StringifiedBigInt,
          decimals: 6,
          uiAmount: 4.881197,
          uiAmountString: '4.881197' as StringifiedNumber,
        },
      },
      {
        accountIndex: 3,
        mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' as Address,
        owner: '9yj3zvLS3fDMqi1F8zhkaWfq8TZpZWHe6cz1Sgt7djXf' as Address,
        programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' as Address,
        uiTokenAmount: {
          amount: '4029370153254' as StringifiedBigInt,
          decimals: 6,
          uiAmount: 4029370.153254,
          uiAmountString: '4029370.153254' as StringifiedNumber,
        },
      },
      {
        accountIndex: 10,
        mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' as Address,
        owner: '8cjeuVV3KQ9k8RqW1JUyCfey2TDAhuo7f4hPDMeGfxv' as Address,
        programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' as Address,
        uiTokenAmount: {
          amount: '532496448015' as StringifiedBigInt,
          decimals: 6,
          uiAmount: 532496.448015,
          uiAmountString: '532496.448015' as StringifiedNumber,
        },
      },
      {
        accountIndex: 13,
        mint: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN' as Address,
        owner: 'HWcEXBF7Gu2HnjBPfrSYpUKYrV4bBrkMJRWnb5Qn1zUe' as Address,
        programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' as Address,
        uiTokenAmount: {
          amount: '140193384137' as StringifiedBigInt,
          decimals: 6,
          uiAmount: 140193.384137,
          uiAmountString: '140193.384137' as StringifiedNumber,
        },
      },
    ],
    preBalances: [
      lamports(47648322n),
      lamports(2039280n),
      lamports(2039280n),
      lamports(2039280n),
      lamports(1n),
      lamports(1141440n),
      lamports(69942826115n),
      lamports(0n),
      lamports(0n),
      lamports(52784640n),
      lamports(2039280n),
      lamports(8352000n),
      lamports(8352000n),
      lamports(2039280n),
      lamports(0n),
      lamports(934087680n),
      lamports(1141440n),
    ],
    preTokenBalances: [
      {
        accountIndex: 1,
        mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' as Address,
        owner: 'DtMUkCoeyzs35B6EpQQxPyyog6TRwXxV1W1Acp8nWBNa' as Address,
        programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' as Address,
        uiTokenAmount: {
          amount: '2928521' as StringifiedBigInt,
          decimals: 6,
          uiAmount: 2.928521,
          uiAmountString: '2.928521' as StringifiedNumber,
        },
      },
      {
        accountIndex: 2,
        mint: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN' as Address,
        owner: 'DtMUkCoeyzs35B6EpQQxPyyog6TRwXxV1W1Acp8nWBNa' as Address,
        programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' as Address,
        uiTokenAmount: {
          amount: '2737385' as StringifiedBigInt,
          decimals: 6,
          uiAmount: 2.737385,
          uiAmountString: '2.737385' as StringifiedNumber,
        },
      },
      {
        accountIndex: 3,
        mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' as Address,
        owner: '9yj3zvLS3fDMqi1F8zhkaWfq8TZpZWHe6cz1Sgt7djXf' as Address,
        programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' as Address,
        uiTokenAmount: {
          amount: '4029370143904' as StringifiedBigInt,
          decimals: 6,
          uiAmount: 4029370.143904,
          uiAmountString: '4029370.143904' as StringifiedNumber,
        },
      },
      {
        accountIndex: 10,
        mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' as Address,
        owner: '8cjeuVV3KQ9k8RqW1JUyCfey2TDAhuo7f4hPDMeGfxv' as Address,
        programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' as Address,
        uiTokenAmount: {
          amount: '532495357365' as StringifiedBigInt,
          decimals: 6,
          uiAmount: 532495.357365,
          uiAmountString: '532495.357365' as StringifiedNumber,
        },
      },
      {
        accountIndex: 13,
        mint: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN' as Address,
        owner: 'HWcEXBF7Gu2HnjBPfrSYpUKYrV4bBrkMJRWnb5Qn1zUe' as Address,
        programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' as Address,
        uiTokenAmount: {
          amount: '140195527949' as StringifiedBigInt,
          decimals: 6,
          uiAmount: 140195.527949,
          uiAmountString: '140195.527949' as StringifiedNumber,
        },
      },
    ],
    // returnData: {
    //   data: 'RLYgAAAAAAA=' as Base64EncodedDataResponse,
    //   programId: 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4' as Address,
    // },
    rewards: [],
    status: { Ok: null },
  },
  slot: 327561062n as Slot,
  transaction: {
    message: {
      accountKeys: [
        address('DtMUkCoeyzs35B6EpQQxPyyog6TRwXxV1W1Acp8nWBNa'),
        address('3QE7UkXbrHxEbi373Gp5hwPQwJaAVoLvwYBRz5jwaGxt'),
        address('BWqMUT5533X8M4DM3AQvFeAQd451urcVQu3zi6uVxWtT'),
        address('J8gt2jBUi6DW6gdUdm1fkP9oGN4xXwPdQbCZkkN78R3Z'),
        address('ComputeBudget111111111111111111111111111111'),
        address('JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4'),
        address('JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN'),
        address('D8cy77BBepLMngZx6ZukaTff5hCt1HrWyKk3Hnd9oitf'),
        address('J56q6nX15WHRLJcsGB6s1bjaiywrn8DqLLvLccz61cYx'),
      ],
      addressTableLookups: [
        {
          accountKey: address('37vuMG2KFv3FjzeX2dH8HB3hjvAdxBPknMMMCQoCGoKC'),
          readableIndexes: [44, 9, 39],
          writableIndexes: [46, 45, 41, 43, 42],
        },
      ],
      header: {
        numReadonlySignedAccounts: 0,
        numReadonlyUnsignedAccounts: 5,
        numRequiredSignatures: 1,
      },
      instructions: [
        {
          accounts: [],
          data: 'Fhgyu1' as Base58EncodedBytes,
          programIdIndex: 4,
          stackHeight: null,
        },
        {
          accounts: [],
          data: '3JffhtY91DCs' as Base58EncodedBytes,
          programIdIndex: 4,
          stackHeight: null,
        },
        {
          accounts: [
            15, 0, 1, 2, 5, 6, 3, 7, 5, 16, 9, 11, 10, 12, 13, 1, 2, 0, 15, 14,
            8,
          ],
          data: 'PrpFmsY4d26dKbdKNQQjhrmGEpkbkfkFrSJda7D9TvWC2e52' as Base58EncodedBytes,
          programIdIndex: 5,
          stackHeight: null,
        },
      ],
      recentBlockhash: blockhash(
        '75B7mDyDb7pFTYWuDf5vehM2oHW8keS5VnrTTr83ko5k',
      ),
    },
    signatures: [
      '5LuTa5k9UvgM2eJknVUD9MjfcmcTP7nvFrCedU8d7ZLXCHbrrwqhXDQYTSfncm1wTSNFPZj3Y4cRkWC8CLG6Zcvh' as Base58EncodedBytes,
    ],
  },
  version: 0,
};
