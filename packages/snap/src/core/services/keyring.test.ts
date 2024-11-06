import type {
  KeyringAccount,
  KeyringRequest,
  KeyringResponse,
} from '@metamask/keyring-api';

import { SOLANA_ADDRESS } from '../constants/address';
import { SolanaKeyring } from './keyring';
import { SolanaWallet } from './wallet';

const snap = {
  request: jest.fn(),
};

(globalThis as any).snap = snap;

jest.mock('./wallet');

describe('SolanaKeyring', () => {
  let keyring: SolanaKeyring;

  beforeEach(() => {
    keyring = new SolanaKeyring();
  });

  afterEach(() => {
    snap.request.mockReset();
    jest.clearAllMocks();
  });

  describe('listAccounts', () => {
    it('lists accounts from the state', async () => {
      const keyringAccounts = {
        '1': {
          type: 'eip155:eoa',
          id: '1',
          address: 'address-1',
          options: {},
          methods: [],
        },
        '2': {
          type: 'eip155:eoa',
          id: '2',
          address: 'address-2',
          options: {},
          methods: [],
        },
      };

      snap.request.mockReturnValue({
        keyringAccounts,
      });

      const accounts = await keyring.listAccounts();
      expect(accounts).toStrictEqual(accounts);
    });

    it('returns empty array if no accounts are found', async () => {
      snap.request.mockReturnValue(null);

      const accounts = await keyring.listAccounts();
      expect(accounts).toStrictEqual([]);
    });

    it('throws an error if state fails to be retrieved', async () => {
      snap.request.mockRejectedValue(null);

      await expect(keyring.listAccounts()).rejects.toThrow(
        'Error listing accounts',
      );
    });
  });

  describe('getAccount', () => {
    it('gets account by id', async () => {
      const keyringAccounts = {
        '1': {
          type: 'eip155:eoa',
          id: '1',
          address: 'address-1',
          options: {},
          methods: [],
        },
      };

      snap.request.mockReturnValue({
        keyringAccounts,
      });

      const account = await keyring.getAccount('1');
      expect(account).toStrictEqual(keyringAccounts['1']);
    });

    it('returns undefined if account is not found', async () => {
      snap.request.mockReturnValue(null);

      const account = await keyring.getAccount('1');
      expect(account).toBeUndefined();
    });

    it('throws an error if state fails to be retrieved', async () => {
      snap.request.mockRejectedValue(null);

      await expect(keyring.getAccount('1')).rejects.toThrow(
        'Error getting account',
      );
    });
  });

  describe('createAccount', () => {
    it('creates a new account', async () => {
      jest.mocked(SolanaWallet).mockImplementation(() => {
        return {
          deriveAddress: () => SOLANA_ADDRESS,
        } as unknown as SolanaWallet;
      });

      const account = await keyring.createAccount();

      expect(account).toStrictEqual({
        type: 'solana:data-account',
        id: expect.any(String),
        address: SOLANA_ADDRESS,
        options: {},
        methods: [],
      });
    });

    it('throws when deriving address fails', async () => {
      jest.mocked(SolanaWallet).mockImplementation(() => {
        return {
          deriveAddress: () => {
            throw new Error('Error deriving address');
          },
        } as unknown as SolanaWallet;
      });

      await expect(keyring.createAccount()).rejects.toThrow(
        'Error creating account',
      );
    });

    it('throws an error if state fails to be retrieved', async () => {
      snap.request.mockRejectedValue(null);

      await expect(keyring.createAccount()).rejects.toThrow(
        'Error creating account',
      );
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

  it('deletes an account', async () => {
    await keyring.deleteAccount('delete-id');
    jest.spyOn(keyring, 'getAccount').mockResolvedValueOnce(undefined);
    const deletedAccount = await keyring.getAccount('delete-id');
    expect(deletedAccount).toBeUndefined();
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
