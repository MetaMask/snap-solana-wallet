/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { SolMethod } from '@metamask/keyring-api';
import { MethodNotFoundError, type Json } from '@metamask/snaps-sdk';

import {
  SolanaCaip19Tokens,
  SolanaCaip2Networks,
  SolanaTokens,
} from '../constants/solana';
import {
  MOCK_SOLANA_KEYRING_ACCOUNT_0,
  MOCK_SOLANA_KEYRING_ACCOUNT_1,
  MOCK_SOLANA_KEYRING_ACCOUNT_2,
  MOCK_SOLANA_KEYRING_ACCOUNT_3,
  MOCK_SOLANA_KEYRING_ACCOUNT_4,
  MOCK_SOLANA_KEYRING_ACCOUNT_5,
  MOCK_SOLANA_KEYRING_ACCOUNTS,
} from '../test/mocks/solana-keyring-accounts';
import { deriveSolanaPrivateKey } from '../utils/derive-solana-private-key';
import logger from '../utils/logger';
import type { SolanaConnection } from './connection/SolanaConnection';
import {
  EncryptedSolanaState,
  type StateValue as EncryptedStateValue,
} from './encrypted-state';
import { SolanaKeyring } from './keyring';
import { createMockConnection } from './mocks/mockConnection';
import type { SplTokenHelper } from './SplTokenHelper/SplTokenHelper';
import { SolanaState, type StateValue } from './state';
import { TransactionsService } from './transactions';
import type { TransferSolHelper } from './TransferSolHelper/TransferSolHelper';

jest.mock('@metamask/keyring-api', () => ({
  ...jest.requireActual('@metamask/keyring-api'),
  emitSnapKeyringEvent: jest.fn().mockResolvedValue(null),
}));

jest.mock('../utils/derive-solana-private-key', () => ({
  deriveSolanaPrivateKey: jest.fn().mockImplementation((index) => {
    const account = MOCK_SOLANA_KEYRING_ACCOUNTS[index]!;
    if (!account) {
      throw new Error('[deriveSolanaAddress] Not enough mocked indices');
    }
    return new Uint8Array(account.privateKeyBytesAsNum);
  }),
}));

describe('SolanaKeyring', () => {
  let keyring: SolanaKeyring;
  let mockStateValue: StateValue & EncryptedStateValue;
  let mockConnection: SolanaConnection;
  let mockTransferSolHelper: TransferSolHelper;
  let mockSplTokenHelper: SplTokenHelper;

  beforeEach(() => {
    mockConnection = createMockConnection();

    const state = new SolanaState();
    const encryptedState = new EncryptedSolanaState();

    const transactionsService = new TransactionsService({
      logger,
      connection: mockConnection,
    });

    mockTransferSolHelper = {
      transferSol: jest
        .fn()
        .mockResolvedValue(
          '2ZXksbyHvhDqZJwEKbyJNPAUkqhNSoJnH9L3ceLxgBb6dh9WSjhCQy7UdDfEQ8ym7acKJAyKT3NniDx5HzTWeXHT',
        ),
    } as unknown as TransferSolHelper;

    mockSplTokenHelper = {
      transferSplToken: jest.fn(),
    } as unknown as SplTokenHelper;

    keyring = new SolanaKeyring({
      state,
      encryptedState,
      connection: mockConnection,
      transactionsService,
      transferSolHelper: mockTransferSolHelper,
      splTokenHelper: mockSplTokenHelper,
      logger,
    });

    // To simplify the mocking of individual tests, we initialize the state in happy path with all mock accounts
    mockStateValue = {
      keyringAccounts: MOCK_SOLANA_KEYRING_ACCOUNTS.reduce(
        (acc, account) => ({
          ...acc,
          [account.id]: account,
        }),
        {},
      ),
      mapInterfaceNameToId: {},
      tokenPrices: {
        [SolanaCaip19Tokens.SOL]: {
          ...SolanaTokens[SolanaCaip19Tokens.SOL],
          price: 0,
        },
      },
      isFetchingTransactions: false,
      transactions: {},
    };

    /**
     * Mock the snap_manageState method to control the state
     */
    const snap = {
      request: jest
        .fn()
        .mockImplementation(
          async ({
            method,
            params,
          }: {
            method: string;
            params: { operation: string; newState: Record<string, Json> };
          }) => {
            switch (method) {
              case 'snap_manageState':
                switch (params.operation) {
                  case 'get':
                    return mockStateValue;
                  case 'update':
                    mockStateValue = params.newState as StateValue;
                    return null;
                  case 'clear':
                    mockStateValue = {} as StateValue;
                    return null;
                  default:
                    throw new Error(`Unknown operation: ${params.operation}`);
                }
              default:
                throw new Error(`Unknown method: ${method}`);
            }
          },
        ),
    };
    (globalThis as any).snap = snap;
  });

  describe('listAccounts', () => {
    it('lists accounts from the state', async () => {
      const accounts = await keyring.listAccounts();
      expect(accounts).toHaveLength(MOCK_SOLANA_KEYRING_ACCOUNTS.length);
      expect(accounts).toContainEqual(MOCK_SOLANA_KEYRING_ACCOUNT_0);
      expect(accounts).toContainEqual(MOCK_SOLANA_KEYRING_ACCOUNT_1);
      expect(accounts).toContainEqual(MOCK_SOLANA_KEYRING_ACCOUNT_2);
      expect(accounts).toContainEqual(MOCK_SOLANA_KEYRING_ACCOUNT_3);
      expect(accounts).toContainEqual(MOCK_SOLANA_KEYRING_ACCOUNT_4);
      expect(accounts).toContainEqual(MOCK_SOLANA_KEYRING_ACCOUNT_5);
    });

    it('returns empty array if no accounts are found', async () => {
      (snap.request as jest.Mock).mockReturnValueOnce(null);

      const accounts = await keyring.listAccounts();
      expect(accounts).toStrictEqual([]);
    });

    it('throws an error if state fails to be retrieved', async () => {
      (snap.request as jest.Mock).mockRejectedValueOnce(
        new Error('State error'),
      );

      await expect(keyring.listAccounts()).rejects.toThrow(
        'Error listing accounts',
      );
    });
  });

  describe('getAccount', () => {
    it('gets account by id', async () => {
      const account = await keyring.getAccount('1');
      expect(account).toStrictEqual(MOCK_SOLANA_KEYRING_ACCOUNT_1);
    });

    it('returns undefined if account is not found', async () => {
      const account = await keyring.getAccount('4124151');
      expect(account).toBeUndefined();
    });

    it('throws an error if state fails to be retrieved', async () => {
      (snap.request as jest.Mock).mockRejectedValueOnce(
        new Error('State error'),
      );

      await expect(keyring.getAccount('1')).rejects.toThrow(
        'Error getting account',
      );
    });
  });

  describe('getAccountOrThrow', () => {
    it('throws an error if account is not found', async () => {
      await expect(keyring.getAccountOrThrow('4124151')).rejects.toThrow(
        'Account not found',
      );
    });
  });

  describe('createAccount', () => {
    it('creates new accounts with increasing indices', async () => {
      mockStateValue = {
        keyringAccounts: {},
        mapInterfaceNameToId: {},
        tokenPrices: {
          [SolanaCaip19Tokens.SOL]: {
            ...SolanaTokens[SolanaCaip19Tokens.SOL],
            price: 0,
          },
        },
        isFetchingTransactions: false,
        transactions: {},
      };

      const firstAccount = await keyring.createAccount();
      const secondAccount = await keyring.createAccount();
      const thirdAccount = await keyring.createAccount();

      expect(firstAccount).toStrictEqual({
        ...MOCK_SOLANA_KEYRING_ACCOUNT_0,
        id: expect.any(String),
      });
      expect(secondAccount).toStrictEqual({
        ...MOCK_SOLANA_KEYRING_ACCOUNT_1,
        id: expect.any(String),
      });
      expect(thirdAccount).toStrictEqual({
        ...MOCK_SOLANA_KEYRING_ACCOUNT_2,
        id: expect.any(String),
      });
    });

    it('recreates accounts with missing indices, in order', async () => {
      mockStateValue = {
        keyringAccounts: {},
        mapInterfaceNameToId: {},
        tokenPrices: {
          [SolanaCaip19Tokens.SOL]: {
            ...SolanaTokens[SolanaCaip19Tokens.SOL],
            price: 0,
          },
        },
        isFetchingTransactions: false,
        transactions: {},
      };

      const firstAccount = await keyring.createAccount();
      const secondAccount = await keyring.createAccount();
      const thirdAccount = await keyring.createAccount();
      const fourthAccount = await keyring.createAccount();
      const fifthAccount = await keyring.createAccount();

      delete mockStateValue.keyringAccounts![secondAccount.id];
      delete mockStateValue.keyringAccounts![fourthAccount.id];

      const regeneratedSecondAccount = await keyring.createAccount();
      const regeneratedFourthAccount = await keyring.createAccount();
      const sixthAccount = await keyring.createAccount();

      /**
       * Accounts are created in order
       */
      expect(firstAccount).toStrictEqual({
        ...MOCK_SOLANA_KEYRING_ACCOUNT_0,
        id: expect.any(String),
      });
      expect(secondAccount).toStrictEqual({
        ...MOCK_SOLANA_KEYRING_ACCOUNT_1,
        id: expect.any(String),
      });
      expect(thirdAccount).toStrictEqual({
        ...MOCK_SOLANA_KEYRING_ACCOUNT_2,
        id: expect.any(String),
      });
      expect(fourthAccount).toStrictEqual({
        ...MOCK_SOLANA_KEYRING_ACCOUNT_3,
        id: expect.any(String),
      });
      expect(fifthAccount).toStrictEqual({
        ...MOCK_SOLANA_KEYRING_ACCOUNT_4,
        id: expect.any(String),
      });
      expect(sixthAccount).toStrictEqual({
        ...MOCK_SOLANA_KEYRING_ACCOUNT_5,
        id: expect.any(String),
      });

      /**
       * Regenerated accounts should pick up the missing indices
       */
      expect(regeneratedSecondAccount).toStrictEqual({
        ...MOCK_SOLANA_KEYRING_ACCOUNT_1,
        id: expect.any(String),
      });
      expect(regeneratedFourthAccount).toStrictEqual({
        ...MOCK_SOLANA_KEYRING_ACCOUNT_3,
        id: expect.any(String),
      });
    });

    it('throws when deriving address fails', async () => {
      jest.mocked(deriveSolanaPrivateKey).mockImplementation(async () => {
        return Promise.reject(new Error('Error deriving address'));
      });

      await expect(keyring.createAccount()).rejects.toThrow(
        'Error creating account',
      );
    });

    it('throws an error if state fails to be retrieved', async () => {
      (snap.request as jest.Mock).mockRejectedValueOnce(
        new Error('State error'),
      );

      await expect(keyring.createAccount()).rejects.toThrow(
        'Error creating account',
      );
    });
  });

  describe('deleteAccount', () => {
    it('deletes an account', async () => {
      const accountBeforeDeletion = await keyring.getAccount('1');
      expect(accountBeforeDeletion).toBeDefined();

      await keyring.deleteAccount('1');

      const deletedAccount = await keyring.getAccount('1');
      expect(deletedAccount).toBeUndefined();
    });

    it('throws an error if state fails to be retrieved', async () => {
      (snap.request as jest.Mock).mockRejectedValueOnce(
        new Error('State error'),
      );

      await expect(keyring.deleteAccount('delete-id')).rejects.toThrow(
        'Error deleting account',
      );
    });
  });

  describe('filterAccountChains', () => {
    it.todo('filters account chains');
  });

  describe('updateAccount', () => {
    it.todo('updates an account');
  });

  describe('getAccountBalances', () => {
    it('gets account balance', async () => {
      const accountBalance = await keyring.getAccountBalances('1', [
        `${SolanaCaip2Networks.Mainnet}/${SolanaCaip19Tokens.SOL}`,
      ]);
      expect(accountBalance).toStrictEqual({
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501': {
          amount: '0.123456789',
          unit: 'SOL',
        },
      });
    });

    it('throws an error if balance fails to be retrieved', async () => {
      const mockSend = jest
        .fn()
        .mockRejectedValueOnce(new Error('Error getting balance'));
      const mockGetBalance = jest.fn().mockReturnValue({ send: mockSend });
      jest.spyOn(mockConnection, 'getRpc').mockReturnValue({
        getBalance: mockGetBalance,
      } as any);

      await expect(
        keyring.getAccountBalances('get-balance-id', [SolanaCaip19Tokens.SOL]),
      ).rejects.toThrow('Error getting account balance');
    });
  });

  describe('handleSubmitRequest', () => {
    describe('when method is SendAndConfirmTransaction', () => {
      it('throws error when params are invalid', async () => {
        const request = {
          id: 'some-id',
          scope: 'solana:devnet',
          account: MOCK_SOLANA_KEYRING_ACCOUNT_4.id,
          request: {
            method: SolMethod.SendAndConfirmTransaction,
            params: {
              to: MOCK_SOLANA_KEYRING_ACCOUNT_1.address,
              amount: -1, // Invalid negative amount
            },
          },
        };

        await expect(keyring.submitRequest(request)).rejects.toThrow(
          'At path: amount -- Expected a positive number but received a negative number -1',
        );
      });

      it('transfers SOL', async () => {
        jest
          .spyOn(keyring, 'getAccount')
          .mockResolvedValue(MOCK_SOLANA_KEYRING_ACCOUNT_4);

        const request = {
          id: 'some-id',
          scope: 'solana:devnet',
          account: MOCK_SOLANA_KEYRING_ACCOUNT_4.id,
          request: {
            method: SolMethod.SendAndConfirmTransaction,
            params: {
              to: MOCK_SOLANA_KEYRING_ACCOUNT_1.address,
              amount: 1.0,
            },
          },
        };

        const response = await keyring.submitRequest(request);

        expect(response).toStrictEqual({
          pending: false,
          result: {
            signature:
              '2ZXksbyHvhDqZJwEKbyJNPAUkqhNSoJnH9L3ceLxgBb6dh9WSjhCQy7UdDfEQ8ym7acKJAyKT3NniDx5HzTWeXHT',
          },
        });
      });
    });

    it('throws error when account is not found', async () => {
      jest.spyOn(keyring as any, 'getAccount').mockResolvedValue(undefined);

      const request = {
        id: 'some-id',
        scope: 'solana:devnet',
        account: 'non-existent-account',
        request: {
          method: SolMethod.SendAndConfirmTransaction,
          params: {
            to: 'BXT1K8kzYXWMi6ihg7m9UqiHW4iJbJ69zumELHE9oBLe',
            mintAddress: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
            amount: 0.01,
          },
        },
      };

      await expect(keyring.submitRequest(request)).rejects.toThrow(
        'Account not found',
      );
    });

    it('throws MethodNotFoundError for unsupported methods', async () => {
      const request = {
        id: 'some-id',
        scope: 'solana:devnet',
        account: MOCK_SOLANA_KEYRING_ACCOUNT_3.id,
        request: {
          method: 'unsupportedMethod' as SolMethod,
          params: {},
        },
      };

      await expect(keyring.submitRequest(request)).rejects.toThrow(
        MethodNotFoundError,
      );
    });
  });
});
