import type { Json } from '@metamask/snaps-sdk';

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
        '1': {
          type: 'eip155:eoa' as const,
          id: '1',
          address: 'address-1',
          options: {},
          methods: [],
        },
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
        '1': {
          type: 'eip155:eoa' as const,
          id: '1',
          address: 'address-1',
          options: {},
          methods: [],
        },
      },
    };
    const updatedState = {
      keyringAccounts: {
        '1': {
          type: 'eip155:eoa' as const,
          id: '1',
          address: 'address-1',
          options: {},
          methods: [],
        },
        '2': {
          type: 'eip155:eoa' as const,
          id: '2',
          address: 'address-2',
          options: {},
          methods: [],
        },
      },
    };
    snap.request.mockResolvedValueOnce(initialState);

    await solanaState.update((state) => ({
      keyringAccounts: {
        ...(state?.keyringAccounts ?? {}),
        '2': {
          type: 'eip155:eoa' as const,
          id: '2',
          address: 'address-2',
          options: {},
          methods: [],
        },
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
