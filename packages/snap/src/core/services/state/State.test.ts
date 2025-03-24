import type { Json } from '@metamask/snaps-sdk';

import { KnownCaip19Id } from '../../constants/solana';
import { DEFAULT_STATE, State, type StateValue } from './State';

const snap = {
  request: jest.fn(),
};

(globalThis as any).snap = snap;

describe('SolanaState', () => {
  let solanaState: State;

  beforeEach(() => {
    solanaState = new State();
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
      assets: {
        '0': {
          [KnownCaip19Id.SolLocalnet]: { amount: '1', unit: 'SOL' },
        },
      },
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
      assets: {
        '0': {
          [KnownCaip19Id.SolLocalnet]: { amount: '1', unit: 'SOL' },
        },
      },
    };
    const updatedState = {
      assets: {
        '0': {
          [KnownCaip19Id.SolLocalnet]: { amount: '1', unit: 'SOL' },
        },
        '1': {
          [KnownCaip19Id.SolLocalnet]: { amount: '2', unit: 'SOL' },
        },
      },
    };
    snap.request.mockResolvedValueOnce(initialState);

    await solanaState.update(
      (state) =>
        ({
          assets: {
            ...(state?.assets ?? {}),
            '1': {
              [KnownCaip19Id.SolLocalnet]: { amount: '2', unit: 'SOL' },
            },
          },
        } as unknown as StateValue),
    );

    expect(snap.request).toHaveBeenCalledWith({
      method: 'snap_manageState',
      params: { operation: 'get', encrypted: false },
    });

    expect(snap.request).toHaveBeenCalledWith({
      method: 'snap_manageState',
      params: {
        operation: 'update',
        newState: updatedState as unknown as Record<string, Json>,
        encrypted: false,
      },
    });
  });
});
