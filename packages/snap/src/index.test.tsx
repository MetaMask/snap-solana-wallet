import { expect } from '@jest/globals';
import { installSnap } from '@metamask/snaps-jest';
import { keyring } from './snapContext';
import {
  handlers as onUpdateHandlers,
  OnUpdateMethods,
} from './core/handlers/onUpdate';
import { onUpdate } from './index';

jest.mock('@noble/ed25519', () => ({
  getPublicKey: jest.fn(),
  sign: jest.fn(),
  verify: jest.fn(),
}));

jest.mock('./snapContext', () => ({
  keyring: {
    listAccounts: jest.fn(),
    createAccount: jest.fn(),
  },
}));

describe('onRpcRequest', () => {
  it('throws an error if the requested method does not exist', async () => {
    const { request } = await installSnap();

    const response = await request({
      method: 'foo',
    });

    expect(response).toRespondWithError({
      code: 4100,
      message: 'Permission denied',
      stack: expect.any(String),
    });
  });
});

describe('onKeyringRequest', () => {
  it('throws an error if the requested method does not exist', async () => {
    const { request } = await installSnap();

    const response = await request({
      method: 'wallet_invokeSnap',
      params: {
        snapId: 'npm:@metamask/solana-wallet-snap',
        request: {
          method: 'foo',
        },
      },
    });

    expect(response).toRespondWithError({
      code: 4100,
      message: 'Permission denied',
      stack: expect.any(String),
    });
  });
});

describe('onUpdate', () => {
  it('creates an account when there are no existing accounts', async () => {
    (keyring.listAccounts as jest.Mock).mockResolvedValue([]);
    (keyring.createAccount as jest.Mock).mockResolvedValue({
      id: '1',
      address: 'mocked-address',
    });

    const createAccountSpy = jest.spyOn(
      onUpdateHandlers,
      OnUpdateMethods.CreateAccount,
    );

    await onUpdate({ origin: 'MetaMask' });

    expect(keyring.listAccounts).toHaveBeenCalled();
    expect(createAccountSpy).toHaveBeenCalledWith({ origin: 'MetaMask' });
  });
});
