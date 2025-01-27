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

// Mock mapRpcTransaction to return a simplified transaction
jest.mock('../../services/transactions/utils/mapRpcTransaction', () => ({
  mapRpcTransaction: jest.fn(({ scope, address, transactionData }) => ({
    id: transactionData.transaction.signatures[0],
    timestamp: Number(transactionData.blockTime),
    account: address,
  })),
}));

// Mock the snap context
jest.mock('../../../snapContext', () => ({
  state: {
    get: jest.fn(),
    update: jest.fn(async (updateFn) => Promise.resolve(updateFn({}))),
  },
  keyring: {
    listAccounts: jest.fn(),
  },
  transactionsService: {
    fetchLatestSignatures: jest.fn(),
    getTransactionsDataFromSignatures: jest.fn(),
  },
  configProvider: {
    get: jest.fn(),
  },
}));

describe('refreshTransactions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('skips if transactions are already being fetched', async () => {
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

  it('skips if no accounts are found', async () => {
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

  it('fetches and stores new transactions for all accounts efficiently', async () => {
    const firstAccount = MOCK_SOLANA_KEYRING_ACCOUNT_0;
    const secondAccount = MOCK_SOLANA_KEYRING_ACCOUNT_1;

    // Store signatures by account and network for clearer test structure
    const mockedSignatures: any = {
      [Network.Mainnet]: {
        [firstAccount.address]: ['signature-1', 'signature-2'],
        [secondAccount.address]: ['signature-5', 'signature-6'],
      },
      [Network.Devnet]: {
        [firstAccount.address]: ['signature-3', 'signature-4'],
        [secondAccount.address]: ['signature-7', 'signature-8'],
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

    const initialState = {
      isFetchingTransactions: false,
      transactions: {},
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

    // Verify state updates
    expect(snapContext.state.update).toHaveBeenCalledTimes(3);

    // Verify initial state update
    const firstUpdateCall = (snapContext.state.update as jest.Mock).mock
      .calls[0][0];
    expect(firstUpdateCall(initialState)).toStrictEqual({
      ...initialState,
      isFetchingTransactions: true,
    });

    // Verify signature fetches were made for each account+network
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

    // Verify transaction data fetches were made efficiently (one per network)
    const expectedDataCalls = [
      {
        scope: Network.Mainnet,
        signatures: [
          'signature-1',
          'signature-2',
          'signature-5',
          'signature-6',
        ],
      },
      {
        scope: Network.Devnet,
        signatures: [
          'signature-3',
          'signature-4',
          'signature-7',
          'signature-8',
        ],
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

    const expectedFirstAccountTxs = [
      {
        id: ADDRESS_1_TRANSACTION_1_DATA.transaction.signatures[0],
        timestamp: Number(ADDRESS_1_TRANSACTION_1_DATA.blockTime),
        account: firstAccount.address,
      },
      {
        id: ADDRESS_1_TRANSACTION_2_DATA.transaction.signatures[0],
        timestamp: Number(ADDRESS_1_TRANSACTION_2_DATA.blockTime),
        account: firstAccount.address,
      },
      {
        id: ADDRESS_1_TRANSACTION_3_DATA.transaction.signatures[0],
        timestamp: Number(ADDRESS_1_TRANSACTION_3_DATA.blockTime),
        account: firstAccount.address,
      },
      {
        id: ADDRESS_1_TRANSACTION_4_DATA.transaction.signatures[0],
        timestamp: Number(ADDRESS_1_TRANSACTION_4_DATA.blockTime),
        account: firstAccount.address,
      },
    ];

    const expectedSecondAccountTxs = [
      {
        id: ADDRESS_2_TRANSACTION_1_DATA.transaction.signatures[0],
        timestamp: Number(ADDRESS_2_TRANSACTION_1_DATA.blockTime),
        account: secondAccount.address,
      },
      {
        id: ADDRESS_2_TRANSACTION_2_DATA.transaction.signatures[0],
        timestamp: Number(ADDRESS_2_TRANSACTION_2_DATA.blockTime),
        account: secondAccount.address,
      },
      {
        id: ADDRESS_2_TRANSACTION_3_DATA.transaction.signatures[0],
        timestamp: Number(ADDRESS_2_TRANSACTION_3_DATA.blockTime),
        account: secondAccount.address,
      },
      {
        id: ADDRESS_2_TRANSACTION_4_DATA.transaction.signatures[0],
        timestamp: Number(ADDRESS_2_TRANSACTION_4_DATA.blockTime),
        account: secondAccount.address,
      },
    ];

    expectedFirstAccountTxs.forEach((tx) => {
      expect(firstAccountTxs).toContainEqual(tx);
    });

    expectedSecondAccountTxs.forEach((tx) => {
      expect(secondAccountTxs).toContainEqual(tx);
    });
  });

  it('handles errors and releases the lock', async () => {
    const initialState = {
      isFetchingTransactions: false,
    };

    (snapContext.state.get as jest.Mock).mockResolvedValue(initialState);
    (snapContext.keyring.listAccounts as jest.Mock).mockRejectedValue(
      new Error('Test error'),
    );

    await refreshTransactions();

    const updateCall = (snapContext.state.update as jest.Mock).mock.calls[0][0];
    expect(updateCall(initialState)).toStrictEqual({
      ...initialState,
      isFetchingTransactions: false,
    });
  });

  it('does not duplicate existing transactions', async () => {
    const account = MOCK_SOLANA_KEYRING_ACCOUNT_0;
    const initialState = {
      isFetchingTransactions: false,
      transactions: {
        [account.id]: [{ id: 'sig1', timestamp: 1000 }],
      },
    };

    (snapContext.state.get as jest.Mock).mockResolvedValue(initialState);
    (snapContext.keyring.listAccounts as jest.Mock).mockResolvedValue([
      account,
    ]);
    (snapContext.configProvider.get as jest.Mock).mockReturnValue({
      transactions: {
        storageLimit: 50,
      },
    });
    (
      snapContext.transactionsService.fetchLatestSignatures as jest.Mock
    ).mockResolvedValue(['sig1', 'sig2']);
    (
      snapContext.transactionsService
        .getTransactionsDataFromSignatures as jest.Mock
    ).mockResolvedValue([{ signature: 'sig2', blockTime: 2000 }]);

    await refreshTransactions();

    // Verify that only new signatures are fetched
    expect(
      snapContext.transactionsService.getTransactionsDataFromSignatures,
    ).toHaveBeenCalledWith({
      scope: Network.Mainnet,
      signatures: ['sig2'],
    });
  });
});
