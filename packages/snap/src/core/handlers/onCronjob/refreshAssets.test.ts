import { KeyringEvent } from '@metamask/keyring-api';

import * as snapContext from '../../../snapContext';
import { Caip19Id } from '../../constants/solana';
import { MOCK_SOLANA_KEYRING_ACCOUNTS } from '../../test/mocks/solana-keyring-accounts';
import { refreshAssets } from './refreshAssets';

jest.mock('../../../snapContext', () => ({
  state: {
    get: jest.fn(),
    set: jest.fn(),
    update: jest.fn(async (updateFn) => Promise.resolve(updateFn({}))),
  },
  keyring: {
    listAccounts: jest.fn(),
    listAccountAssets: jest.fn(),
    getAccountBalances: jest.fn(),
    emitEvent: jest.fn(),
  },
  assetsService: {
    getNativeAsset: jest.fn(),
    discoverTokens: jest.fn(),
  },
  configProvider: {
    get: jest.fn(),
  },
}));

describe('refreshAssets', () => {
  const mockAccounts = [
    MOCK_SOLANA_KEYRING_ACCOUNTS[0],
    MOCK_SOLANA_KEYRING_ACCOUNTS[1],
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('skips if assets are already being fetched', async () => {
    jest.mocked(snapContext.state.get as jest.Mock).mockResolvedValueOnce({
      isFetchingAssets: true,
      assets: {},
    });

    await refreshAssets();

    expect(snapContext.state.set).not.toHaveBeenCalled();
  });

  it('skips if no accounts found', async () => {
    jest.mocked(snapContext.state.get as jest.Mock).mockResolvedValueOnce({
      isFetchingAssets: false,
      assets: {},
    });
    jest
      .mocked(snapContext.keyring.listAccounts as jest.Mock)
      .mockResolvedValueOnce([]);

    await refreshAssets();

    expect(snapContext.state.set).not.toHaveBeenCalled();
  });

  it('emits events when assets list changes', async () => {
    // Mock initial state
    jest.mocked(snapContext.state.get as jest.Mock).mockResolvedValueOnce({
      isFetchingAssets: false,
      assets: {
        [MOCK_SOLANA_KEYRING_ACCOUNTS[0].id]: {
          [Caip19Id.SolLocalnet]: { amount: '1', unit: 'SOL' },
        },
      },
    });

    // Mock account listing
    jest
      .mocked(snapContext.keyring.listAccounts as jest.Mock)
      .mockResolvedValueOnce(mockAccounts);

    // Mock new assets being discovered
    jest
      .mocked(snapContext.keyring.listAccountAssets as jest.Mock)
      .mockResolvedValueOnce([Caip19Id.SolLocalnet, Caip19Id.UsdcLocalnet]);

    // Mock balance fetching
    jest
      .mocked(snapContext.keyring.getAccountBalances as jest.Mock)
      .mockResolvedValueOnce({
        [Caip19Id.SolLocalnet]: { amount: '1', unit: 'SOL' },
        [Caip19Id.UsdcLocalnet]: { amount: '100', unit: 'USDC' },
      });

    await refreshAssets();

    expect(jest.mocked(snapContext.keyring.emitEvent).mock.calls).toStrictEqual(
      [
        [
          KeyringEvent.AccountAssetListUpdated,
          {
            assets: {
              [MOCK_SOLANA_KEYRING_ACCOUNTS[0].id]: {
                added: [Caip19Id.UsdcLocalnet],
                removed: [],
              },
            },
          },
        ],
        [
          KeyringEvent.AccountBalancesUpdated,
          {
            balances: {
              [MOCK_SOLANA_KEYRING_ACCOUNTS[0].id]: {
                [Caip19Id.UsdcLocalnet]: { amount: '100', unit: 'USDC' },
              },
            },
          },
        ],
      ],
    );
  });

  it('emits events when balances change', async () => {
    // Mock initial state
    jest.mocked(snapContext.state.get as jest.Mock).mockResolvedValueOnce({
      isFetchingAssets: false,
      assets: {
        [MOCK_SOLANA_KEYRING_ACCOUNTS[0].id]: {
          [Caip19Id.SolLocalnet]: { amount: '1', unit: 'SOL' },
        },
      },
    });

    // Mock account listing
    jest
      .mocked(snapContext.keyring.listAccounts as jest.Mock)
      .mockResolvedValueOnce(mockAccounts);

    // Mock same assets list
    jest
      .mocked(snapContext.keyring.listAccountAssets as jest.Mock)
      .mockResolvedValueOnce([Caip19Id.SolLocalnet, Caip19Id.UsdcLocalnet]);

    // Mock updated balance
    jest
      .mocked(snapContext.keyring.getAccountBalances as jest.Mock)
      .mockResolvedValueOnce({
        [Caip19Id.SolLocalnet]: { amount: '2', unit: 'SOL' },
        [Caip19Id.UsdcLocalnet]: { amount: '100', unit: 'USDC' },
      });

    await refreshAssets();

    // Verify balance update event was emitted
    expect(jest.mocked(snapContext.keyring.emitEvent).mock.calls).toStrictEqual(
      [
        [
          KeyringEvent.AccountAssetListUpdated,
          {
            assets: {
              [MOCK_SOLANA_KEYRING_ACCOUNTS[0].id]: {
                added: [Caip19Id.UsdcLocalnet],
                removed: [],
              },
            },
          },
        ],
        [
          KeyringEvent.AccountBalancesUpdated,
          {
            balances: {
              [MOCK_SOLANA_KEYRING_ACCOUNTS[0].id]: {
                [Caip19Id.UsdcLocalnet]: { amount: '100', unit: 'USDC' },
                [Caip19Id.SolLocalnet]: { amount: '2', unit: 'SOL' },
              },
            },
          },
        ],
      ],
    );
  });

  it('updates state with new assets and balances', async () => {
    // Mock initial state
    jest.mocked(snapContext.state.get as jest.Mock).mockResolvedValueOnce({
      isFetchingAssets: false,
      assets: {},
    });

    // Mock accounts
    jest
      .mocked(snapContext.keyring.listAccounts as jest.Mock)
      .mockResolvedValueOnce(mockAccounts);

    // Mock assets and balances for both accounts
    jest
      .mocked(snapContext.keyring.listAccountAssets as jest.Mock)
      .mockResolvedValueOnce([Caip19Id.SolLocalnet])
      .mockResolvedValueOnce([Caip19Id.UsdcLocalnet]);

    jest
      .mocked(snapContext.keyring.getAccountBalances as jest.Mock)
      .mockResolvedValueOnce({
        [Caip19Id.SolLocalnet]: { amount: '1', unit: 'SOL' },
      })
      .mockResolvedValueOnce({
        [Caip19Id.UsdcLocalnet]: { amount: '100', unit: 'USDC' },
      });

    await refreshAssets();

    // Verify final state update
    expect(snapContext.state.set).toHaveBeenCalledWith(
      expect.objectContaining({
        assets: {
          [MOCK_SOLANA_KEYRING_ACCOUNTS[0].id]: {
            [Caip19Id.SolLocalnet]: { amount: '1', unit: 'SOL' },
          },
          [MOCK_SOLANA_KEYRING_ACCOUNTS[1].id]: {
            [Caip19Id.UsdcLocalnet]: { amount: '100', unit: 'USDC' },
          },
        },
        isFetchingAssets: false,
      }),
    );
  });
});
