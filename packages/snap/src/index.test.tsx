import { expect } from '@jest/globals';
import { installSnap } from '@metamask/snaps-jest';

import { onCronjob, onUpdate } from '.';
import { CronjobMethod, handlers } from './core/handlers/onCronjob';
import {
  handlers as onUpdateHandlers,
  OnUpdateMethods,
} from './core/handlers/onUpdate';
import { keyring } from './snapContext';

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

describe('onCronjob', () => {
  it('throws an error if the requested method is invalid', async () => {
    await expect(
      onCronjob({
        request: {
          id: '1',
          jsonrpc: '2.0',
          method: 'foo',
        },
      }),
    ).rejects.toThrow(
      'Expected one of `"refreshTokenPrices","refreshTransactions","refreshAssets"`, but received: "foo"',
    );
  });

  it('calls the correct handler when the method is valid and snap is not locked', async () => {
    const handler = jest.fn();
    handlers[CronjobMethod.RefreshTokenPrices] = handler;

    const snap = {
      request: jest.fn().mockResolvedValue({ locked: false }),
    };

    (globalThis as any).snap = snap;

    await onCronjob({
      request: {
        id: '1',
        jsonrpc: '2.0',
        method: CronjobMethod.RefreshTokenPrices,
      },
    });

    expect(handler).toHaveBeenCalled();
  });

  it('does not call the handler when the snap is locked', async () => {
    const handler = jest.fn();
    handlers[CronjobMethod.RefreshTokenPrices] = handler;

    const snap = {
      request: jest.fn().mockResolvedValue({ locked: true }),
    };

    (globalThis as any).snap = snap;

    await onCronjob({
      request: {
        id: '1',
        jsonrpc: '2.0',
        method: CronjobMethod.RefreshTokenPrices,
      },
    });

    expect(handler).not.toHaveBeenCalled();
  });
});
