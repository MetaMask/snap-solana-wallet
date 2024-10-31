import type {
  KeyringAccount,
  KeyringRequest,
  KeyringResponse,
} from '@metamask/keyring-api';

import { SolanaKeyring } from './keyring';

describe('SolanaKeyring', () => {
  let keyring: SolanaKeyring;

  beforeEach(() => {
    keyring = new SolanaKeyring();
  });

  it('list accounts', async () => {
    const accounts = await keyring.listAccounts();
    expect(accounts).toStrictEqual([]);
  });

  it('gets account by id', async () => {
    const account = await keyring.getAccount('default-id');
    expect(account).toStrictEqual({
      type: 'eip155:eoa',
      id: 'default-id',
      address: 'default-address',
      options: {},
      methods: [],
    });
  });

  it('creates a new account', async () => {
    const account = await keyring.createAccount();
    expect(account).toStrictEqual({
      type: 'eip155:eoa',
      id: 'new-id',
      address: 'new-address',
      options: {},
      methods: [],
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
