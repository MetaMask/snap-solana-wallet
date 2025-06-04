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
    blockhash: blockhash('8vMXV3ERvs12BY8w1nSHutzwwMptAR5UvUSq5pH2QYsK'),
    lastValidBlockHeight: 18446744073709551615n,
  },
  instructions: [
    {
      programAddress: address('ComputeBudget111111111111111111111111111111'),
      data: Uint8Array.from([2, 44, 1, 0, 0]),
    },
    {
      programAddress: address('ComputeBudget111111111111111111111111111111'),
      data: Uint8Array.from([3, 232, 3, 0, 0, 0, 0, 0, 0]), // 1000n microLamports per compute unit
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
  'gAEAAgSZsAKPnZ6vMobike0KV4I/ucjxTM1cFYhLnVhPWfjfdN2zrulHQhiUvVcoUaPML7MFkgDu9PV2PudQFNTACzusAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADBkZv5SEXMv/srbpyw5vnvIzlu8X3EmssQ5s6QAAAAHWszLmyDo8VIk2P/sVmDUn34YE2+73fS1kNLCNojDEqAwMABQIsAQAAAwAJA+gDAAAAAAAAAgIAAQwCAAAAQEIPAAAAAAAA';

const signedTransaction = {
  lifetimeConstraint: {
    blockhash: blockhash('8vMXV3ERvs12BY8w1nSHutzwwMptAR5UvUSq5pH2QYsK'),
    lastValidBlockHeight: 18446744073709551615n,
  },
  messageBytes: new Uint8Array([
    128, 1, 0, 2, 4, 153, 176, 2, 143, 157, 158, 175, 50, 134, 226, 145, 237,
    10, 87, 130, 63, 185, 200, 241, 76, 205, 92, 21, 136, 75, 157, 88, 79, 89,
    248, 223, 116, 221, 179, 174, 233, 71, 66, 24, 148, 189, 87, 40, 81, 163,
    204, 47, 179, 5, 146, 0, 238, 244, 245, 118, 62, 231, 80, 20, 212, 192, 11,
    59, 172, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 6, 70, 111, 229, 33, 23, 50, 255, 236, 173,
    186, 114, 195, 155, 231, 188, 140, 229, 187, 197, 247, 18, 107, 44, 67, 155,
    58, 64, 0, 0, 0, 117, 172, 204, 185, 178, 14, 143, 21, 34, 77, 143, 254,
    197, 102, 13, 73, 247, 225, 129, 54, 251, 189, 223, 75, 89, 13, 44, 35, 104,
    140, 49, 42, 3, 3, 0, 5, 2, 44, 1, 0, 0, 3, 0, 9, 3, 232, 3, 0, 0, 0, 0, 0,
    0, 2, 2, 0, 1, 12, 2, 0, 0, 0, 64, 66, 15, 0, 0, 0, 0, 0, 0,
  ]),
  signatures: {
    BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP: new Uint8Array([
      99, 71, 118, 0, 107, 144, 42, 175, 174, 75, 46, 121, 60, 40, 175, 238,
      109, 104, 232, 29, 253, 249, 18, 241, 53, 26, 190, 146, 185, 248, 200, 68,
      71, 127, 155, 221, 252, 116, 1, 211, 62, 10, 250, 75, 67, 199, 247, 199,
      239, 77, 7, 60, 45, 179, 174, 129, 11, 246, 223, 168, 249, 0, 204, 2,
    ]),
  },
};

const signedTransactionBase64Encoded =
  'AWNHdgBrkCqvrksueTwor+5taOgd/fkS8TUavpK5+MhER3+b3fx0AdM+CvpLQ8f3x+9NBzwts66BC/bfqPkAzAKAAQACBJmwAo+dnq8yhuKR7QpXgj+5yPFMzVwViEudWE9Z+N903bOu6UdCGJS9VyhRo8wvswWSAO709XY+51AU1MALO6wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMGRm/lIRcy/+ytunLDm+e8jOW7xfcSayxDmzpAAAAAdazMubIOjxUiTY/+xWYNSffhgTb7vd9LWQ0sI2iMMSoDAwAFAiwBAAADAAkD6AMAAAAAAAACAgABDAIAAABAQg8AAAAAAAA=';

const signature =
  '2z8EPNFosL7kfjTsTKWRPMgH7G41bJW22qNtRa4vNSHEmBG84SSr4yjqAFsp82gc2tEuc6wtamiof7BMwfeZzewB';

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
