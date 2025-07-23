import { TransactionStatus, type Transaction } from '@metamask/keyring-api';
import { cloneDeep } from 'lodash';

import {
  MOCK_SOLANA_KEYRING_ACCOUNT_0,
  MOCK_SOLANA_KEYRING_ACCOUNT_1,
} from '../../test/mocks/solana-keyring-accounts';
import { InMemoryState } from '../state/InMemoryState';
import type { IStateManager } from '../state/IStateManager';
import type { UnencryptedStateValue } from '../state/State';
import { DEFAULT_UNENCRYPTED_STATE } from '../state/State';
import { TransactionsRepository } from './TransactionsRepository';

describe('TransactionsRepository', () => {
  let repository: TransactionsRepository;
  let mockState: IStateManager<UnencryptedStateValue>;

  const mockAccount0 = MOCK_SOLANA_KEYRING_ACCOUNT_0;
  const mockAccount1 = MOCK_SOLANA_KEYRING_ACCOUNT_1;

  const createMockTransaction = (
    accountId: string,
    signature: string,
    status: TransactionStatus = TransactionStatus.Confirmed,
    timestamp = 1234567890,
  ) =>
    ({
      account: accountId,
      id: signature,
      status,
      timestamp,
    }) as unknown as Transaction;

  // Create two transactions for account 0
  const mockTransaction00 = createMockTransaction(
    mockAccount0.id,
    'mock-signature-00',
  );
  const mockTransaction01 = createMockTransaction(
    mockAccount0.id,
    'mock-signature-01',
  );

  // Create one transaction for account 1
  const mockTransaction10 = createMockTransaction(
    mockAccount1.id,
    'mock-signature-10',
  );

  beforeEach(() => {
    jest.clearAllMocks();
    mockState = new InMemoryState(cloneDeep(DEFAULT_UNENCRYPTED_STATE));
    repository = new TransactionsRepository(mockState);
  });

  describe('findByAccountId', () => {
    it('returns an empty array when there are no transactions', async () => {
      const transactions = await repository.findByAccountId(mockAccount0.id);
      expect(transactions).toStrictEqual([]);
    });

    it('returns the transactions for the given account', async () => {
      // Init a state with two transactions for account 0
      await mockState.update((state) => ({
        ...state,
        transactions: {
          [mockAccount0.id]: [mockTransaction00, mockTransaction01],
        },
      }));

      const transactions = await repository.findByAccountId(mockAccount0.id);
      expect(transactions).toStrictEqual([
        mockTransaction00,
        mockTransaction01,
      ]);
    });
  });

  describe('save', () => {
    it('saves a transaction to the state', async () => {
      const stateUpdateSpy = jest.spyOn(mockState, 'update');

      await repository.save(mockTransaction00);

      expect(stateUpdateSpy).toHaveBeenCalledTimes(1);

      const state = await mockState.get();
      expect(state).toStrictEqual({
        ...DEFAULT_UNENCRYPTED_STATE,
        transactions: {
          [mockAccount0.id]: [mockTransaction00],
        },
      });
    });
  });

  describe('saveMany', () => {
    it('saves transactions to the state when there are no existing transactions', async () => {
      // Initially the state has no transactions

      const stateUpdateSpy = jest.spyOn(mockState, 'update');

      await repository.saveMany([
        mockTransaction00,
        mockTransaction01,
        mockTransaction10,
      ]);

      expect(stateUpdateSpy).toHaveBeenCalledTimes(1);

      const state = await mockState.get();
      expect(state).toStrictEqual({
        ...DEFAULT_UNENCRYPTED_STATE,
        transactions: {
          [mockAccount0.id]: [mockTransaction00, mockTransaction01],
          [mockAccount1.id]: [mockTransaction10],
        },
      });
    });

    it('adds new transactions to the state', async () => {
      // Init a state with one transaction
      const mockStateValue = {
        ...DEFAULT_UNENCRYPTED_STATE,
        transactions: {
          [mockAccount0.id]: [mockTransaction00],
        },
      };
      await mockState.update(() => mockStateValue);
      const stateUpdateSpy = jest.spyOn(mockState, 'update');

      await repository.saveMany([mockTransaction01, mockTransaction10]);

      expect(stateUpdateSpy).toHaveBeenCalledTimes(1);

      const state = await mockState.get();
      expect(state).toStrictEqual({
        ...mockStateValue,
        transactions: {
          [mockAccount0.id]: [mockTransaction00, mockTransaction01],
          [mockAccount1.id]: [mockTransaction10],
        },
      });
    });

    it('overrides existing transactions', async () => {
      const mockStateValue = {
        ...DEFAULT_UNENCRYPTED_STATE,
        transactions: {
          [mockAccount0.id]: [mockTransaction00],
        },
      };
      await mockState.update(() => mockStateValue);
      const stateUpdateSpy = jest.spyOn(mockState, 'update');

      const mockTransaction00Overridden = {
        ...mockTransaction00,
        status: TransactionStatus.Failed,
      };

      await repository.saveMany([mockTransaction00Overridden]);

      expect(stateUpdateSpy).toHaveBeenCalledTimes(1);

      const state = await mockState.get();
      expect(state).toStrictEqual({
        ...mockStateValue,
        transactions: {
          [mockAccount0.id]: [mockTransaction00Overridden],
        },
      });
    });

    it('sorts transactions by timestamp in descending order', async () => {
      const mockOldTransaction = createMockTransaction(
        mockAccount0.id,
        'mock-signature-old',
        TransactionStatus.Confirmed,
        123,
      );

      const mockRecentTransaction = createMockTransaction(
        mockAccount0.id,
        'mock-signature-recent',
        TransactionStatus.Confirmed,
        999,
      );

      // Pass the transactions in reverse order to test the sorting
      await repository.saveMany([mockOldTransaction, mockRecentTransaction]);

      const state = await mockState.get();
      expect(state).toStrictEqual({
        ...DEFAULT_UNENCRYPTED_STATE,
        transactions: {
          [mockAccount0.id]: [mockRecentTransaction, mockOldTransaction],
        },
      });
    });
  });
});
