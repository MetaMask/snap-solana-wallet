import { expect } from '@jest/globals';
import { installSnap } from '@metamask/snaps-jest';

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
