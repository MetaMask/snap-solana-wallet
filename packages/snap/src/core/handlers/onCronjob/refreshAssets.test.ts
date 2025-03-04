import { KeyringEvent } from '@metamask/keyring-api';

import * as snapContext from '../../../snapContext';
import { KnownCaip19Id } from '../../constants/solana';
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

    await refreshAssets({
      request: {
        id: '1',
        method: 'cronjob',
        jsonrpc: '2.0',
      },
    });

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

    await refreshAssets({
      request: {
        id: '1',
        method: 'cronjob',
        jsonrpc: '2.0',
      },
    });

    expect(snapContext.state.set).not.toHaveBeenCalled();
  });

  it('emits events when assets list changes', async () => {
    // Mock initial state
    jest.mocked(snapContext.state.get as jest.Mock).mockResolvedValueOnce({
      isFetchingAssets: false,
      assets: {
        [MOCK_SOLANA_KEYRING_ACCOUNTS[0].id]: {
          [KnownCaip19Id.SolLocalnet]: { amount: '1', unit: 'SOL' },
        },
      },
      keyringAccounts: {
        [MOCK_SOLANA_KEYRING_ACCOUNTS[0].id]: MOCK_SOLANA_KEYRING_ACCOUNTS[0],
        [MOCK_SOLANA_KEYRING_ACCOUNTS[1].id]: MOCK_SOLANA_KEYRING_ACCOUNTS[1],
      },
    });

    // Mock account listing
    jest
      .mocked(snapContext.keyring.listAccounts as jest.Mock)
      .mockResolvedValueOnce(mockAccounts);

    // Mock new assets being discovered for both accounts
    jest
      .mocked(snapContext.keyring.listAccountAssets as jest.Mock)
      .mockResolvedValueOnce([
        KnownCaip19Id.SolLocalnet,
        KnownCaip19Id.UsdcLocalnet,
      ])
      .mockResolvedValueOnce([
        KnownCaip19Id.SolLocalnet,
        KnownCaip19Id.UsdcLocalnet,
      ]);

    // Mock balance fetching for both accounts
    jest
      .mocked(snapContext.keyring.getAccountBalances as jest.Mock)
      .mockResolvedValueOnce({
        [KnownCaip19Id.SolLocalnet]: { amount: '1', unit: 'SOL' },
        [KnownCaip19Id.UsdcLocalnet]: { amount: '100', unit: 'USDC' },
      })
      .mockResolvedValueOnce({
        [KnownCaip19Id.SolLocalnet]: { amount: '1', unit: 'SOL' },
        [KnownCaip19Id.UsdcLocalnet]: { amount: '100', unit: 'USDC' },
      });

    await refreshAssets({
      request: {
        id: '1',
        method: 'cronjob',
        jsonrpc: '2.0',
      },
    });

    expect(jest.mocked(snapContext.keyring.emitEvent).mock.calls).toStrictEqual(
      [
        [
          KeyringEvent.AccountAssetListUpdated,
          {
            assets: {
              [MOCK_SOLANA_KEYRING_ACCOUNTS[0].id]: {
                added: [KnownCaip19Id.UsdcLocalnet],
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
                [KnownCaip19Id.UsdcLocalnet]: { amount: '100', unit: 'USDC' },
              },
            },
          },
        ],
        [
          KeyringEvent.AccountAssetListUpdated,
          {
            assets: {
              [MOCK_SOLANA_KEYRING_ACCOUNTS[1].id]: {
                added: [KnownCaip19Id.SolLocalnet, KnownCaip19Id.UsdcLocalnet],
                removed: [],
              },
            },
          },
        ],
        [
          KeyringEvent.AccountBalancesUpdated,
          {
            balances: {
              [MOCK_SOLANA_KEYRING_ACCOUNTS[1].id]: {
                [KnownCaip19Id.SolLocalnet]: { amount: '1', unit: 'SOL' },
                [KnownCaip19Id.UsdcLocalnet]: { amount: '100', unit: 'USDC' },
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
          [KnownCaip19Id.SolLocalnet]: { amount: '1', unit: 'SOL' },
          [KnownCaip19Id.UsdcLocalnet]: { amount: '50', unit: 'USDC' },
        },
      },
      keyringAccounts: {
        [MOCK_SOLANA_KEYRING_ACCOUNTS[0].id]: MOCK_SOLANA_KEYRING_ACCOUNTS[0],
        [MOCK_SOLANA_KEYRING_ACCOUNTS[1].id]: MOCK_SOLANA_KEYRING_ACCOUNTS[1],
      },
    });

    // Mock account listing
    jest
      .mocked(snapContext.keyring.listAccounts as jest.Mock)
      .mockResolvedValueOnce(mockAccounts);

    // Mock same assets list
    jest
      .mocked(snapContext.keyring.listAccountAssets as jest.Mock)
      .mockResolvedValueOnce([
        KnownCaip19Id.SolLocalnet,
        KnownCaip19Id.UsdcLocalnet,
      ])
      .mockResolvedValueOnce([
        KnownCaip19Id.SolLocalnet,
        KnownCaip19Id.UsdcLocalnet,
      ]);

    // Mock updated balance
    jest
      .mocked(snapContext.keyring.getAccountBalances as jest.Mock)
      .mockResolvedValueOnce({
        [KnownCaip19Id.SolLocalnet]: { amount: '2', unit: 'SOL' },
        [KnownCaip19Id.UsdcLocalnet]: { amount: '100', unit: 'USDC' },
      })
      .mockResolvedValueOnce({
        [KnownCaip19Id.SolLocalnet]: { amount: '2', unit: 'SOL' },
        [KnownCaip19Id.UsdcLocalnet]: { amount: '100', unit: 'USDC' },
      });

    await refreshAssets({
      request: {
        id: '1',
        method: 'cronjob',
        jsonrpc: '2.0',
      },
    });

    // Verify balance update event was emitted
    expect(jest.mocked(snapContext.keyring.emitEvent).mock.calls).toStrictEqual(
      [
        [
          KeyringEvent.AccountBalancesUpdated,
          {
            balances: {
              [MOCK_SOLANA_KEYRING_ACCOUNTS[0].id]: {
                [KnownCaip19Id.SolLocalnet]: { amount: '2', unit: 'SOL' },
                [KnownCaip19Id.UsdcLocalnet]: { amount: '100', unit: 'USDC' },
              },
            },
          },
        ],
        [
          KeyringEvent.AccountAssetListUpdated,
          {
            assets: {
              [MOCK_SOLANA_KEYRING_ACCOUNTS[1].id]: {
                added: [KnownCaip19Id.SolLocalnet, KnownCaip19Id.UsdcLocalnet],
                removed: [],
              },
            },
          },
        ],
        [
          KeyringEvent.AccountBalancesUpdated,
          {
            balances: {
              [MOCK_SOLANA_KEYRING_ACCOUNTS[1].id]: {
                [KnownCaip19Id.SolLocalnet]: { amount: '2', unit: 'SOL' },
                [KnownCaip19Id.UsdcLocalnet]: { amount: '100', unit: 'USDC' },
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
      keyringAccounts: {
        [MOCK_SOLANA_KEYRING_ACCOUNTS[0].id]: MOCK_SOLANA_KEYRING_ACCOUNTS[0],
        [MOCK_SOLANA_KEYRING_ACCOUNTS[1].id]: MOCK_SOLANA_KEYRING_ACCOUNTS[1],
      },
    });

    // Mock accounts
    jest
      .mocked(snapContext.keyring.listAccounts as jest.Mock)
      .mockResolvedValueOnce(mockAccounts);

    // Mock assets and balances for both accounts
    jest
      .mocked(snapContext.keyring.listAccountAssets as jest.Mock)
      .mockResolvedValueOnce([
        KnownCaip19Id.SolLocalnet,
        KnownCaip19Id.UsdcLocalnet,
      ])
      .mockResolvedValueOnce([
        KnownCaip19Id.SolLocalnet,
        KnownCaip19Id.UsdcLocalnet,
      ]);

    jest
      .mocked(snapContext.keyring.getAccountBalances as jest.Mock)
      .mockResolvedValueOnce({
        [KnownCaip19Id.SolLocalnet]: { amount: '1', unit: 'SOL' },
        [KnownCaip19Id.UsdcLocalnet]: { amount: '100', unit: 'USDC' },
      })
      .mockResolvedValueOnce({
        [KnownCaip19Id.SolLocalnet]: { amount: '2', unit: 'SOL' },
        [KnownCaip19Id.UsdcLocalnet]: { amount: '100', unit: 'USDC' },
      });

    await refreshAssets({
      request: {
        id: '1',
        method: 'cronjob',
        jsonrpc: '2.0',
      },
    });

    // Verify final state update
    expect(snapContext.state.set).toHaveBeenCalledWith(
      expect.objectContaining({
        assets: {
          [MOCK_SOLANA_KEYRING_ACCOUNTS[1].id]: {
            [KnownCaip19Id.SolLocalnet]: { amount: '2', unit: 'SOL' },
            [KnownCaip19Id.UsdcLocalnet]: { amount: '100', unit: 'USDC' },
          },
          [MOCK_SOLANA_KEYRING_ACCOUNTS[0].id]: {
            [KnownCaip19Id.SolLocalnet]: { amount: '1', unit: 'SOL' },
            [KnownCaip19Id.UsdcLocalnet]: { amount: '100', unit: 'USDC' },
          },
        },
        isFetchingAssets: false,
        keyringAccounts: {
          [MOCK_SOLANA_KEYRING_ACCOUNTS[0].id]: MOCK_SOLANA_KEYRING_ACCOUNTS[0],
          [MOCK_SOLANA_KEYRING_ACCOUNTS[1].id]: MOCK_SOLANA_KEYRING_ACCOUNTS[1],
        },
      }),
    );
  });
});
