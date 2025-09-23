/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable no-restricted-globals */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-require-imports */
import type { Mint } from '@solana-program/token-2022';
import type { Account } from '@solana/kit';
import { address, lamports, type Address } from '@solana/kit';
import { cloneDeep } from 'lodash';

import { Network } from '../../../core/constants/solana';
import { TokenHelper } from '../../../core/services';
import type { SolanaConnection } from '../../../core/services/connection/SolanaConnection';
import { mockLogger } from '../../../core/services/mocks/logger';
import { createMockConnection } from '../../../core/services/mocks/mockConnection';
import { MOCK_MINT_ACCOUNT } from '../../../core/services/mocks/mockSolanaRpcResponses';
import { MOCK_SOLANA_KEYRING_ACCOUNTS } from '../../../core/test/mocks/solana-keyring-accounts';
import { SendSplTokenBuilder } from './SendSplTokenBuilder';

// Mock the deriveSolanaKeypair function
jest.mock('../../../core/utils/deriveSolanaKeypair', () => ({
  deriveSolanaKeypair: jest.fn(),
}));

describe('SendSplTokenBuilder', () => {
  let mockTokenHelper: TokenHelper;
  let mockConnection: SolanaConnection;
  let sendSplTokenBuilder: SendSplTokenBuilder;

  const mockFrom = MOCK_SOLANA_KEYRING_ACCOUNTS[0];
  const mockTo = address(MOCK_SOLANA_KEYRING_ACCOUNTS[1].address);
  const mockMint = MOCK_MINT_ACCOUNT.address;
  const mockNetwork = Network.Localnet;
  const mockAmount = '1000';
  const mockAmountLamports = lamports(1000n * 10n ** 6n);

  const createMockMintAccount = (): Account<Mint, Address> =>
    cloneDeep(MOCK_MINT_ACCOUNT);

  beforeEach(() => {
    jest.clearAllMocks();

    // Set up the mock implementation
    const {
      deriveSolanaKeypair,
    } = require('../../../core/utils/deriveSolanaKeypair');
    const {
      deriveSolanaKeypairMock,
    } = require('../../../core/test/mocks/utils/deriveSolanaKeypair');
    deriveSolanaKeypair.mockImplementation(deriveSolanaKeypairMock);

    mockConnection = createMockConnection();

    mockTokenHelper = new TokenHelper(mockConnection);

    jest
      .spyOn(mockTokenHelper, 'uiAmountToAmountForMint')
      .mockResolvedValue(mockAmountLamports);

    sendSplTokenBuilder = new SendSplTokenBuilder(
      mockTokenHelper,
      mockConnection,
      mockLogger,
    );
  });

  describe('buildTransactionMessage', () => {
    it('successfully builds a transaction message for SPL token transfer', async () => {
      const mockMintAccount = createMockMintAccount();
      jest
        .spyOn(mockConnection, 'fetchMint')
        .mockResolvedValue(mockMintAccount);

      // Mock deriveAssociatedTokenAccountAddress (static method)
      const deriveAssociatedTokenAccountAddressSpy = jest.spyOn(
        SendSplTokenBuilder,
        'deriveAssociatedTokenAccountAddress',
      );
      deriveAssociatedTokenAccountAddressSpy
        .mockResolvedValueOnce('fromTokenAccountAddress' as Address) // from
        .mockResolvedValueOnce('toTokenAccountAddress' as Address); // to

      const transactionMessage =
        await sendSplTokenBuilder.buildTransactionMessage({
          from: mockFrom,
          to: mockTo,
          mint: mockMint,
          amount: mockAmount,
          network: mockNetwork,
        });

      // Verify the transaction message
      expect(transactionMessage).toStrictEqual({
        version: 0,
        feePayer: {
          address: 'BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP',
        },
        lifetimeConstraint: {
          blockhash: '8HSvyvQvdRoFkCPnrtqF3dAS4SpPEbMKUVTdrK9auMR',
          lastValidBlockHeight: 334650256n,
        },
        instructions: [
          {
            data: new Uint8Array([2, 64, 156, 0, 0]),
            programAddress: 'ComputeBudget111111111111111111111111111111',
          },
          {
            data: new Uint8Array([3, 16, 39, 0, 0, 0, 0, 0, 0]),
            programAddress: 'ComputeBudget111111111111111111111111111111',
          },
          {
            accounts: [
              {
                address: 'BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP',
                role: 3,
                signer: {
                  address: 'BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP',
                  keyPair: {
                    privateKey: expect.objectContaining({
                      algorithm: {
                        name: 'Ed25519',
                      },
                      extractable: false,
                      type: 'private',
                      usages: ['sign'],
                    }),
                    publicKey: expect.objectContaining({
                      algorithm: {
                        name: 'Ed25519',
                      },
                      extractable: true,
                      type: 'public',
                      usages: ['verify'],
                    }),
                  },
                  signMessages: expect.any(Function),
                  signTransactions: expect.any(Function),
                },
              },
              {
                address: 'toTokenAccountAddress',
                role: 1,
              },
              {
                address: 'FvS1p2dQnhWNrHyuVpJRU5mkYRkSTrubXHs4XrAn3PGo',
                role: 0,
              },
              {
                address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
                role: 0,
              },
              {
                address: '11111111111111111111111111111111',
                role: 0,
              },
              {
                address: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                role: 0,
              },
            ],
            data: Uint8Array.from([1]),
            programAddress: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
          },
          {
            accounts: [
              {
                address: 'fromTokenAccountAddress',
                role: 1,
              },
              {
                address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
                role: 0,
              },
              {
                address: 'toTokenAccountAddress',
                role: 1,
              },
              {
                address: 'BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP',
                role: 2,
                signer: {
                  address: 'BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP',
                  keyPair: {
                    privateKey: expect.objectContaining({
                      algorithm: {
                        name: 'Ed25519',
                      },
                      extractable: false,
                      type: 'private',
                      usages: ['sign'],
                    }),
                    publicKey: expect.objectContaining({
                      algorithm: {
                        name: 'Ed25519',
                      },
                      extractable: true,
                      type: 'public',
                      usages: ['verify'],
                    }),
                  },
                  signMessages: expect.any(Function),
                  signTransactions: expect.any(Function),
                },
              },
            ],
            data: Uint8Array.from([12, 0, 202, 154, 59, 0, 0, 0, 0, 6]),
            programAddress: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
          },
        ],
      });

      // Restore the static method spy
      deriveAssociatedTokenAccountAddressSpy.mockRestore();
    });
  });
});
