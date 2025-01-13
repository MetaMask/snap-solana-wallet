import type { Json } from '@metamask/snaps-sdk';

import { type StateValue, DEFAULT_STATE, SolanaState } from './State';

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
    const mockState = DEFAULT_STATE;
    snap.request.mockResolvedValue(mockState);

    const state = await solanaState.get();

    expect(snap.request).toHaveBeenCalledWith({
      method: 'snap_manageState',
      params: { operation: 'get', encrypted: false },
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
      isFetchingTransactions: true,
    } as unknown as StateValue;

    await solanaState.set(newState);

    expect(snap.request).toHaveBeenCalledWith({
      method: 'snap_manageState',
      params: {
        operation: 'update',
        newState: newState as unknown as Record<string, Json>,
        encrypted: false,
      },
    });
  });

  it('updates the state', async () => {
    const initialState = {
      isFetchingTransactions: false,
    };
    const updatedState = {
      ...DEFAULT_STATE,
      isFetchingTransactions: true,
    };
    snap.request.mockResolvedValueOnce(initialState);

    await solanaState.update((state) => ({
      ...state,
      isFetchingTransactions: true,
    }));

    expect(snap.request).toHaveBeenNthCalledWith(1, {
      method: 'snap_manageState',
      params: { operation: 'get', encrypted: false },
    });

    expect(snap.request).toHaveBeenNthCalledWith(2, {
      method: 'snap_manageState',
      params: {
        operation: 'update',
        newState: updatedState as unknown as Record<string, Json>,
        encrypted: false,
      },
    });
  });
});
