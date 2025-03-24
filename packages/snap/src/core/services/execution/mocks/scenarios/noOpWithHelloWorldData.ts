/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { CompilableTransactionMessage } from '@solana/kit';
import { address, blockhash } from '@solana/kit';

import { Network } from '../../../../constants/solana';
import {
  MOCK_SOLANA_KEYRING_ACCOUNT_0,
  MOCK_SOLANA_KEYRING_ACCOUNTS_PRIVATE_KEY_BYTES,
} from '../../../../test/mocks/solana-keyring-accounts';
import type { MockExecutionScenario } from './types';

const scope = Network.Devnet;

const signer = MOCK_SOLANA_KEYRING_ACCOUNT_0;

const fromAccountPrivateKeyBytes =
  MOCK_SOLANA_KEYRING_ACCOUNTS_PRIVATE_KEY_BYTES[signer.id]!;

const transactionMessage: CompilableTransactionMessage = {
  feePayer: {
    address: address(signer.address),
  },
  instructions: [
    {
      data: new Uint8Array([
        72, 101, 108, 108, 111, 44, 32, 119, 111, 114, 108, 100, 33,
      ]),
      programAddress: address('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
    },
  ],
  version: 'legacy',
  lifetimeConstraint: {
    blockhash: blockhash('GmfR6QBrCj6ypdyrJFpBNUjUMZaTazXHG9bVczYAWsVS'),
    lastValidBlockHeight: 18446744073709551615n,
  },
};

const transactionMessageBase64Encoded =
  'AQABApmwAo+dnq8yhuKR7QpXgj+5yPFMzVwViEudWE9Z+N90BUpTWpkpIQZNJOhxYNo4fHw1td28kruB5B+oQEEFRI3qUEvBqvuwVnMsfmri6p3ESdGReEuAbbq6sJS3xMsdsQEBAA1IZWxsbywgd29ybGQh';

const signedTransaction = {
  lifetimeConstraint: {
    blockhash: blockhash('GmfR6QBrCj6ypdyrJFpBNUjUMZaTazXHG9bVczYAWsVS'),
    lastValidBlockHeight: 18446744073709551615n,
  },
  messageBytes: new Uint8Array([
    1, 0, 1, 2, 153, 176, 2, 143, 157, 158, 175, 50, 134, 226, 145, 237, 10, 87,
    130, 63, 185, 200, 241, 76, 205, 92, 21, 136, 75, 157, 88, 79, 89, 248, 223,
    116, 5, 74, 83, 90, 153, 41, 33, 6, 77, 36, 232, 113, 96, 218, 56, 124, 124,
    53, 181, 221, 188, 146, 187, 129, 228, 31, 168, 64, 65, 5, 68, 141, 234, 80,
    75, 193, 170, 251, 176, 86, 115, 44, 126, 106, 226, 234, 157, 196, 73, 209,
    145, 120, 75, 128, 109, 186, 186, 176, 148, 183, 196, 203, 29, 177, 1, 1, 0,
    13, 72, 101, 108, 108, 111, 44, 32, 119, 111, 114, 108, 100, 33,
  ]),
  signatures: {
    BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP: new Uint8Array([
      152, 162, 234, 146, 128, 220, 242, 41, 142, 185, 172, 182, 228, 129, 252,
      194, 76, 217, 108, 40, 115, 143, 124, 20, 32, 89, 93, 193, 221, 197, 206,
      27, 126, 37, 56, 210, 18, 119, 5, 78, 78, 147, 30, 32, 68, 156, 59, 243,
      55, 63, 97, 50, 155, 64, 214, 189, 169, 140, 7, 101, 200, 6, 33, 15,
    ]),
  },
};

const signedTransactionBase64Encoded =
  'AZii6pKA3PIpjrmstuSB/MJM2Wwoc498FCBZXcHdxc4bfiU40hJ3BU5Okx4gRJw78zc/YTKbQNa9qYwHZcgGIQ8BAAECmbACj52erzKG4pHtCleCP7nI8UzNXBWIS51YT1n433QFSlNamSkhBk0k6HFg2jh8fDW13bySu4HkH6hAQQVEjepQS8Gq+7BWcyx+auLqncRJ0ZF4S4BturqwlLfEyx2xAQEADUhlbGxvLCB3b3JsZCE=';

const signature =
  '43ztQkS88n29KXdmSDdKcNPKVtaR5J3JgWzfDdFrZMFL5kdkgRZWuLKNsJRJMSgdHjbgsJhWMyUzkySGMxjPtuiW';

export const MOCK_EXECUTION_SCENARIO_NO_OP_WITH_HELLO_WORLD_DATA: MockExecutionScenario =
  {
    name: 'NoOp with Hello World Data',
    scope,
    fromAccount: signer,
    toAccount: signer,
    fromAccountPrivateKeyBytes,
    transactionMessage,
    transactionMessageBase64Encoded,
    signedTransaction,
    signedTransactionBase64Encoded,
    signature,
  };
