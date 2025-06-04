/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { CompilableTransactionMessage } from '@solana/kit';
import { address, blockhash } from '@solana/kit';

import { Network } from '../..';
import {
  MOCK_SOLANA_KEYRING_ACCOUNT_0,
  MOCK_SOLANA_KEYRING_ACCOUNT_1,
  MOCK_SOLANA_KEYRING_ACCOUNTS_PRIVATE_KEY_BYTES,
} from '../solana-keyring-accounts';
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
      programAddress: address('ComputeBudget111111111111111111111111111111'),
      data: Uint8Array.from([3, 232, 3, 0, 0, 0, 0, 0, 0]), // 1000n microLamports per compute unit
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
  'gAEAAgWZsAKPnZ6vMobike0KV4I/ucjxTM1cFYhLnVhPWfjfdKoOY1FDVNQO/Z765wTNsdLb47zNGyRTzimR256kfU8y3yQl7xa/OcXC12miM213Z2zhbPpJUnX1USJbifcn1McDBkZv5SEXMv/srbpyw5vnvIzlu8X3EmssQ5s6QAAAAAbd9uHXZaGT2cvhRs7reawctIXtX1s3kTqM9YV+/wCpPYaJZpJBu+GtdWd11V2+vYR71YvIR7LefZHyZWbdoigDAwAFAroSAAADAAkD6AMAAAAAAAAEAwIBAAkD6AMAAAAAAAAA';

const signedTransaction = {
  lifetimeConstraint: {
    blockhash: blockhash('59ArZcTrPbcFbEt7yU1JRrP8bWT6ZGcCMLiDVLLzYZ3m'),
    lastValidBlockHeight: 18446744073709551615n,
  },
  messageBytes: new Uint8Array([
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
    40, 3, 3, 0, 5, 2, 186, 18, 0, 0, 3, 0, 9, 3, 232, 3, 0, 0, 0, 0, 0, 0, 4,
    3, 2, 1, 0, 9, 3, 232, 3, 0, 0, 0, 0, 0, 0, 0,
  ]),
  signatures: {
    BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP: new Uint8Array([
      124, 75, 9, 123, 88, 163, 208, 24, 217, 253, 70, 19, 85, 116, 62, 158,
      208, 162, 33, 111, 99, 174, 214, 24, 201, 17, 106, 201, 167, 25, 174, 16,
      35, 174, 165, 207, 71, 228, 251, 61, 78, 246, 21, 160, 130, 65, 29, 73,
      190, 30, 8, 175, 172, 73, 3, 129, 128, 167, 223, 165, 111, 39, 23, 1,
    ]),
  },
};

const signedTransactionBase64Encoded =
  'AXxLCXtYo9AY2f1GE1V0Pp7QoiFvY67WGMkRasmnGa4QI66lz0fk+z1O9hWggkEdSb4eCK+sSQOBgKffpW8nFwGAAQACBZmwAo+dnq8yhuKR7QpXgj+5yPFMzVwViEudWE9Z+N90qg5jUUNU1A79nvrnBM2x0tvjvM0bJFPOKZHbnqR9TzLfJCXvFr85xcLXaaIzbXdnbOFs+klSdfVRIluJ9yfUxwMGRm/lIRcy/+ytunLDm+e8jOW7xfcSayxDmzpAAAAABt324ddloZPZy+FGzut5rBy0he1fWzeROoz1hX7/AKk9holmkkG74a11Z3XVXb69hHvVi8hHst59kfJlZt2iKAMDAAUCuhIAAAMACQPoAwAAAAAAAAQDAgEACQPoAwAAAAAAAAA=';

const signature =
  '3V8bixKujBwAg4DMzJMuxNNUJRsLAw7z8CyHW9Eeio1uZiBEy6NTdFrSBpqVSCaHuuakCytr8w1tJiZbxjhLgNbJ';

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
