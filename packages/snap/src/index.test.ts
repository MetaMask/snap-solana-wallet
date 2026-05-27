import { expect } from '@jest/globals';
import { installSnap } from '@metamask/snaps-jest';

import { onCronjob } from '.';
import { handlers } from './core/handlers/onCronjob';
import { ScheduleBackgroundEventMethod } from './core/handlers/onCronjob/backgroundEvents/ScheduleBackgroundEventMethod';

// Avoid loading the ESM-only `@noble/ed25519` package and patching
// `globalThis.crypto.subtle` from this test file. Tests here don't exercise
// crypto, and a global patch would leak into other test suites under
// `--runInBand` because `globalThis` is shared across files.
jest.mock('./polyfills', () => ({
  installPolyfills: jest.fn(),
}));

jest.mock('./snapContext', () => ({
  keyring: {
    listAccounts: jest.fn(),
    createAccount: jest.fn(),
  },
  state: {
    getKey: jest.fn().mockResolvedValue(Date.now()),
    setKey: jest.fn(),
    setKeyWith: jest.fn(),
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
    ).rejects.toThrow(/Expected one of/u);
  });

  it('calls the correct handler', async () => {
    const handler = jest.fn();
    handlers[ScheduleBackgroundEventMethod.RefreshSend] = handler;

    const snap = {
      request: jest.fn().mockResolvedValue({ locked: false, active: true }),
    };

    (globalThis as any).snap = snap;

    await onCronjob({
      request: {
        id: '1',
        jsonrpc: '2.0',
        method: ScheduleBackgroundEventMethod.RefreshSend,
      },
    });

    expect(handler).toHaveBeenCalled();
  });
});
