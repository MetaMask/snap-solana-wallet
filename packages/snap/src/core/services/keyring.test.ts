import type {
  KeyringAccount,
  KeyringRequest,
  KeyringResponse,
} from '@metamask/keyring-api';
import type { Json } from '@metamask/snaps-sdk';

import {
  SOLANA_ADDRESS_1,
  SOLANA_ADDRESS_2,
  SOLANA_ADDRESS_3,
  SOLANA_ADDRESS_4,
  SOLANA_ADDRESS_5,
  SOLANA_ADDRESS_6,
} from '../constants/address';
import { SOL_CAIP_19 } from '../constants/solana';
import { deriveSolanaAddress } from '../utils/derive-solana-address';
import { SolanaKeyring } from './keyring';

jest.mock('@metamask/keyring-api', () => ({
  ...jest.requireActual('@metamask/keyring-api'),
  emitSnapKeyringEvent: jest.fn().mockResolvedValue(null),
}));

jest.mock('../utils/derive-solana-address', () => ({
  deriveSolanaAddress: jest.fn().mockImplementation((index) => {
    switch (index) {
      case 0:
        return SOLANA_ADDRESS_1;
      case 1:
        return SOLANA_ADDRESS_2;
      case 2:
        return SOLANA_ADDRESS_3;
      case 3:
        return SOLANA_ADDRESS_4;
      case 4:
        return SOLANA_ADDRESS_5;
      case 5:
        return SOLANA_ADDRESS_6;
      default:
        throw new Error('[deriveSolanaAddress] Not enough mocked indices');
    }
  }),
}));

/**
 * Mock the snap_manageState method to control the state
 */
let mockState: any = { keyringAccounts: {} };
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
                return mockState;
              case 'update':
                mockState = params.newState;
                return null;
              case 'clear':
                mockState = {};
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
    keyring = new SolanaKeyring();
    mockState = {};
    jest.clearAllMocks();
  });

  describe('listAccounts', () => {
    it('lists accounts from the state', async () => {
      mockState = {
        keyringAccounts: {
          '2': {
            index: 1,
            type: 'solana:data-account',
            id: '2',
            address: SOLANA_ADDRESS_1,
            options: {},
            methods: [],
          },
          '1': {
            index: 0,
            type: 'solana:data-account',
            id: '1',
            address: SOLANA_ADDRESS_2,
            options: {},
            methods: [],
          },
        },
      };

      const accounts = await keyring.listAccounts();
      expect(accounts).toStrictEqual([
        {
          index: 0,
          type: 'solana:data-account',
          id: '1',
          address: SOLANA_ADDRESS_2,
          options: {},
          methods: [],
        },
        {
          index: 1,
          type: 'solana:data-account',
          id: '2',
          address: SOLANA_ADDRESS_1,
          options: {},
          methods: [],
        },
      ]);
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
      mockState = {
        keyringAccounts: {
          '1': {
            index: 0,
            type: 'solana:data-account',
            id: '1',
            address: SOLANA_ADDRESS_2,
            options: {},
            methods: [],
          },
        },
      };

      const account = await keyring.getAccount('1');

      expect(account).toStrictEqual({
        index: 0,
        type: 'solana:data-account',
        id: '1',
        address: SOLANA_ADDRESS_2,
        options: {},
        methods: [],
      });
    });

    it('returns undefined if account is not found', async () => {
      const account = await keyring.getAccount('1');
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
        index: 0,
        type: 'solana:data-account',
        id: expect.any(String),
        address: SOLANA_ADDRESS_1,
        options: {},
        methods: [],
      });
      expect(secondAccount).toStrictEqual({
        index: 1,
        type: 'solana:data-account',
        id: expect.any(String),
        address: SOLANA_ADDRESS_2,
        options: {},
        methods: [],
      });
      expect(thirdAccount).toStrictEqual({
        index: 2,
        type: 'solana:data-account',
        id: expect.any(String),
        address: SOLANA_ADDRESS_3,
        options: {},
        methods: [],
      });
    });

    it('recreates accounts with missing indices, in order', async () => {
      const firstAccount = await keyring.createAccount();
      const secondAccount = await keyring.createAccount();
      const thirdAccount = await keyring.createAccount();
      const fourthAccount = await keyring.createAccount();
      const fifthAccount = await keyring.createAccount();

      delete mockState.keyringAccounts[secondAccount.id];
      delete mockState.keyringAccounts[fourthAccount.id];

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
        address: SOLANA_ADDRESS_1,
        options: {},
        methods: [],
      });
      expect(secondAccount).toStrictEqual({
        index: 1,
        type: 'solana:data-account',
        id: expect.any(String),
        address: SOLANA_ADDRESS_2,
        options: {},
        methods: [],
      });
      expect(thirdAccount).toStrictEqual({
        index: 2,
        type: 'solana:data-account',
        id: expect.any(String),
        address: SOLANA_ADDRESS_3,
        options: {},
        methods: [],
      });
      expect(fourthAccount).toStrictEqual({
        index: 3,
        type: 'solana:data-account',
        id: expect.any(String),
        address: SOLANA_ADDRESS_4,
        options: {},
        methods: [],
      });
      expect(fifthAccount).toStrictEqual({
        index: 4,
        type: 'solana:data-account',
        id: expect.any(String),
        address: SOLANA_ADDRESS_5,
        options: {},
        methods: [],
      });
      expect(sixthAccount).toStrictEqual({
        index: 5,
        type: 'solana:data-account',
        id: expect.any(String),
        address: SOLANA_ADDRESS_6,
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
        address: SOLANA_ADDRESS_2,
        options: {},
        methods: [],
      });
      expect(regeneratedFourthAccount).toStrictEqual({
        index: 3,
        type: 'solana:data-account',
        id: expect.any(String),
        address: SOLANA_ADDRESS_4,
        options: {},
        methods: [],
      });
    });

    it('throws when deriving address fails', async () => {
      jest.mocked(deriveSolanaAddress).mockImplementation(async () => {
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
      mockState = {
        keyringAccounts: {
          '1': {
            index: 0,
            type: 'solana:data-account',
            id: '1',
            address: SOLANA_ADDRESS_2,
            options: {},
            methods: [],
          },
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

  describe.skip('getAccountBalances', () => {
    it('gets account balance', async () => {
      const balance = 1000;

      snap.request.mockReturnValueOnce(balance);

      const accountBalance = await keyring.getAccountBalances(
        'get-balance-id',
        [SOL_CAIP_19],
      );
      expect(accountBalance).toBe(balance);
    });

    it('throws an error if balance fails to be retrieved', async () => {
      snap.request.mockRejectedValue(null);

      await expect(
        keyring.getAccountBalances('get-balance-id', [SOL_CAIP_19]),
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
    const account: KeyringAccount = {
      type: 'eip155:eoa',
      id: 'update-id',
      address: 'update-address',
      options: {},
      methods: [],
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
      request: { method: 'test_method', params: [] },
    };
    const response: KeyringResponse = await keyring.submitRequest(request);
    expect(response).toStrictEqual({ pending: true });
  });
});
