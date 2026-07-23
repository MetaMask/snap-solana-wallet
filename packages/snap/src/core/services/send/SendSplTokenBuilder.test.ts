/* eslint-disable no-restricted-globals */

import type { Mint } from '@solana-program/token-2022';
/* eslint-disable @typescript-eslint/no-require-imports */
import { address, lamports } from '@solana/kit';
import type { Account } from '@solana/kit';
import type { Address } from '@solana/kit';
import { cloneDeep } from 'lodash';

import type { RecipientClassifier } from '..';
import { TokenHelper } from '..';
import { Network } from '../../constants/solana';
import { MOCK_SOLANA_KEYRING_ACCOUNTS } from '../../test/mocks/solana-keyring-accounts';
import type { SolanaConnection } from '../connection/SolanaConnection';
import { mockLogger } from '../mocks/logger';
import { createMockConnection } from '../mocks/mockConnection';
import { MOCK_MINT_ACCOUNT } from '../mocks/mockSolanaRpcResponses';
import { RecipientUnsupportedError } from './errors';
import { SendSplTokenBuilder } from './SendSplTokenBuilder';

// Mock the deriveSolanaKeypair function
jest.mock('../../../core/utils/deriveSolanaKeypair', () => ({
  deriveSolanaKeypair: jest.fn(),
}));

describe('SendSplTokenBuilder', () => {
  let mockTokenHelper: TokenHelper;
  let mockRecipientClassifier: RecipientClassifier;
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
    const { deriveSolanaKeypair } = require('../../utils/deriveSolanaKeypair');
    const {
      deriveSolanaKeypairMock,
    } = require('../../test/mocks/utils/deriveSolanaKeypair');
    deriveSolanaKeypair.mockImplementation(deriveSolanaKeypairMock);

    mockConnection = createMockConnection();

    mockTokenHelper = new TokenHelper(mockConnection);

    mockRecipientClassifier = {
      classify: jest.fn().mockResolvedValue({ type: 'SYSTEM' }),
    } as unknown as RecipientClassifier;

    jest
      .spyOn(mockTokenHelper, 'uiAmountToAmountForMint')
      .mockResolvedValue(mockAmountLamports);

    sendSplTokenBuilder = new SendSplTokenBuilder(
      mockTokenHelper,
      mockRecipientClassifier,
      mockConnection,
      mockLogger,
    );
  });

  describe('buildTransactionMessage', () => {
    it('successfully builds a transaction message for SPL token transfer to a system account', async () => {
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
          // Instruction CreateAssociatedTokenIdempotent
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
            programAddress: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL', // Create
          },
          // Instruction TransferChecked
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

    it('successfully builds a transaction message for SPL token transfer to a token account', async () => {
      jest
        .spyOn(mockRecipientClassifier, 'classify')
        .mockResolvedValue({ type: 'TOKEN_ACCOUNT', mint: mockMint });

      const transactionMessage =
        await sendSplTokenBuilder.buildTransactionMessage({
          from: mockFrom,
          to: mockTo,
          mint: mockMint,
          amount: mockAmount,
          network: mockNetwork,
        });

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
          // Note that there's no CreateAssociatedTokenIdempotent because the recipient is a token account
          // Instruction TransferChecked
          {
            accounts: [
              {
                address: '9wt9PfjPD3JCy5r7o4K1cTGiuTG7fq2pQhdDCdQALKjg',
                role: 1,
              },
              {
                address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
                role: 0,
              },
              {
                address: 'FvS1p2dQnhWNrHyuVpJRU5mkYRkSTrubXHs4XrAn3PGo',
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
            data: new Uint8Array([12, 0, 202, 154, 59, 0, 0, 0, 0, 6]),
            programAddress: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
          },
        ],
      });
    });

    it('throws an error if the recipient is unsupported', async () => {
      jest
        .spyOn(mockRecipientClassifier, 'classify')
        .mockResolvedValue({ type: 'UNSUPPORTED' });

      await expect(
        sendSplTokenBuilder.buildTransactionMessage({
          from: mockFrom,
          to: mockTo,
          mint: mockMint,
          amount: mockAmount,
          network: mockNetwork,
        }),
      ).rejects.toThrow(RecipientUnsupportedError);
    });
  });
});
