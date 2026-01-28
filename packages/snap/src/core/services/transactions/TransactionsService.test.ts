/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { type Transaction } from '@metamask/keyring-api';
import { address as asAddress } from '@solana/kit';

import { Network } from '../../constants/solana';
import {
  MOCK_SOLANA_KEYRING_ACCOUNT_0,
  MOCK_SOLANA_KEYRING_ACCOUNT_1,
} from '../../test/mocks/solana-keyring-accounts';
import { MOCK_GET_SIGNATURES_FOR_ADDRESS } from '../../test/mocks/transactions';
import { ADDRESS_1_TRANSACTION_1_DATA } from '../../test/mocks/transactions-data/address-1/transaction-1';
import type { AccountsService } from '../accounts/AccountsService';
import type { AssetsService } from '../assets/AssetsService';
import type { SolanaConnection } from '../connection/SolanaConnection';
import { mockLogger } from '../mocks/logger';
import { createMockConnection } from '../mocks/mockConnection';
import type { TransactionMapper } from './TransactionMapper';
import type { TransactionsRepository } from './TransactionsRepository';
import { TransactionsService } from './TransactionsService';

jest.mock('@metamask/keyring-snap-sdk', () => ({
  emitSnapKeyringEvent: jest.fn(),
}));

describe('TransactionsService', () => {
  let mockTransactionsRepository: TransactionsRepository;
  let mockTransactionMapper: TransactionMapper;
  let mockAccountsService: AccountsService;
  let mockConnection: SolanaConnection;
  let mockAssetsService: AssetsService;
  let service: TransactionsService;

  beforeEach(() => {
    mockTransactionsRepository = {
      findByAccountId: jest.fn(),
      saveMany: jest.fn(),
    } as unknown as TransactionsRepository;

    mockTransactionMapper = {
      mapRpcTransaction: jest.fn(),
    } as unknown as TransactionMapper;

    mockAssetsService = {
      getAssetsMetadata: jest.fn(),
    } as unknown as AssetsService;

    mockConnection = createMockConnection();

    mockAccountsService = {
      getAll: jest.fn(),
    } as unknown as AccountsService;

    service = new TransactionsService(
      mockTransactionsRepository,
      mockTransactionMapper,
      mockAccountsService,
      mockAssetsService,
      mockConnection,
      mockLogger,
    );

    const snap = {
      request: jest.fn(),
    };
    (globalThis as any).snap = snap;
  });

  describe('fetchBySignature', () => {
    const mockAccount = MOCK_SOLANA_KEYRING_ACCOUNT_0;
    const mockScope = Network.Mainnet;
    const mockTransactionData = ADDRESS_1_TRANSACTION_1_DATA;
    const mockMappedTransaction = {} as unknown as Transaction;
    const mockSignature = mockTransactionData.transaction.signatures[1]!;

    it('fetches and returns a transaction by signature', async () => {
      jest.spyOn(mockConnection, 'getRpc').mockReturnValue({
        getTransaction: jest.fn().mockReturnValue({
          send: jest.fn().mockResolvedValue(mockTransactionData),
        }),
      } as any);

      jest
        .spyOn(mockTransactionMapper, 'mapRpcTransaction')
        .mockResolvedValue(mockMappedTransaction);

      const result = await service.fetchBySignature(
        mockSignature,
        mockAccount,
        mockScope,
      );

      expect(result).toStrictEqual(mockMappedTransaction);
    });

    it('returns null if the transaction is not found', async () => {
      jest.spyOn(mockConnection, 'getRpc').mockReturnValue({
        getTransaction: jest.fn().mockReturnValue({
          send: jest.fn().mockResolvedValue(null),
        }),
      } as any);

      const result = await service.fetchBySignature(
        mockSignature,
        mockAccount,
        mockScope,
      );

      expect(result).toBeNull();
    });
  });

  describe('fetchLatestSignatures', () => {
    it('fetches and returns signatures for the given address', async () => {
      jest.spyOn(mockConnection, 'getRpc').mockReturnValue({
        getSignaturesForAddress: jest.fn().mockReturnValue({
          send: jest.fn().mockResolvedValue(MOCK_GET_SIGNATURES_FOR_ADDRESS),
        }),
      } as any);

      const result = await service.fetchLatestSignatures(
        Network.Localnet,
        asAddress('BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP'),
        { limit: 10 },
      );

      expect(result).toStrictEqual([
        '3B7H4E2ih3Tcas6um1izEBZagVfLoxSUfZSKkSNSu7mh4nAy7ZafaEgKhH4d1NBY2MMRWgyPX2LcMbKYwphR8dRq',
        '3Zj5XkvE1Uec1frjue6SK2ND2cqhKPvPkZ1ZFPwo2v9iL4NX4b4WWG1wPNEQdnJJU8sVx7MMHjSH1HxoR21vEjoV',
        '2qfNzGs15dt999rt1AUJ7D1oPQaukMPPmHR2u5ZmDo4cVtr1Pr2Dax4Jo7ryTpM8jxjtXLi5NHy4uyr68MVh5my6',
        '54Lz5p2zQNU6ngvyGtpeMYEdGoHG2D7ByPS2n3Wa4QNHzqTZ46sUemk1PxSrM6UieQ2i15XiRrTuxZyiPkg8V1vW',
        '2a5UXcyb6Gz8DH5MdumBvoGQiHLjTKfPcKrAGcsPrVSUjM9NRVUB1TuL1sNEj59nKBzfLm3Z2RvtsnCGZHa7KXPB',
        'yftYXx1xSmLiMeJ2mGkpZd7Xd13mtW7juWcRnihMhDz1zAeCrq5rPrw7WoCkhEcfUL7MwYCti9Q8bWRdJKZuris',
        '24pkWA6oUqtKs1nqx4ZFqW3DoeNcVHC57s1azr63EzaXsDNJAkejmyjB7QonVqvm3cC8cVtbN11jSWTu1xUurQZ9',
        '27kCW7f9RCWDkQSqSDrwvbJ3d8mgaFmLLu7GsVujJnp55ue8mQNHvphoVEEF32mXUWZSagdXNraZ7zszBENgAY7T',
        '5XpBS9D4bBhc4F69SJd3th19Xe8qhqPyJ3MKWhRLF3tbeHTbSLZSM9UUztJc7pLTASUd2jNR67y2W3Q6LogUnai7',
        '5iFQpCwAgiXebzuKxLfhePscR9EYRvRNRSx2Mbj12ed36zNkGmQMkg7ekFXjh88R3p75D6uNK45hgRxC6FyUDnhE',
      ]);
    });
  });

  describe('findByAccounts', () => {
    it('fetches and returns transactions for the given accounts', async () => {
      const mockAccount0 = MOCK_SOLANA_KEYRING_ACCOUNT_0;
      const mockAccount1 = MOCK_SOLANA_KEYRING_ACCOUNT_1;

      const mockTransaction00 = {} as unknown as Transaction;
      const mockTransaction01 = {} as unknown as Transaction;
      const mockTransaction10 = {} as unknown as Transaction;

      jest
        .spyOn(mockTransactionsRepository, 'findByAccountId')
        .mockResolvedValueOnce([mockTransaction00, mockTransaction01])
        .mockResolvedValueOnce([mockTransaction10]);

      const result = await service.findByAccounts([mockAccount0, mockAccount1]);

      expect(result).toStrictEqual([
        mockTransaction00,
        mockTransaction01,
        mockTransaction10,
      ]);
    });
  });

  describe('save', () => {
    it('saves a transaction', async () => {
      const mockTransaction = {} as unknown as Transaction;

      await service.save(mockTransaction);

      expect(mockTransactionsRepository.saveMany).toHaveBeenCalledWith([
        mockTransaction,
      ]);
    });
  });

  describe('saveMany', () => {
    it('saves multiple transactions', async () => {
      const transactions = [
        {} as unknown as Transaction,
        {} as unknown as Transaction,
      ];

      await service.saveMany(transactions);

      expect(mockTransactionsRepository.saveMany).toHaveBeenCalledWith(
        transactions,
      );
    });
  });
});
