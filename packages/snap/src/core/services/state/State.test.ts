import type { Json } from '@metamask/snaps-sdk';

import {
  MOCK_SOLANA_KEYRING_ACCOUNT_0,
  MOCK_SOLANA_KEYRING_ACCOUNT_1,
  MOCK_SOLANA_KEYRING_ACCOUNT_2,
} from '../../test/mocks/solana-keyring-accounts';
import {
  type StateValue,
  DEFAULT_STATE,
  EncryptedSolanaState,
} from '../encrypted-state/EncryptedState';

const snap = {
  request: jest.fn(),
};

(globalThis as any).snap = snap;

describe('SolanaState', () => {
  let solanaState: EncryptedSolanaState;

  beforeEach(() => {
    solanaState = new EncryptedSolanaState();
    jest.clearAllMocks();
  });

  afterEach(() => {
    snap.request.mockReset();
  });

  it('gets the state', async () => {
    const mockState = DEFAULT_STATE;
    snap.request.mockResolvedValue(mockState);

    const state = await solanaState.get();

    expect(snap.request).toHaveBeenCalledWith({
      method: 'snap_manageState',
      params: { operation: 'get' },
    });
    expect(state).toStrictEqual(mockState);
  });

  it('gets the default state if the snap state is empty', async () => {
    const mockState = {};
    snap.request.mockResolvedValue(mockState);

    const state = await solanaState.get();

    expect(state).toStrictEqual(DEFAULT_STATE);
  });

  it('sets the state', async () => {
    const newState = {
      keyringAccounts: {
        '0': MOCK_SOLANA_KEYRING_ACCOUNT_0,
      },
    } as unknown as StateValue;

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

    await solanaState.update(
      (state) =>
        ({
          keyringAccounts: {
            ...(state?.keyringAccounts ?? {}),
            '2': MOCK_SOLANA_KEYRING_ACCOUNT_2,
          },
        } as unknown as StateValue),
    );

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
