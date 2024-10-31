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
    const newState = { wallets: [{ id: 1 }] };

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
    const initialState = { wallets: [{ id: 1 }] };
    const updatedState = { wallets: [{ id: 1 }, { id: 2 }] };
    snap.request.mockResolvedValueOnce(initialState);

    await solanaState.update((state) => ({
      wallets: [...(state.wallets ?? []), { id: 2 }],
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
