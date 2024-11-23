import type { Json } from '@metamask/snaps-sdk';

import {
  MOCK_SOLANA_KEYRING_ACCOUNT_0,
  MOCK_SOLANA_KEYRING_ACCOUNT_1,
  MOCK_SOLANA_KEYRING_ACCOUNT_2,
} from '../test/mocks/solana-keyring-accounts';
import { SolanaState } from './state';

const snap = {
  request: jest.fn(),
};

(globalThis as any).snap = snap;

describe('SolanaState', () => {
  let solanaState: SolanaState;

  beforeEach(() => {
    solanaState = new SolanaState();
    jest.clearAllMocks();
  });

  afterEach(() => {
    snap.request.mockReset();
  });

  it('gets the state', async () => {
    const mockState = { wallets: [] };
    snap.request.mockResolvedValue(mockState);

    const state = await solanaState.get();

    expect(snap.request).toHaveBeenCalledWith({
      method: 'snap_manageState',
      params: { operation: 'get' },
    });
    expect(state).toStrictEqual(mockState);
  });

  it('sets the state', async () => {
    const newState = {
      keyringAccounts: {
        '0': MOCK_SOLANA_KEYRING_ACCOUNT_0,
      },
    };

    await solanaState.set(newState);

    expect(snap.request).toHaveBeenCalledWith({
      method: 'snap_manageState',
      params: {
        operation: 'update',
        newState: newState as unknown as Record<string, Json>,
      },
    });
  });

  it('updates the state', async () => {
    const initialState = {
      keyringAccounts: {
        '1': MOCK_SOLANA_KEYRING_ACCOUNT_1,
      },
    };
    const updatedState = {
      keyringAccounts: {
        '1': MOCK_SOLANA_KEYRING_ACCOUNT_1,
        '2': MOCK_SOLANA_KEYRING_ACCOUNT_2,
      },
    };
    snap.request.mockResolvedValueOnce(initialState);

    await solanaState.update((state) => ({
      keyringAccounts: {
        ...(state?.keyringAccounts ?? {}),
        '2': MOCK_SOLANA_KEYRING_ACCOUNT_2,
      },
    }));

    expect(snap.request).toHaveBeenCalledWith({
      method: 'snap_manageState',
      params: { operation: 'get' },
    });

    expect(snap.request).toHaveBeenCalledWith({
      method: 'snap_manageState',
      params: {
        operation: 'update',
        newState: updatedState as unknown as Record<string, Json>,
      },
    });
  });
});
