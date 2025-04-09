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
    blockhash: 'GmfR6QBrCj6ypdyrJFpBNUjUMZaTazXHG9bVczYAWsVS',
    lastValidBlockHeight: 18446744073709551615n,
  },
  messageBytes: new Uint8Array([
    1, 0, 2, 3, 153, 176, 2, 143, 157, 158, 175, 50, 134, 226, 145, 237, 10, 87,
    130, 63, 185, 200, 241, 76, 205, 92, 21, 136, 75, 157, 88, 79, 89, 248, 223,
    116, 3, 6, 70, 111, 229, 33, 23, 50, 255, 236, 173, 186, 114, 195, 155, 231,
    188, 140, 229, 187, 197, 247, 18, 107, 44, 67, 155, 58, 64, 0, 0, 0, 5, 74,
    83, 90, 153, 41, 33, 6, 77, 36, 232, 113, 96, 218, 56, 124, 124, 53, 181,
    221, 188, 146, 187, 129, 228, 31, 168, 64, 65, 5, 68, 141, 234, 80, 75, 193,
    170, 251, 176, 86, 115, 44, 126, 106, 226, 234, 157, 196, 73, 209, 145, 120,
    75, 128, 109, 186, 186, 176, 148, 183, 196, 203, 29, 177, 3, 1, 0, 9, 3, 16,
    39, 0, 0, 0, 0, 0, 0, 2, 0, 13, 72, 101, 108, 108, 111, 44, 32, 119, 111,
    114, 108, 100, 33, 1, 0, 5, 2, 64, 13, 3, 0,
  ]),
  signatures: {
    BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP: new Uint8Array([
      42, 147, 159, 63, 47, 151, 209, 112, 102, 32, 45, 149, 126, 224, 34, 52,
      4, 92, 154, 222, 109, 219, 132, 255, 198, 106, 93, 62, 2, 43, 62, 57, 82,
      112, 133, 209, 230, 23, 12, 95, 109, 102, 10, 110, 46, 110, 166, 170, 147,
      98, 11, 9, 22, 182, 178, 138, 239, 49, 114, 94, 194, 121, 34, 0,
    ]),
  },
};
const signedTransactionBase64Encoded =
  'ASqTnz8vl9FwZiAtlX7gIjQEXJrebduE/8ZqXT4CKz45UnCF0eYXDF9tZgpuLm6mqpNiCwkWtrKK7zFyXsJ5IgABAAIDmbACj52erzKG4pHtCleCP7nI8UzNXBWIS51YT1n433QDBkZv5SEXMv/srbpyw5vnvIzlu8X3EmssQ5s6QAAAAAVKU1qZKSEGTSTocWDaOHx8NbXdvJK7geQfqEBBBUSN6lBLwar7sFZzLH5q4uqdxEnRkXhLgG26urCUt8TLHbEDAQAJAxAnAAAAAAAAAgANSGVsbG8sIHdvcmxkIQEABQJADQMA';

const signature =
  'rNaqYcw7VsWYcjHALq7nqmSXhYoUQ87hWWakzdztfsny5UGWrKYoLNwFbw9jADtAhfEdXNwyBAWn6MQkYt7UXcb';

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
