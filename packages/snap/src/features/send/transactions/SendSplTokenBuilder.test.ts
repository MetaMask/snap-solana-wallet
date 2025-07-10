/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable no-restricted-globals */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-require-imports */
import type { Blockhash, Rpc, SolanaRpcApi } from '@solana/kit';
import { address, type Address, type MaybeAccount } from '@solana/kit';

import {
  KnownCaip19Id,
  Network,
  TokenMetadata,
} from '../../../core/constants/solana';
import type { TransactionHelper } from '../../../core/services/execution/TransactionHelper';
import { mockLogger } from '../../../core/services/mocks/logger';
import { createMockConnection } from '../../../core/services/mocks/mockConnection';
import { MOCK_SOLANA_KEYRING_ACCOUNTS } from '../../../core/test/mocks/solana-keyring-accounts';
import { deriveSolanaKeypairMock } from '../../../core/test/mocks/utils/deriveSolanaKeypair';
import type { Exists, MaybeHasDecimals } from './SendSplTokenBuilder';
import { SendSplTokenBuilder } from './SendSplTokenBuilder';

jest.mock('@solana/kit', () => ({
  ...jest.requireActual('@solana/kit'),
  fetchJsonParsedAccount: jest.fn(),
  sendTransactionWithoutConfirmingFactory: jest
    .fn()
    .mockReturnValue(() => jest.fn()),
}));

jest.mock('../../../core/utils/deriveSolanaKeypair', () => ({
  deriveSolanaKeypair: deriveSolanaKeypairMock,
}));

describe('SendSplTokenBuilder', () => {
  const mockConnection = createMockConnection();

  const mockTransactionHelper = {
    sendTransaction: jest.fn(),
    getLatestBlockhash: jest.fn(),
    getTokenMintInfo: jest.fn(),
    getComputeUnitEstimate: jest.fn(),
    waitForTransactionCommitment: jest.fn(),
  } as unknown as TransactionHelper;

  let sendSplTokenBuilder: SendSplTokenBuilder;

  beforeEach(() => {
    jest.clearAllMocks();
    sendSplTokenBuilder = new SendSplTokenBuilder(
      mockConnection,
      mockTransactionHelper,
      mockLogger,
    );
  });

  // write unit tests for buildTransactionMessage, with actual content
  describe('buildTransactionMessage', () => {
    const mockFrom = MOCK_SOLANA_KEYRING_ACCOUNTS[0];
    const mockTo = address(MOCK_SOLANA_KEYRING_ACCOUNTS[1].address);
    const mockMint = address(TokenMetadata[KnownCaip19Id.UsdcLocalnet].address);
    const mockNetwork = Network.Localnet;
    const mockAmount = '1000';

    beforeEach(() => {
      jest
        .spyOn(mockTransactionHelper, 'getLatestBlockhash')
        .mockResolvedValue({
          blockhash: 'mockBlockhash' as Blockhash,
          lastValidBlockHeight: BigInt(1000),
        });

      jest
        .spyOn(mockTransactionHelper, 'getComputeUnitEstimate')
        .mockResolvedValue(200000);
    });

    it('successfully builds a transaction message for SPL token transfer', async () => {
      // Mock token account to get decimals and program ID
      const mockSplTokenAccount = {
        exists: true,
        address: mockMint,
        data: { decimals: 6 },
        programAddress: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
      } as unknown as MaybeAccount<MaybeHasDecimals> & Exists;

      jest
        .spyOn(sendSplTokenBuilder, 'getTokenAccount')
        .mockResolvedValue(mockSplTokenAccount);

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
          blockhash: 'mockBlockhash',
          lastValidBlockHeight: 1000n,
        },
        instructions: [
          {
            data: new Uint8Array([2, 48, 117, 0, 0]),
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
            data: Uint8Array.from([3, 0, 202, 154, 59, 0, 0, 0, 0]),
            programAddress: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
          },
        ],
      });

      // Restore the static method spy
      deriveAssociatedTokenAccountAddressSpy.mockRestore();
    });
  });

  describe('getTokenAccount', () => {
    const mockMint = '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU' as Address;
    const mockNetwork = Network.Localnet;

    it('returns token account when it exists', async () => {
      const mockTokenAccount = {
        exists: true,
        address: mockMint,
        data: { decimals: 6 },
      } as unknown as MaybeAccount<any>;

      jest.spyOn(mockConnection, 'getRpc').mockReturnValue({
        // Mock the minimum required RPC methods
        getAccountInfo: jest.fn(),
      } as unknown as Rpc<SolanaRpcApi>);

      // Mock the web3.js fetchJsonParsedAccount function
      const fetchJsonParsedAccountSpy = jest.spyOn(
        require('@solana/kit'),
        'fetchJsonParsedAccount',
      );
      fetchJsonParsedAccountSpy.mockResolvedValue(mockTokenAccount);

      const result = await sendSplTokenBuilder.getTokenAccount({
        mint: mockMint,
        network: mockNetwork,
      });

      expect(result).toStrictEqual(mockTokenAccount);
      expect(mockConnection.getRpc).toHaveBeenCalledWith(mockNetwork);
      expect(fetchJsonParsedAccountSpy).toHaveBeenCalled();
    });

    it('returns non-existing account when token account does not exist', async () => {
      const mockNonExistingAccount = {
        exists: false,
      } as unknown as MaybeAccount<any>;

      jest.spyOn(mockConnection, 'getRpc').mockReturnValue({
        getAccountInfo: jest.fn(),
      } as unknown as Rpc<SolanaRpcApi>);

      const fetchJsonParsedAccountSpy = jest.spyOn(
        require('@solana/kit'),
        'fetchJsonParsedAccount',
      );
      fetchJsonParsedAccountSpy.mockResolvedValue(mockNonExistingAccount);

      const result = await sendSplTokenBuilder.getTokenAccount({
        mint: mockMint,
        network: mockNetwork,
      });

      expect(result).toStrictEqual(mockNonExistingAccount);
      expect(mockConnection.getRpc).toHaveBeenCalledWith(mockNetwork);
      expect(fetchJsonParsedAccountSpy).toHaveBeenCalled();
    });
  });

  describe('getDecimals', () => {
    it('returns decimals from token account', () => {
      const mockTokenAccount = {
        exists: true,
        data: { decimals: 6 },
      } as unknown as MaybeAccount<MaybeHasDecimals> & Exists;

      const result = sendSplTokenBuilder.getDecimals(mockTokenAccount);
      expect(result).toBe(6);
    });

    it('throws error if account does not exist', () => {
      const mockTokenAccount = {
        exists: false,
      } as unknown as MaybeAccount<any>;

      expect(() => sendSplTokenBuilder.getDecimals(mockTokenAccount)).toThrow(
        'Token account does not exist',
      );
    });

    it('throws error if decimals are not found', () => {
      const mockTokenAccount = {
        exists: true,
        data: {},
      } as unknown as MaybeAccount<any> & Exists;

      expect(() => sendSplTokenBuilder.getDecimals(mockTokenAccount)).toThrow(
        'Decimals not found',
      );
    });
  });

  describe('assertAccountDecoded', () => {
    it('does not throw for decoded account', () => {
      const mockDecodedAccount = {
        exists: true,
        data: { someField: 'value' },
      } as unknown as MaybeAccount<any> & Exists;

      expect(() => {
        SendSplTokenBuilder.assertAccountDecoded(mockDecodedAccount);
      }).not.toThrow();
    });

    it('throws for encoded account (Uint8Array)', () => {
      const mockEncodedAccount = {
        exists: true,
        data: new Uint8Array([1, 2, 3]),
      } as unknown as MaybeAccount<any> & Exists;

      expect(() => {
        SendSplTokenBuilder.assertAccountDecoded(mockEncodedAccount);
      }).toThrow('Token account is encoded. Implement a decoder.');
    });

    it('throws for non-existent account', () => {
      const mockNonExistentAccount = {
        exists: false,
        data: { someField: 'value' },
      } as unknown as MaybeAccount<any>;

      expect(() => {
        SendSplTokenBuilder.assertAccountDecoded(mockNonExistentAccount);
      }).toThrow('Token account does not exist');
    });
  });
});
