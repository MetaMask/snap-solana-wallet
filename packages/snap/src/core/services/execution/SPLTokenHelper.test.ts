/* eslint-disable no-restricted-globals */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-require-imports */
import type {
  Blockhash,
  KeyPairSigner,
  Rpc,
  SolanaRpcApi,
} from '@solana/web3.js';
import {
  address,
  createKeyPairSignerFromPrivateKeyBytes,
  type Address,
  type MaybeAccount,
} from '@solana/web3.js';

import { Network } from '../../constants/solana';
import { MOCK_SOLANA_KEYRING_ACCOUNTS } from '../../test/mocks/solana-keyring-accounts';
import { createMockConnection } from '../mocks/mockConnection';
import type { Exists, MaybeHasDecimals } from './SplTokenHelper';
import { SplTokenHelper } from './SplTokenHelper';
import type { TransactionHelper } from './TransactionHelper';

jest.mock('@solana/web3.js', () => ({
  ...jest.requireActual('@solana/web3.js'),
  createKeyPairSignerFromPrivateKeyBytes: jest.fn(),
}));

describe('SplTokenHelper', () => {
  const mockConnection = createMockConnection();

  const mockTransactionHelper = {
    sendTransaction: jest.fn(),
    getLatestBlockhash: jest.fn(),
    calculateCostInLamports: jest.fn(),
    getTokenMintInfo: jest.fn(),
    getComputeUnitEstimate: jest.fn(),
  } as unknown as TransactionHelper;

  const mockLogger = {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    log: jest.fn(),
  };

  let splTokenHelper: SplTokenHelper;

  beforeEach(() => {
    jest.clearAllMocks();
    splTokenHelper = new SplTokenHelper(
      mockConnection,
      mockTransactionHelper,
      mockLogger,
    );
  });

  describe('transferSplToken', () => {
    const mockFrom = MOCK_SOLANA_KEYRING_ACCOUNTS[0];
    const mockTo = MOCK_SOLANA_KEYRING_ACCOUNTS[1];
    const mockMint = 'mockMintAddress' as Address;
    const mockNetwork = Network.Localnet;
    const mockSigner = {
      address: 'mockSignerAddress' as Address,
      signTransaction: jest.fn(),
    };

    beforeEach(() => {
      (createKeyPairSignerFromPrivateKeyBytes as jest.Mock).mockResolvedValue(
        mockSigner,
      );
      mockFrom.privateKeyBytesAsNum = [1, 2, 3];
    });

    it('should successfully transfer SPL tokens', async () => {
      const mockAssociatedTokenAccountSender = {
        exists: true,
        address: 'mockAssociatedTokenAddressSender' as Address,
      } as unknown as MaybeAccount<any> & Exists;

      const mockAssociatedTokenAccountReceiver = {
        exists: true,
        address: 'mockAssociatedTokenAddress' as Address,
      } as unknown as MaybeAccount<any> & Exists;

      jest
        .spyOn(splTokenHelper, 'getOrCreateAssociatedTokenAccount')
        .mockResolvedValueOnce(mockAssociatedTokenAccountSender)
        .mockResolvedValueOnce(mockAssociatedTokenAccountReceiver);

      const mockTokenAccount = {
        exists: true,
        data: { decimals: 6 },
      } as unknown as MaybeAccount<MaybeHasDecimals> & Exists;

      jest
        .spyOn(splTokenHelper, 'getTokenAccount')
        .mockResolvedValue(mockTokenAccount);

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

      jest
        .spyOn(mockTransactionHelper, 'getComputeUnitEstimate')
        .mockResolvedValue(5000);

      const result = await splTokenHelper.transferSplToken(
        mockFrom,
        address(mockTo.address),
        mockMint,
        '1',
        mockNetwork,
      );

      expect(result).toBe('mockSignature');
      expect(mockTransactionHelper.sendTransaction).toHaveBeenCalled();
    });

    it('should throw error if transfer fails', async () => {
      const error = new Error('Transfer failed');
      jest
        .spyOn(splTokenHelper, 'getOrCreateAssociatedTokenAccount')
        .mockRejectedValue(error);

      await expect(
        splTokenHelper.transferSplToken(
          mockFrom,
          address(mockTo.address),
          mockMint,
          '1',
          mockNetwork,
        ),
      ).rejects.toThrow('Transfer failed');

      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('getOrCreateAssociatedTokenAccount', () => {
    const mockMint = 'mockMintAddress' as Address;
    const mockOwner = 'mockOwnerAddress' as Address;
    const mockNetwork = Network.Localnet;
    const mockPayer = {} as unknown as KeyPairSigner;

    it('should return existing associated token account', async () => {
      const mockAccount = {
        exists: true,
        address: 'mockAddress' as Address,
      } as unknown as MaybeAccount<any> & Exists;

      jest
        .spyOn(splTokenHelper, 'getAssociatedTokenAccount')
        .mockResolvedValue(mockAccount);

      const result = await splTokenHelper.getOrCreateAssociatedTokenAccount(
        mockMint,
        mockOwner,
        mockNetwork,
      );

      expect(result).toStrictEqual(mockAccount);
    });

    it('should create new associated token account if it does not exist', async () => {
      const mockNonExistingAccount = {
        exists: false,
      } as unknown as MaybeAccount<any>;

      const mockNewAccount = {
        exists: true,
        address: 'mockNewAddress' as Address,
      } as unknown as MaybeAccount<any> & Exists;

      jest
        .spyOn(splTokenHelper, 'getAssociatedTokenAccount')
        .mockResolvedValueOnce(mockNonExistingAccount);

      jest
        .spyOn(splTokenHelper, 'createAssociatedTokenAccount')
        .mockResolvedValue(mockNewAccount);

      const result = await splTokenHelper.getOrCreateAssociatedTokenAccount(
        mockMint,
        mockOwner,
        mockNetwork,
        mockPayer,
      );

      expect(result).toStrictEqual(mockNewAccount);
    });

    it('should throw error if payer is not provided for new account creation', async () => {
      const mockNonExistingAccount = {
        exists: false,
      } as unknown as MaybeAccount<any>;

      jest
        .spyOn(splTokenHelper, 'getAssociatedTokenAccount')
        .mockResolvedValue(mockNonExistingAccount);

      await expect(
        splTokenHelper.getOrCreateAssociatedTokenAccount(
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

    it('should return associated token account', async () => {
      const mockAccount = {
        exists: true,
        address: 'mockAddress' as Address,
      } as unknown as MaybeAccount<any>;

      jest
        .spyOn(splTokenHelper, 'getTokenAccount')
        .mockResolvedValue(mockAccount);

      const result = await splTokenHelper.getAssociatedTokenAccount(
        mockMint,
        mockOwner,
        mockNetwork,
      );

      expect(result).toStrictEqual(mockAccount);
    });

    it('should handle non-existent associated token account', async () => {
      const mockNonExistingAccount = {
        exists: false,
      } as unknown as MaybeAccount<any>;

      jest
        .spyOn(splTokenHelper, 'getTokenAccount')
        .mockResolvedValue(mockNonExistingAccount);

      const result = await splTokenHelper.getAssociatedTokenAccount(
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

    it('should create new associated token account', async () => {
      const mockNonExistingAccount = {
        exists: false,
      } as unknown as MaybeAccount<any>;

      const mockNewAccount = {
        exists: true,
        address: 'mockNewAddress' as Address,
      } as unknown as MaybeAccount<any> & Exists;

      jest
        .spyOn(splTokenHelper, 'getAssociatedTokenAccount')
        .mockResolvedValue(mockNonExistingAccount);

      jest
        .spyOn(splTokenHelper, 'getTokenAccount')
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

      const result = await splTokenHelper.createAssociatedTokenAccount(
        mockMint,
        mockOwner,
        mockNetwork,
        mockPayer,
      );

      expect(result).toStrictEqual(mockNewAccount);
      expect(mockTransactionHelper.sendTransaction).toHaveBeenCalled();
    });

    it('should throw error if account already exists', async () => {
      const mockExistingAccount = {
        exists: true,
        address: 'mockAddress' as Address,
      } as unknown as MaybeAccount<any>;

      jest
        .spyOn(splTokenHelper, 'getAssociatedTokenAccount')
        .mockResolvedValue(mockExistingAccount);

      await expect(
        splTokenHelper.createAssociatedTokenAccount(
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

    it('should return token account when it exists', async () => {
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

      const result = await splTokenHelper.getTokenAccount(
        mockMint,
        mockNetwork,
      );

      expect(result).toStrictEqual(mockTokenAccount);
      expect(mockConnection.getRpc).toHaveBeenCalledWith(mockNetwork);
      expect(fetchJsonParsedAccountSpy).toHaveBeenCalled();
    });

    it('should return non-existing account when token account does not exist', async () => {
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

      const result = await splTokenHelper.getTokenAccount(
        mockMint,
        mockNetwork,
      );

      expect(result).toStrictEqual(mockNonExistingAccount);
      expect(mockConnection.getRpc).toHaveBeenCalledWith(mockNetwork);
      expect(fetchJsonParsedAccountSpy).toHaveBeenCalled();
    });
  });

  describe('getDecimals', () => {
    it('should return decimals from token account', () => {
      const mockTokenAccount = {
        exists: true,
        data: { decimals: 6 },
      } as unknown as MaybeAccount<MaybeHasDecimals> & Exists;

      const result = splTokenHelper.getDecimals(mockTokenAccount);
      expect(result).toBe(6);
    });

    it('should throw error if account does not exist', () => {
      const mockTokenAccount = {
        exists: false,
      } as unknown as MaybeAccount<any> & Exists;

      expect(() => splTokenHelper.getDecimals(mockTokenAccount)).toThrow(
        'Token account does not exist',
      );
    });

    it('should throw error if decimals are not found', () => {
      const mockTokenAccount = {
        exists: true,
        data: {},
      } as unknown as MaybeAccount<any> & Exists;

      expect(() => splTokenHelper.getDecimals(mockTokenAccount)).toThrow(
        'Decimals not found',
      );
    });
  });

  describe('assertAccountDecoded', () => {
    it('should not throw for decoded account', () => {
      const mockDecodedAccount = {
        exists: true,
        data: { someField: 'value' },
      } as unknown as MaybeAccount<any> & Exists;

      expect(() => {
        SplTokenHelper.assertAccountDecoded(mockDecodedAccount);
      }).not.toThrow();
    });

    it('should throw for encoded account (Uint8Array)', () => {
      const mockEncodedAccount = {
        exists: true,
        data: new Uint8Array([1, 2, 3]),
      } as unknown as MaybeAccount<any> & Exists;

      expect(() => {
        SplTokenHelper.assertAccountDecoded(mockEncodedAccount);
      }).toThrow('Token account is encoded. Implement a decoder.');
    });

    it('should throw for non-existent account', () => {
      const mockNonExistentAccount = {
        exists: false,
        data: { someField: 'value' },
      } as unknown as MaybeAccount<any>;

      expect(() => {
        SplTokenHelper.assertAccountDecoded(mockNonExistentAccount);
      }).toThrow('Token account does not exist');
    });
  });
});
