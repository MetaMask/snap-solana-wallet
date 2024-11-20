/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  SolMethod,
  type KeyringRequest,
  type KeyringResponse,
} from '@metamask/keyring-api';
import type { Json } from '@metamask/snaps-sdk';

import { SolanaCaip19Tokens, SolanaCaip2Networks } from '../constants/solana';
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
import type { SolanaConnection } from './connection';
import type { SolanaKeyringAccount } from './keyring';
import { SolanaKeyring } from './keyring';
import type { StateValue } from './state';

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

let mockStateValue: StateValue = { keyringAccounts: {} };

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
                mockStateValue = params.newState;
                return null;
              case 'clear':
                mockStateValue = {};
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

describe('SolanaKeyring', () => {
  let keyring: SolanaKeyring;

  beforeEach(() => {
    const mockRpc = jest.fn().mockImplementation(() => ({
      getBalance: jest.fn().mockResolvedValue('0'),
    }));

    const mockConnection = jest.fn().mockImplementation(() => ({
      getRpc: mockRpc,
    })) as unknown as SolanaConnection;

    keyring = new SolanaKeyring(mockConnection);
  });

  describe('listAccounts', () => {
    it('lists accounts from the state', async () => {
      mockStateValue = {
        keyringAccounts: {
          '2': MOCK_SOLANA_KEYRING_ACCOUNT_2,
          '1': MOCK_SOLANA_KEYRING_ACCOUNT_1,
        },
      };

      const accounts = await keyring.listAccounts();
      expect(accounts).toHaveLength(2);
      expect(accounts).toContainEqual(MOCK_SOLANA_KEYRING_ACCOUNT_2);
      expect(accounts).toContainEqual(MOCK_SOLANA_KEYRING_ACCOUNT_1);
    });

    it('returns empty array if no accounts are found', async () => {
      snap.request.mockReturnValueOnce(null);

      const accounts = await keyring.listAccounts();
      expect(accounts).toStrictEqual([]);
    });

    it('throws an error if state fails to be retrieved', async () => {
      snap.request.mockRejectedValueOnce(null);

      await expect(keyring.listAccounts()).rejects.toThrow(
        'Error listing accounts',
      );
    });
  });

  describe('getAccount', () => {
    it('gets account by id', async () => {
      mockStateValue = {
        keyringAccounts: {
          '1': MOCK_SOLANA_KEYRING_ACCOUNT_1,
        },
      };

      const account = await keyring.getAccount('1');

      expect(account).toStrictEqual(MOCK_SOLANA_KEYRING_ACCOUNT_1);
    });

    it('returns undefined if account is not found', async () => {
      const account = await keyring.getAccount('4124151');
      expect(account).toBeUndefined();
    });

    it('throws an error if state fails to be retrieved', async () => {
      snap.request.mockRejectedValueOnce(null);
      await expect(keyring.getAccount('1')).rejects.toThrow(
        'Error getting account',
      );
    });
  });

  describe('createAccount', () => {
    it('creates new accounts with increasing indices', async () => {
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
      const firstAccount = await keyring.createAccount();
      const secondAccount = await keyring.createAccount();
      const thirdAccount = await keyring.createAccount();
      const fourthAccount = await keyring.createAccount();
      const fifthAccount = await keyring.createAccount();

      delete mockStateValue!.keyringAccounts![secondAccount.id];
      delete mockStateValue!.keyringAccounts![fourthAccount.id];

      const regeneratedSecondAccount = await keyring.createAccount();
      const regeneratedFourthAccount = await keyring.createAccount();
      const sixthAccount = await keyring.createAccount();

      /**
       * Accounts are created in order
       */
      expect(firstAccount).toStrictEqual({
        index: 0,
        type: 'solana:data-account',
        id: expect.any(String),
        address: MOCK_SOLANA_KEYRING_ACCOUNT_0.address,
        options: {},
        methods: [],
      });
      expect(secondAccount).toStrictEqual({
        index: 1,
        type: 'solana:data-account',
        id: expect.any(String),
        address: MOCK_SOLANA_KEYRING_ACCOUNT_1.address,
        options: {},
        methods: [],
      });
      expect(thirdAccount).toStrictEqual({
        index: 2,
        type: 'solana:data-account',
        id: expect.any(String),
        address: MOCK_SOLANA_KEYRING_ACCOUNT_2.address,
        options: {},
        methods: [],
      });
      expect(fourthAccount).toStrictEqual({
        index: 3,
        type: 'solana:data-account',
        id: expect.any(String),
        address: MOCK_SOLANA_KEYRING_ACCOUNT_3.address,
        options: {},
        methods: [],
      });
      expect(fifthAccount).toStrictEqual({
        index: 4,
        type: 'solana:data-account',
        id: expect.any(String),
        address: MOCK_SOLANA_KEYRING_ACCOUNT_4.address,
        options: {},
        methods: [],
      });
      expect(sixthAccount).toStrictEqual({
        index: 5,
        type: 'solana:data-account',
        id: expect.any(String),
        address: MOCK_SOLANA_KEYRING_ACCOUNT_5.address,
        options: {},
        methods: [],
      });

      /**
       * Regenerated accounts should pick up the missing indices
       */
      expect(regeneratedSecondAccount).toStrictEqual({
        index: 1,
        type: 'solana:data-account',
        id: expect.any(String),
        address: MOCK_SOLANA_KEYRING_ACCOUNT_1.address,
        options: {},
        methods: [],
      });
      expect(regeneratedFourthAccount).toStrictEqual({
        index: 3,
        type: 'solana:data-account',
        id: expect.any(String),
        address: MOCK_SOLANA_KEYRING_ACCOUNT_3.address,
        options: {},
        methods: [],
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
      snap.request.mockRejectedValueOnce(null);

      await expect(keyring.createAccount()).rejects.toThrow(
        'Error creating account',
      );
    });
  });

  describe('deleteAccount', () => {
    it('deletes an account', async () => {
      mockStateValue = {
        keyringAccounts: {
          '1': MOCK_SOLANA_KEYRING_ACCOUNT_1,
        },
      };

      const accountBeforeDeletion = await keyring.getAccount('1');
      expect(accountBeforeDeletion).toBeDefined();

      await keyring.deleteAccount('1');

      const deletedAccount = await keyring.getAccount('1');
      expect(deletedAccount).toBeUndefined();
    });

    it('throws an error if state fails to be retrieved', async () => {
      snap.request.mockRejectedValueOnce(null);

      await expect(keyring.deleteAccount('delete-id')).rejects.toThrow(
        'Error deleting account',
      );
    });
  });

  describe('getAccountBalances', () => {
    it('gets account balance', async () => {
      mockStateValue = {
        keyringAccounts: {
          '1': MOCK_SOLANA_KEYRING_ACCOUNT_1,
        },
      };

      const accountBalance = await keyring.getAccountBalances('1', [
        `${SolanaCaip2Networks.Mainnet}/${SolanaCaip19Tokens.SOL}`,
      ]);
      expect(accountBalance).toStrictEqual({
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501': {
          amount: '0',
          unit: 'SOL',
        },
      });
    });

    it('throws an error if balance fails to be retrieved', async () => {
      snap.request.mockRejectedValue(null);

      await expect(
        keyring.getAccountBalances('get-balance-id', [SolanaCaip19Tokens.SOL]),
      ).rejects.toThrow('Error getting account balance');
    });
  });

  it('filters account chains', async () => {
    const chains = await keyring.filterAccountChains('some-id', [
      'chain1',
      'chain2',
    ]);
    expect(chains).toStrictEqual([]);
  });

  it('updates an account', async () => {
    const account: SolanaKeyringAccount = {
      index: 0,
      type: 'solana:data-account',
      id: 'update-id',
      address: 'update-address',
      options: {},
      methods: [],
      privateKeyBytesAsNum: [],
    };
    await keyring.updateAccount(account);
    jest.spyOn(keyring, 'getAccount').mockResolvedValueOnce(account);
    const updatedAccount = await keyring.getAccount('update-id');
    expect(updatedAccount).toStrictEqual(account);
  });

  it('submits a request', async () => {
    const request: KeyringRequest = {
      id: 'test-id',
      scope: 'test-scope',
      account: 'test-account',
      request: { method: SolMethod.SendAndConfirmTransaction, params: [] },
    };
    const response: KeyringResponse = await keyring.submitRequest(request);
    expect(response).toStrictEqual({
      pending: false,
      result: expect.any(Object),
    });
  });
});
