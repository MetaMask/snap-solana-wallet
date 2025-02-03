import { KeyringEvent } from '@metamask/keyring-api';

import * as snapContext from '../../../snapContext';
import { Network } from '../../constants/solana';
import {
  MOCK_SOLANA_KEYRING_ACCOUNT_0,
  MOCK_SOLANA_KEYRING_ACCOUNT_1,
} from '../../test/mocks/solana-keyring-accounts';
import { ADDRESS_1_TRANSACTION_1_DATA } from '../../test/mocks/transactions-data/address-1/transaction-1';
import { ADDRESS_1_TRANSACTION_2_DATA } from '../../test/mocks/transactions-data/address-1/transaction-2';
import { ADDRESS_1_TRANSACTION_3_DATA } from '../../test/mocks/transactions-data/address-1/transaction-3';
import { ADDRESS_1_TRANSACTION_4_DATA } from '../../test/mocks/transactions-data/address-1/transaction-4';
import { ADDRESS_2_TRANSACTION_1_DATA } from '../../test/mocks/transactions-data/address-2/transaction-1';
import { ADDRESS_2_TRANSACTION_2_DATA } from '../../test/mocks/transactions-data/address-2/transaction-2';
import { ADDRESS_2_TRANSACTION_3_DATA } from '../../test/mocks/transactions-data/address-2/transaction-3';
import { ADDRESS_2_TRANSACTION_4_DATA } from '../../test/mocks/transactions-data/address-2/transaction-4';
import { refreshTransactions } from './refreshTransactions';

// Mock the snap context
let mockState = {};

jest.mock('../../../snapContext', () => ({
  state: {
    get: jest.fn(),
    update: jest.fn(async (updateFn) => {
      mockState = updateFn(mockState);
      return Promise.resolve(mockState);
    }),
  },
  keyring: {
    listAccounts: jest.fn(),
    emitEvent: jest.fn(),
  },
  transactionsService: {
    fetchLatestSignatures: jest.fn(async (scope, address) => {
      return Promise.resolve([]);
    }),
    getTransactionsDataFromSignatures: jest.fn(
      async ({ scope, signatures }) => {
        return Promise.resolve([]);
      },
    ),
  },
  configProvider: {
    get: jest.fn(() => {
      return {
        transactions: {
          storageLimit: 50,
        },
      };
    }),
  },
}));

describe('refreshTransactions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockState = {}; // Reset mock state before each test
  });

  describe('when transactions are already being fetched', () => {
    it('skips the run', async () => {
      (snapContext.state.get as jest.Mock).mockResolvedValue({
        isFetchingTransactions: true,
      });

      await refreshTransactions();

      expect(snapContext.keyring.listAccounts).not.toHaveBeenCalled();
      expect(
        snapContext.transactionsService.fetchLatestSignatures,
      ).not.toHaveBeenCalled();
      expect(snapContext.state.update).not.toHaveBeenCalled();
    });
  });

  describe('when no accounts are found', () => {
    it('skips the run', async () => {
      (snapContext.state.get as jest.Mock).mockResolvedValue({
        isFetchingTransactions: false,
      });
      (snapContext.keyring.listAccounts as jest.Mock).mockResolvedValue([]);

      await refreshTransactions();

      expect(
        snapContext.transactionsService.fetchLatestSignatures,
      ).not.toHaveBeenCalled();
      expect(snapContext.state.update).not.toHaveBeenCalled();
    });
  });

  describe('when there are transactions to be fetched', () => {
    it('fetches and stores new transactions for all accounts', async () => {
      const firstAccount = MOCK_SOLANA_KEYRING_ACCOUNT_0;
      const secondAccount = MOCK_SOLANA_KEYRING_ACCOUNT_1;

      const signature1 = ADDRESS_1_TRANSACTION_1_DATA.transaction.signatures[0];
      const signature2 = ADDRESS_1_TRANSACTION_2_DATA.transaction.signatures[0];
      const signature3 = ADDRESS_1_TRANSACTION_3_DATA.transaction.signatures[0];
      const signature4 = ADDRESS_1_TRANSACTION_4_DATA.transaction.signatures[0];
      const signature5 = ADDRESS_2_TRANSACTION_1_DATA.transaction.signatures[0];
      const signature6 = ADDRESS_2_TRANSACTION_2_DATA.transaction.signatures[0];
      const signature7 = ADDRESS_2_TRANSACTION_3_DATA.transaction.signatures[0];
      const signature8 = ADDRESS_2_TRANSACTION_4_DATA.transaction.signatures[0];

      // Store signatures by account and network for clearer test structure
      const MOCKED_NEW_SIGNATURES: any = {
        [Network.Mainnet]: {
          [firstAccount.address]: [signature1, signature2],
          [secondAccount.address]: [signature5, signature6],
        },
        [Network.Devnet]: {
          [firstAccount.address]: [signature3, signature4],
          [secondAccount.address]: [signature7, signature8],
        },
      };

      const MOCKED_TRANSACTIONS: any = {
        [Network.Mainnet]: [
          ADDRESS_1_TRANSACTION_1_DATA,
          ADDRESS_1_TRANSACTION_2_DATA,
          ADDRESS_2_TRANSACTION_1_DATA,
          ADDRESS_2_TRANSACTION_2_DATA,
        ],
        [Network.Devnet]: [
          ADDRESS_1_TRANSACTION_3_DATA,
          ADDRESS_1_TRANSACTION_4_DATA,
          ADDRESS_2_TRANSACTION_3_DATA,
          ADDRESS_2_TRANSACTION_4_DATA,
        ],
      };

      const initialState = {
        isFetchingTransactions: false,
        transactions: {
          [firstAccount.id]: [],
          [secondAccount.id]: [],
        },
      };

      (snapContext.state.get as jest.Mock).mockResolvedValue(initialState);
      (snapContext.keyring.listAccounts as jest.Mock).mockResolvedValue([
        firstAccount,
        secondAccount,
      ]);
      (snapContext.configProvider.get as jest.Mock).mockReturnValue({
        transactions: {
          storageLimit: 50,
        },
      });
      (
        snapContext.transactionsService.fetchLatestSignatures as jest.Mock
      ).mockImplementation(async (scope: Network, address: string) => {
        const signatures = MOCKED_NEW_SIGNATURES[scope][address];
        return Promise.resolve(signatures);
      });
      (
        snapContext.transactionsService
          .getTransactionsDataFromSignatures as jest.Mock
      ).mockImplementation(async ({ scope, signatures }) => {
        const mockedTransactionsInNetwork =
          MOCKED_TRANSACTIONS[scope as string];
        if (!mockedTransactionsInNetwork) {
          return [];
        }
        const filteredData = mockedTransactionsInNetwork.filter((tx: any) =>
          signatures.includes(tx.transaction.signatures[0]),
        );
        return Promise.resolve(filteredData);
      });

      await refreshTransactions();

      expect(snapContext.state.update).toHaveBeenCalledTimes(2);

      const firstUpdateCall = (snapContext.state.update as jest.Mock).mock
        .calls[0][0];
      expect(firstUpdateCall(initialState)).toStrictEqual({
        ...initialState,
        isFetchingTransactions: true,
      });

      const expectedSignatureCalls = [
        [Network.Mainnet, firstAccount.address, 50],
        [Network.Mainnet, secondAccount.address, 50],
        [Network.Devnet, firstAccount.address, 50],
        [Network.Devnet, secondAccount.address, 50],
      ];

      const actualSignatureCalls = (
        snapContext.transactionsService.fetchLatestSignatures as jest.Mock
      ).mock.calls;

      expect(actualSignatureCalls).toHaveLength(expectedSignatureCalls.length);
      expectedSignatureCalls.forEach((expectedCall) => {
        expect(actualSignatureCalls).toContainEqual(expectedCall);
      });

      const expectedDataCalls = [
        {
          scope: Network.Mainnet,
          signatures: [signature1, signature2, signature5, signature6],
        },
        {
          scope: Network.Devnet,
          signatures: [signature3, signature4, signature7, signature8],
        },
      ];

      const actualDataCalls = (
        snapContext.transactionsService
          .getTransactionsDataFromSignatures as jest.Mock
      ).mock.calls.map(([arg]) => arg);

      expect(actualDataCalls).toHaveLength(expectedDataCalls.length);
      expectedDataCalls.forEach((expectedCall) => {
        expect(actualDataCalls).toContainEqual(
          expect.objectContaining(expectedCall),
        );
      });

      // Verify final state
      const finalUpdateCall = (snapContext.state.update as jest.Mock).mock
        .calls[1][0];
      const finalState = finalUpdateCall(initialState);
      expect(finalState.isFetchingTransactions).toBe(false);

      const firstAccountTxs = finalState.transactions[firstAccount.id];
      const secondAccountTxs = finalState.transactions[secondAccount.id];

      // Verify all transactions are present
      expect(firstAccountTxs).toHaveLength(4);
      expect(secondAccountTxs).toHaveLength(4);

      const expectedFirstAccountSignatures = [
        signature1,
        signature2,
        signature3,
        signature4,
      ];
      const expectedSecondAccountSignatures = [
        signature5,
        signature6,
        signature7,
        signature8,
      ];

      expectedFirstAccountSignatures.forEach((signature) => {
        expect(firstAccountTxs.map((tx: { id: string }) => tx.id)).toContain(
          signature,
        );
      });

      expectedSecondAccountSignatures.forEach((signature) => {
        expect(secondAccountTxs.map((tx: { id: string }) => tx.id)).toContain(
          signature,
        );
      });

      expect(snapContext.keyring.emitEvent).toHaveBeenCalledWith(
        KeyringEvent.AccountTransactionsUpdated,
        {
          transactions: expect.objectContaining({
            [firstAccount.id]: expect.arrayContaining([
              expect.objectContaining({
                id: signature1,
              }),
              expect.objectContaining({
                id: signature2,
              }),
              expect.objectContaining({
                id: signature3,
              }),
              expect.objectContaining({
                id: signature4,
              }),
            ]),
            [secondAccount.id]: expect.arrayContaining([
              expect.objectContaining({
                id: signature5,
              }),
              expect.objectContaining({
                id: signature6,
              }),
              expect.objectContaining({
                id: signature7,
              }),
              expect.objectContaining({
                id: signature8,
              }),
            ]),
          }),
        },
      );
    });

    it('does not fetch and store transactions that are already saved', async () => {
      const firstAccount = MOCK_SOLANA_KEYRING_ACCOUNT_0;
      const secondAccount = MOCK_SOLANA_KEYRING_ACCOUNT_1;

      const signature1 = ADDRESS_1_TRANSACTION_1_DATA.transaction.signatures[0];
      const signature2 = ADDRESS_1_TRANSACTION_2_DATA.transaction.signatures[0];
      const signature3 = ADDRESS_1_TRANSACTION_3_DATA.transaction.signatures[0];
      const signature4 = ADDRESS_1_TRANSACTION_4_DATA.transaction.signatures[0];
      const signature5 = ADDRESS_2_TRANSACTION_1_DATA.transaction.signatures[0];
      const signature6 = ADDRESS_2_TRANSACTION_2_DATA.transaction.signatures[0];
      const signature7 = ADDRESS_2_TRANSACTION_3_DATA.transaction.signatures[0];
      const signature8 = ADDRESS_2_TRANSACTION_4_DATA.transaction.signatures[0];

      // Store signatures by account and network for clearer test structure
      const mockedSignatures: any = {
        [Network.Mainnet]: {
          [firstAccount.address]: [signature1, signature2],
          [secondAccount.address]: [signature5, signature6],
        },
        [Network.Devnet]: {
          [firstAccount.address]: [signature3, signature4],
          [secondAccount.address]: [signature7, signature8],
        },
      };

      const mockedTransactions: any = {
        [Network.Mainnet]: [
          ADDRESS_1_TRANSACTION_1_DATA,
          ADDRESS_1_TRANSACTION_2_DATA,
          ADDRESS_2_TRANSACTION_1_DATA,
          ADDRESS_2_TRANSACTION_2_DATA,
        ],
        [Network.Devnet]: [
          ADDRESS_1_TRANSACTION_3_DATA,
          ADDRESS_1_TRANSACTION_4_DATA,
          ADDRESS_2_TRANSACTION_3_DATA,
          ADDRESS_2_TRANSACTION_4_DATA,
        ],
      };

      // Initial state with some transactions already saved
      const initialState = {
        isFetchingTransactions: false,
        transactions: {
          [firstAccount.id]: [
            {
              id: signature1,
              account: firstAccount.address,
            },
            {
              id: signature2,
              account: firstAccount.address,
            },
          ],
          [secondAccount.id]: [
            {
              id: signature5,
              account: secondAccount.address,
            },
            {
              id: signature6,
              account: secondAccount.address,
            },
          ],
        },
      };

      (snapContext.state.get as jest.Mock).mockResolvedValue(initialState);
      (snapContext.keyring.listAccounts as jest.Mock).mockResolvedValue([
        firstAccount,
        secondAccount,
      ]);
      (snapContext.configProvider.get as jest.Mock).mockReturnValue({
        transactions: {
          storageLimit: 50,
        },
      });
      (
        snapContext.transactionsService.fetchLatestSignatures as jest.Mock
      ).mockImplementation(async (scope: Network, address: string) => {
        const signatures = mockedSignatures[scope][address];
        return Promise.resolve(signatures);
      });
      (
        snapContext.transactionsService
          .getTransactionsDataFromSignatures as jest.Mock
      ).mockImplementation(async ({ scope, signatures }) => {
        const mockedTransactionsInNetwork = mockedTransactions[scope as string];
        if (!mockedTransactionsInNetwork) {
          return [];
        }
        const filteredData = mockedTransactionsInNetwork.filter((tx: any) =>
          signatures.includes(tx.transaction.signatures[0]),
        );
        return Promise.resolve(filteredData);
      });

      await refreshTransactions();

      expect(snapContext.state.update).toHaveBeenCalledTimes(2);

      const firstUpdateCall = (snapContext.state.update as jest.Mock).mock
        .calls[0][0];
      expect(firstUpdateCall(initialState)).toStrictEqual({
        ...initialState,
        isFetchingTransactions: true,
      });

      const expectedSignatureCalls = [
        [Network.Mainnet, firstAccount.address, 50],
        [Network.Mainnet, secondAccount.address, 50],
        [Network.Devnet, firstAccount.address, 50],
        [Network.Devnet, secondAccount.address, 50],
      ];

      const actualSignatureCalls = (
        snapContext.transactionsService.fetchLatestSignatures as jest.Mock
      ).mock.calls;

      expect(actualSignatureCalls).toHaveLength(expectedSignatureCalls.length);
      expectedSignatureCalls.forEach((expectedCall) => {
        expect(actualSignatureCalls).toContainEqual(expectedCall);
      });

      // Verify only new transactions are fetched
      const expectedDataCalls = [
        {
          scope: Network.Devnet,
          signatures: [signature3, signature4, signature7, signature8],
        },
      ];

      const actualDataCalls = (
        snapContext.transactionsService
          .getTransactionsDataFromSignatures as jest.Mock
      ).mock.calls.map(([arg]) => arg);

      expect(actualDataCalls).toHaveLength(expectedDataCalls.length);
      expectedDataCalls.forEach((expectedCall) => {
        expect(actualDataCalls).toContainEqual(
          expect.objectContaining(expectedCall),
        );
      });

      // Verify final state
      const finalUpdateCall = (snapContext.state.update as jest.Mock).mock
        .calls[1][0];
      const finalState = finalUpdateCall(initialState);
      expect(finalState.isFetchingTransactions).toBe(false);

      const firstAccountTxs = finalState.transactions[firstAccount.id];
      const secondAccountTxs = finalState.transactions[secondAccount.id];

      // Verify all transactions are present (both old and new)
      expect(firstAccountTxs).toHaveLength(4);
      expect(secondAccountTxs).toHaveLength(4);

      const expectedFirstAccountSignatures = [
        signature1,
        signature2,
        signature3,
        signature4,
      ];
      const expectedSecondAccountSignatures = [
        signature5,
        signature6,
        signature7,
        signature8,
      ];

      expectedFirstAccountSignatures.forEach((signature) => {
        expect(firstAccountTxs.map((tx: { id: string }) => tx.id)).toContain(
          signature,
        );
      });

      expectedSecondAccountSignatures.forEach((signature) => {
        expect(secondAccountTxs.map((tx: { id: string }) => tx.id)).toContain(
          signature,
        );
      });

      expect(snapContext.keyring.emitEvent).toHaveBeenCalledWith(
        KeyringEvent.AccountTransactionsUpdated,
        {
          transactions: expect.objectContaining({
            [firstAccount.id]: expect.arrayContaining([
              expect.objectContaining({
                id: signature3,
              }),
              expect.objectContaining({
                id: signature4,
              }),
            ]),
            [secondAccount.id]: expect.arrayContaining([
              expect.objectContaining({
                id: signature8,
              }),
            ]),
          }),
        },
      );
    });
  });

  describe('when an error occurs', () => {
    it('releases the lock', async () => {
      const initialState = {
        isFetchingTransactions: false,
      };

      (snapContext.state.get as jest.Mock).mockResolvedValue(initialState);
      (snapContext.keyring.listAccounts as jest.Mock).mockRejectedValue(
        new Error('Test error'),
      );

      await refreshTransactions();

      const updateCall = (snapContext.state.update as jest.Mock).mock
        .calls[0][0];
      expect(updateCall(initialState)).toStrictEqual({
        ...initialState,
        isFetchingTransactions: false,
      });
    });
  });
});
