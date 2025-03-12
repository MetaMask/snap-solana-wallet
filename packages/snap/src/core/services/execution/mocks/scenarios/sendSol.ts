/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { CompilableTransactionMessage } from '@solana/web3.js';
import { address, blockhash } from '@solana/web3.js';

import { Network } from '../../../../constants/solana';
import {
  MOCK_SOLANA_KEYRING_ACCOUNT_0,
  MOCK_SOLANA_KEYRING_ACCOUNT_1,
  MOCK_SOLANA_KEYRING_ACCOUNTS_PRIVATE_KEY_BYTES,
} from '../../../../test/mocks/solana-keyring-accounts';
import type { MockExecutionScenario } from './types';

const scope = Network.Devnet;

const fromAccount = MOCK_SOLANA_KEYRING_ACCOUNT_0;
const toAccount = MOCK_SOLANA_KEYRING_ACCOUNT_1;

const fromAccountPrivateKeyBytes =
  MOCK_SOLANA_KEYRING_ACCOUNTS_PRIVATE_KEY_BYTES[fromAccount.id]!;

const transactionMessage: CompilableTransactionMessage = {
  version: 0,
  feePayer: {
    address: address(fromAccount.address),
  },
  lifetimeConstraint: {
    blockhash: blockhash('8vMXV3ERvs12BY8w1nSHutzwwMptAR5UvUSq5pH2QYsK'),
    lastValidBlockHeight: 18446744073709551615n,
  },
  instructions: [
    {
      programAddress: address('ComputeBudget111111111111111111111111111111'),
      data: Uint8Array.from([2, 44, 1, 0, 0]),
    },
    {
      programAddress: address('11111111111111111111111111111111'),
      accounts: [
        {
          address: address(fromAccount.address),
          role: 3,
        },
        {
          address: address(toAccount.address),
          role: 1,
        },
      ],
      data: Uint8Array.from([2, 0, 0, 0, 64, 66, 15, 0, 0, 0, 0, 0]),
    },
  ],
};

const transactionMessageBase64Encoded =
  'AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAQACBJmwAo+dnq8yhuKR7QpXgj+5yPFMzVwViEudWE9Z+N903bOu6UdCGJS9VyhRo8wvswWSAO709XY+51AU1MALO6wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMGRm/lIRcy/+ytunLDm+e8jOW7xfcSayxDmzpAAAAAdazMubIOjxUiTY/+xWYNSffhgTb7vd9LWQ0sI2iMMSoCAwAFAiwBAAACAgABDAIAAABAQg8AAAAAAAA=';

const signedTransaction = {
  lifetimeConstraint: {
    blockhash: blockhash('8vMXV3ERvs12BY8w1nSHutzwwMptAR5UvUSq5pH2QYsK'),
    lastValidBlockHeight: 18446744073709551615n,
  },
  messageBytes: Uint8Array.from([
    128, 1, 0, 2, 4, 153, 176, 2, 143, 157, 158, 175, 50, 134, 226, 145, 237,
    10, 87, 130, 63, 185, 200, 241, 76, 205, 92, 21, 136, 75, 157, 88, 79, 89,
    248, 223, 116, 221, 179, 174, 233, 71, 66, 24, 148, 189, 87, 40, 81, 163,
    204, 47, 179, 5, 146, 0, 238, 244, 245, 118, 62, 231, 80, 20, 212, 192, 11,
    59, 172, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 6, 70, 111, 229, 33, 23, 50, 255, 236, 173,
    186, 114, 195, 155, 231, 188, 140, 229, 187, 197, 247, 18, 107, 44, 67, 155,
    58, 64, 0, 0, 0, 117, 172, 204, 185, 178, 14, 143, 21, 34, 77, 143, 254,
    197, 102, 13, 73, 247, 225, 129, 54, 251, 189, 223, 75, 89, 13, 44, 35, 104,
    140, 49, 42, 2, 3, 0, 5, 2, 44, 1, 0, 0, 2, 2, 0, 1, 12, 2, 0, 0, 0, 64, 66,
    15, 0, 0, 0, 0, 0, 0,
  ]),
  signatures: {
    BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP: Uint8Array.from([
      200, 102, 135, 38, 112, 79, 27, 82, 205, 138, 19, 244, 15, 61, 131, 75,
      109, 86, 230, 49, 247, 32, 243, 147, 198, 36, 195, 126, 114, 51, 101, 238,
      27, 12, 239, 255, 202, 176, 131, 195, 50, 219, 32, 22, 35, 80, 34, 220,
      241, 140, 55, 85, 98, 160, 102, 69, 151, 130, 195, 32, 75, 67, 43, 14,
    ]),
  },
};

const signedTransactionBase64Encoded =
  'AchmhyZwTxtSzYoT9A89g0ttVuYx9yDzk8Ykw35yM2XuGwzv/8qwg8My2yAWI1Ai3PGMN1VioGZFl4LDIEtDKw6AAQACBJmwAo+dnq8yhuKR7QpXgj+5yPFMzVwViEudWE9Z+N903bOu6UdCGJS9VyhRo8wvswWSAO709XY+51AU1MALO6wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMGRm/lIRcy/+ytunLDm+e8jOW7xfcSayxDmzpAAAAAdazMubIOjxUiTY/+xWYNSffhgTb7vd9LWQ0sI2iMMSoCAwAFAiwBAAACAgABDAIAAABAQg8AAAAAAAA=';

const signature =
  '51PN5XQ34sjoZVrpwye6PZaX9jbPThQoFT9FsPAZU1AofqSahU9nWUUNevbQeoVqQZiptBv1uZ7xgPt23CbwDBLR';

export const MOCK_EXECUTION_SCENARIO_SEND_SOL: MockExecutionScenario = {
  name: 'Send SOL',
  scope,
  fromAccount,
  toAccount,
  fromAccountPrivateKeyBytes,
  transactionMessage,
  transactionMessageBase64Encoded,
  signedTransaction,
  signedTransactionBase64Encoded,
  signature,
};
