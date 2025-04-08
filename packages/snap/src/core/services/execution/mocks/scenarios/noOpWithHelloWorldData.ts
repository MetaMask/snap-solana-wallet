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
    1, 0, 2, 3, 153, 176, 2, 143, 157, 158, 175, 50, 134, 226, 145, 237, 10, 87,
    130, 63, 185, 200, 241, 76, 205, 92, 21, 136, 75, 157, 88, 79, 89, 248, 223,
    116, 3, 6, 70, 111, 229, 33, 23, 50, 255, 236, 173, 186, 114, 195, 155, 231,
    188, 140, 229, 187, 197, 247, 18, 107, 44, 67, 155, 58, 64, 0, 0, 0, 5, 74,
    83, 90, 153, 41, 33, 6, 77, 36, 232, 113, 96, 218, 56, 124, 124, 53, 181,
    221, 188, 146, 187, 129, 228, 31, 168, 64, 65, 5, 68, 141, 234, 80, 75, 193,
    170, 251, 176, 86, 115, 44, 126, 106, 226, 234, 157, 196, 73, 209, 145, 120,
    75, 128, 109, 186, 186, 176, 148, 183, 196, 203, 29, 177, 3, 1, 0, 9, 3,
    232, 3, 0, 0, 0, 0, 0, 0, 1, 0, 5, 2, 64, 13, 3, 0, 2, 0, 13, 72, 101, 108,
    108, 111, 44, 32, 119, 111, 114, 108, 100, 33,
  ]),
  signatures: {
    BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP: new Uint8Array([
      93, 67, 122, 239, 100, 5, 98, 237, 238, 37, 156, 196, 241, 135, 68, 96,
      178, 56, 55, 6, 162, 57, 31, 130, 157, 45, 7, 197, 165, 234, 185, 227,
      210, 34, 78, 22, 208, 180, 218, 242, 192, 99, 69, 120, 174, 142, 167, 175,
      253, 243, 118, 189, 224, 207, 101, 226, 199, 131, 107, 74, 130, 69, 150,
      10,
    ]),
  },
};

const signedTransactionBase64Encoded =
  'AV1Deu9kBWLt7iWcxPGHRGCyODcGojkfgp0tB8Wl6rnj0iJOFtC02vLAY0V4ro6nr/3zdr3gz2Xix4NrSoJFlgoBAAIDmbACj52erzKG4pHtCleCP7nI8UzNXBWIS51YT1n433QDBkZv5SEXMv/srbpyw5vnvIzlu8X3EmssQ5s6QAAAAAVKU1qZKSEGTSTocWDaOHx8NbXdvJK7geQfqEBBBUSN6lBLwar7sFZzLH5q4uqdxEnRkXhLgG26urCUt8TLHbEDAQAJA+gDAAAAAAAAAQAFAkANAwACAA1IZWxsbywgd29ybGQh';

const signature =
  '2s9eFBtEfKyxrEXEgdMcmeqNAaZY1Zcko6tRwTkxPZJT5Da3hLGpVorxUDe6N5vWiZBxtw3cfYVBMcUfo87hbQGR';

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
