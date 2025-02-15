/* eslint-disable no-restricted-globals */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-require-imports */
import type {
  Blockhash,
  KeyPairSigner,
  Rpc,
  SolanaRpcApi,
} from '@solana/web3.js';
import { address, type Address, type MaybeAccount } from '@solana/web3.js';

import {
  KnownCaip19Id,
  Network,
  TokenMetadata,
} from '../../../constants/solana';
import {
  MOCK_SOLANA_KEYRING_ACCOUNTS,
  MOCK_SOLANA_KEYRING_ACCOUNTS_PRIVATE_KEY_BYTES,
} from '../../../test/mocks/solana-keyring-accounts';
import { mockLogger } from '../../mocks/logger';
import { createMockConnection } from '../../mocks/mockConnection';
import type { TransactionHelper } from '../TransactionHelper';
import type { Exists, MaybeHasDecimals } from './SendSplTokenBuilder';
import { SendSplTokenBuilder } from './SendSplTokenBuilder';

jest.mock('@solana/web3.js', () => ({
  ...jest.requireActual('@solana/web3.js'),
  fetchJsonParsedAccount: jest.fn(),
}));

jest.mock('../../../utils/deriveSolanaPrivateKey', () => ({
  deriveSolanaPrivateKey: jest.fn().mockImplementation((index) => {
    const account = MOCK_SOLANA_KEYRING_ACCOUNTS[index];
    if (!account) {
      throw new Error('[deriveSolanaAddress] Not enough mocked indices');
    }
    return {
      privateKeyBytes:
        MOCK_SOLANA_KEYRING_ACCOUNTS_PRIVATE_KEY_BYTES[account.id],
      publicKeyBytes: null, // We don't need public key bytes for the tests
    };
  }),
}));

describe('SendSplTokenBuilder', () => {
  const mockConnection = createMockConnection();

  const mockTransactionHelper = {
    sendTransaction: jest.fn(),
    getLatestBlockhash: jest.fn(),
    getTokenMintInfo: jest.fn(),
    getComputeUnitEstimate: jest.fn(),
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
      const mockFromTokenAccount = {
        exists: true,
        address: 'fromTokenAccount' as Address,
      } as unknown as MaybeAccount<any> & Exists;

      const mockToTokenAccount = {
        exists: true,
        address: 'toTokenAccount' as Address,
      } as unknown as MaybeAccount<any> & Exists;

      jest
        .spyOn(sendSplTokenBuilder, 'getOrCreateAssociatedTokenAccount')
        .mockResolvedValueOnce(mockFromTokenAccount)
        .mockResolvedValueOnce(mockToTokenAccount);

      // Mock token accounts
      const mockTokenAccount = {
        exists: true,
        data: { decimals: 6 },
      } as unknown as MaybeAccount<MaybeHasDecimals> & Exists;

      jest
        .spyOn(sendSplTokenBuilder, 'getTokenAccount')
        .mockResolvedValue(mockTokenAccount);

      const transactionMessage =
        await sendSplTokenBuilder.buildTransactionMessage(
          mockFrom,
          mockTo,
          mockMint,
          mockAmount,
          mockNetwork,
        );

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
            data: Uint8Array.from([2, 64, 13, 3, 0]),
            programAddress: 'ComputeBudget111111111111111111111111111111',
          },
          {
            accounts: [
              {
                address: 'fromTokenAccount',
                role: 1,
              },
              {
                address: 'toTokenAccount',
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
    });
  });

  describe('getOrCreateAssociatedTokenAccount', () => {
    const mockMint = 'mockMintAddress' as Address;
    const mockOwner = 'mockOwnerAddress' as Address;
    const mockNetwork = Network.Localnet;
    const mockPayer = {} as unknown as KeyPairSigner;

    it('returns existing associated token account', async () => {
      const mockAccount = {
        exists: true,
        address: 'mockAddress' as Address,
      } as unknown as MaybeAccount<any> & Exists;

      jest
        .spyOn(sendSplTokenBuilder, 'getAssociatedTokenAccount')
        .mockResolvedValue(mockAccount);

      const result =
        await sendSplTokenBuilder.getOrCreateAssociatedTokenAccount(
          mockMint,
          mockOwner,
          mockNetwork,
        );

      expect(result).toStrictEqual(mockAccount);
    });

    it('creates new associated token account if it does not exist', async () => {
      const mockNonExistingAccount = {
        exists: false,
      } as unknown as MaybeAccount<any>;

      const mockNewAccount = {
        exists: true,
        address: 'mockNewAddress' as Address,
      } as unknown as MaybeAccount<any> & Exists;

      jest
        .spyOn(sendSplTokenBuilder, 'getAssociatedTokenAccount')
        .mockResolvedValueOnce(mockNonExistingAccount);

      jest
        .spyOn(sendSplTokenBuilder, 'createAssociatedTokenAccount')
        .mockResolvedValue(mockNewAccount);

      const result =
        await sendSplTokenBuilder.getOrCreateAssociatedTokenAccount(
          mockMint,
          mockOwner,
          mockNetwork,
          mockPayer,
        );

      expect(result).toStrictEqual(mockNewAccount);
    });

    it('throws error if payer is not provided for new account creation', async () => {
      const mockNonExistingAccount = {
        exists: false,
      } as unknown as MaybeAccount<any>;

      jest
        .spyOn(sendSplTokenBuilder, 'getAssociatedTokenAccount')
        .mockResolvedValue(mockNonExistingAccount);

      await expect(
        sendSplTokenBuilder.getOrCreateAssociatedTokenAccount(
          mockMint,
          mockOwner,
          mockNetwork,
        ),
      ).rejects.toThrow('Payer is required to create associated token account');
    });
  });

  describe('getAssociatedTokenAccount', () => {
    const mockMint = '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU' as Address;
    const mockOwner = address(MOCK_SOLANA_KEYRING_ACCOUNTS[0].address);
    const mockNetwork = Network.Localnet;

    it('returns associated token account', async () => {
      const mockAccount = {
        exists: true,
        address: 'mockAddress' as Address,
      } as unknown as MaybeAccount<any>;

      jest
        .spyOn(sendSplTokenBuilder, 'getTokenAccount')
        .mockResolvedValue(mockAccount);

      const result = await sendSplTokenBuilder.getAssociatedTokenAccount(
        mockMint,
        mockOwner,
        mockNetwork,
      );

      expect(result).toStrictEqual(mockAccount);
    });

    it('handles non-existent associated token account', async () => {
      const mockNonExistingAccount = {
        exists: false,
      } as unknown as MaybeAccount<any>;

      jest
        .spyOn(sendSplTokenBuilder, 'getTokenAccount')
        .mockResolvedValue(mockNonExistingAccount);

      const result = await sendSplTokenBuilder.getAssociatedTokenAccount(
        mockMint,
        mockOwner,
        mockNetwork,
      );

      expect(result).toStrictEqual(mockNonExistingAccount);
    });
  });

  describe('createAssociatedTokenAccount', () => {
    const mockMint = '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU' as Address;
    const mockOwner = address(MOCK_SOLANA_KEYRING_ACCOUNTS[0].address);
    const mockNetwork = Network.Localnet;
    const mockPayer = {
      address: 'mockPayerAddress' as Address,
    } as unknown as KeyPairSigner;

    it('creates new associated token account', async () => {
      const mockNonExistingAccount = {
        exists: false,
      } as unknown as MaybeAccount<any>;

      const mockNewAccount = {
        exists: true,
        address: 'mockNewAddress' as Address,
      } as unknown as MaybeAccount<any> & Exists;

      jest
        .spyOn(sendSplTokenBuilder, 'getAssociatedTokenAccount')
        .mockResolvedValue(mockNonExistingAccount);

      jest
        .spyOn(sendSplTokenBuilder, 'getTokenAccount')
        .mockResolvedValueOnce(mockNonExistingAccount)
        .mockResolvedValueOnce(mockNewAccount);

      const mockBlockhash = {
        blockhash: 'blockhash123' as Blockhash,
        lastValidBlockHeight: BigInt(1),
      };

      jest
        .spyOn(mockTransactionHelper, 'getLatestBlockhash')
        .mockResolvedValue(mockBlockhash);

      jest
        .spyOn(mockTransactionHelper, 'sendTransaction')
        .mockResolvedValue('mockSignature');

      const result = await sendSplTokenBuilder.createAssociatedTokenAccount(
        mockMint,
        mockOwner,
        mockNetwork,
        mockPayer,
      );

      expect(result).toStrictEqual(mockNewAccount);
      expect(mockTransactionHelper.sendTransaction).toHaveBeenCalled();
    });

    it('throws error if account already exists', async () => {
      const mockExistingAccount = {
        exists: true,
        address: 'mockAddress' as Address,
      } as unknown as MaybeAccount<any>;

      jest
        .spyOn(sendSplTokenBuilder, 'getAssociatedTokenAccount')
        .mockResolvedValue(mockExistingAccount);

      await expect(
        sendSplTokenBuilder.createAssociatedTokenAccount(
          mockMint,
          mockOwner,
          mockNetwork,
          mockPayer,
        ),
      ).rejects.toThrow('Token account exists');
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
        require('@solana/web3.js'),
        'fetchJsonParsedAccount',
      );
      fetchJsonParsedAccountSpy.mockResolvedValue(mockTokenAccount);

      const result = await sendSplTokenBuilder.getTokenAccount(
        mockMint,
        mockNetwork,
      );

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
        require('@solana/web3.js'),
        'fetchJsonParsedAccount',
      );
      fetchJsonParsedAccountSpy.mockResolvedValue(mockNonExistingAccount);

      const result = await sendSplTokenBuilder.getTokenAccount(
        mockMint,
        mockNetwork,
      );

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
      } as unknown as MaybeAccount<any> & Exists;

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
