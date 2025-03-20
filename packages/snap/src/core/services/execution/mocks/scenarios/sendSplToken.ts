/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { CompilableTransactionMessage } from '@solana/kit';
import { address, blockhash } from '@solana/kit';

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
    blockhash: blockhash('59ArZcTrPbcFbEt7yU1JRrP8bWT6ZGcCMLiDVLLzYZ3m'),
    lastValidBlockHeight: 18446744073709551615n,
  },
  instructions: [
    {
      programAddress: address('ComputeBudget111111111111111111111111111111'),
      data: Uint8Array.from([2, 186, 18, 0, 0]),
    },
    {
      accounts: [
        {
          address: address('G23tQHsbQuh3yqUBoyXDn3TwqEbbbUHAHEeUSvJaVRtA'), // Associated token account of fromAccount for USDC Devnet
          role: 1,
        },
        {
          address: address('CSq2wNLSpfKHCdL3E3k1iksbRXWjfnD87b9iy35nL8VP'), // Associated token account of toAccount for USDC Devnet
          role: 1,
        },
        {
          address: address(fromAccount.address),
          role: 3,
        },
      ],
      programAddress: address('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
      data: Uint8Array.from([3, 232, 3, 0, 0, 0, 0, 0, 0]),
    },
  ],
};

const transactionMessageBase64Encoded =
  'AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAQACBZmwAo+dnq8yhuKR7QpXgj+5yPFMzVwViEudWE9Z+N90qg5jUUNU1A79nvrnBM2x0tvjvM0bJFPOKZHbnqR9TzLfJCXvFr85xcLXaaIzbXdnbOFs+klSdfVRIluJ9yfUxwMGRm/lIRcy/+ytunLDm+e8jOW7xfcSayxDmzpAAAAABt324ddloZPZy+FGzut5rBy0he1fWzeROoz1hX7/AKk9holmkkG74a11Z3XVXb69hHvVi8hHst59kfJlZt2iKAIDAAUCuhIAAAQDAgEACQPoAwAAAAAAAAA=';

const signedTransaction = {
  lifetimeConstraint: {
    blockhash: blockhash('59ArZcTrPbcFbEt7yU1JRrP8bWT6ZGcCMLiDVLLzYZ3m'),
    lastValidBlockHeight: 18446744073709551615n,
  },
  messageBytes: Uint8Array.from([
    128, 1, 0, 2, 5, 153, 176, 2, 143, 157, 158, 175, 50, 134, 226, 145, 237,
    10, 87, 130, 63, 185, 200, 241, 76, 205, 92, 21, 136, 75, 157, 88, 79, 89,
    248, 223, 116, 170, 14, 99, 81, 67, 84, 212, 14, 253, 158, 250, 231, 4, 205,
    177, 210, 219, 227, 188, 205, 27, 36, 83, 206, 41, 145, 219, 158, 164, 125,
    79, 50, 223, 36, 37, 239, 22, 191, 57, 197, 194, 215, 105, 162, 51, 109,
    119, 103, 108, 225, 108, 250, 73, 82, 117, 245, 81, 34, 91, 137, 247, 39,
    212, 199, 3, 6, 70, 111, 229, 33, 23, 50, 255, 236, 173, 186, 114, 195, 155,
    231, 188, 140, 229, 187, 197, 247, 18, 107, 44, 67, 155, 58, 64, 0, 0, 0, 6,
    221, 246, 225, 215, 101, 161, 147, 217, 203, 225, 70, 206, 235, 121, 172,
    28, 180, 133, 237, 95, 91, 55, 145, 58, 140, 245, 133, 126, 255, 0, 169, 61,
    134, 137, 102, 146, 65, 187, 225, 173, 117, 103, 117, 213, 93, 190, 189,
    132, 123, 213, 139, 200, 71, 178, 222, 125, 145, 242, 101, 102, 221, 162,
    40, 2, 3, 0, 5, 2, 186, 18, 0, 0, 4, 3, 2, 1, 0, 9, 3, 232, 3, 0, 0, 0, 0,
    0, 0, 0,
  ]),
  signatures: {
    BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP: Uint8Array.from([
      76, 71, 216, 53, 23, 77, 46, 30, 25, 127, 218, 36, 163, 213, 241, 225, 62,
      90, 18, 231, 69, 31, 141, 48, 63, 168, 62, 55, 109, 150, 209, 13, 20, 62,
      134, 45, 91, 3, 93, 30, 230, 40, 221, 158, 98, 6, 162, 128, 66, 126, 65,
      173, 92, 40, 90, 220, 116, 40, 199, 86, 58, 241, 123, 1,
    ]),
  },
};

const signedTransactionBase64Encoded =
  'AUxH2DUXTS4eGX/aJKPV8eE+WhLnRR+NMD+oPjdtltENFD6GLVsDXR7mKN2eYgaigEJ+Qa1cKFrcdCjHVjrxewGAAQACBZmwAo+dnq8yhuKR7QpXgj+5yPFMzVwViEudWE9Z+N90qg5jUUNU1A79nvrnBM2x0tvjvM0bJFPOKZHbnqR9TzLfJCXvFr85xcLXaaIzbXdnbOFs+klSdfVRIluJ9yfUxwMGRm/lIRcy/+ytunLDm+e8jOW7xfcSayxDmzpAAAAABt324ddloZPZy+FGzut5rBy0he1fWzeROoz1hX7/AKk9holmkkG74a11Z3XVXb69hHvVi8hHst59kfJlZt2iKAIDAAUCuhIAAAQDAgEACQPoAwAAAAAAAAA=';

const signature =
  '2XTRDNsH7Hy3zqdWgWJ4Pe8wzfSo8THSxthn2Q9ENB4zq4Ncc2JsGmJKmqZ5WT2e8a2CFReQU8ndv9vHmZS2nPYk';

export const MOCK_EXECUTION_SCENARIO_SEND_SPL_TOKEN: MockExecutionScenario = {
  name: 'Send SPL Token',
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
