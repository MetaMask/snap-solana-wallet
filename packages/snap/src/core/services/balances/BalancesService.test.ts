import type { Transaction } from '@metamask/keyring-api';
import { SolAccountType, SolMethod, SolScope } from '@metamask/keyring-api';
import type { Json } from '@metamask/utils';

import {
  KnownCaip19Id,
  Network,
  SolanaCaip19Tokens,
} from '../../constants/solana';
import { SOLANA_MOCK_TOKEN_METADATA } from '../../test/mocks/solana-assets';
import {
  MOCK_SOLANA_KEYRING_ACCOUNT_0,
  MOCK_SOLANA_KEYRING_ACCOUNT_1,
} from '../../test/mocks/solana-keyring-accounts';
import logger from '../../utils/logger';
import { AssetsService } from '../assets/AssetsService';
import type { SolanaConnection } from '../connection/SolanaConnection';
import type { EncryptedStateValue } from '../encrypted-state/EncryptedState';
import { EncryptedState } from '../encrypted-state/EncryptedState';
import { createMockConnection } from '../mocks/mockConnection';
import type { TokenMetadataService } from '../token-metadata/TokenMetadata';
import { BalancesService } from './BalancesService';

describe('BalancesService', () => {
  let mockStateValue: EncryptedStateValue;
  let mockState: EncryptedState;

  let mockConnection: SolanaConnection;
  let balancesService: BalancesService;
  let mockTokenMetadataService: TokenMetadataService;

  beforeEach(() => {
    /**
     * Mock fully working state
     */
    mockState = new EncryptedState();

    mockStateValue = {
      keyringAccounts: {},
      mapInterfaceNameToId: {},
      isFetchingAssets: false,
      assets: {},
      isFetchingTransactions: false,
      transactions: {},
      metadata: {},
      tokenPrices: {},
    };

    const snap = {
      request: jest
        .fn()
        .mockImplementation(
          async ({
            method,
            params,
          }: {
            method: string;
            params: { operation: string; newState: Record<string, Json> };
          }) => {
            switch (method) {
              case 'snap_manageState':
                switch (params.operation) {
                  case 'get':
                    return mockStateValue;
                  case 'update':
                    mockStateValue = params.newState as EncryptedStateValue;
                    return null;
                  case 'clear':
                    mockStateValue = {} as EncryptedStateValue;
                    return null;
                  default:
                    throw new Error(`Unknown operation: ${params.operation}`);
                }
              case 'snap_manageAccounts':
                return {
                  [MOCK_SOLANA_KEYRING_ACCOUNT_0.id]:
                    MOCK_SOLANA_KEYRING_ACCOUNT_0,
                  [MOCK_SOLANA_KEYRING_ACCOUNT_1.id]:
                    MOCK_SOLANA_KEYRING_ACCOUNT_1,
                };
              default:
                throw new Error(`Unknown method: ${method}`);
            }
          },
        ),
    };
    (globalThis as any).snap = snap;

    /**
     * Other mocks
     */
    mockConnection = createMockConnection();

    mockTokenMetadataService = {
      getTokensMetadata: jest
        .fn()
        .mockResolvedValue(SOLANA_MOCK_TOKEN_METADATA),
    } as unknown as TokenMetadataService;

    const mockAssetsService = new AssetsService({
      connection: mockConnection,
      logger,
    });

    const mockRefreshAssets = jest.fn().mockResolvedValue(undefined);

    balancesService = new BalancesService(
      mockAssetsService,
      mockTokenMetadataService,
      mockState,
      mockRefreshAssets,
    );
  });

  describe('getAccountBalances', () => {
    it('gets account balance', async () => {
      const accountBalance = await balancesService.getAccountBalances(
        MOCK_SOLANA_KEYRING_ACCOUNT_1,
        [KnownCaip19Id.SolLocalnet],
      );
      expect(accountBalance).toStrictEqual({
        [KnownCaip19Id.SolLocalnet]: {
          amount: '0.123456789',
          unit: 'SOL',
        },
      });
    });

    it('gets account and token balances', async () => {
      const accountBalance = await balancesService.getAccountBalances(
        MOCK_SOLANA_KEYRING_ACCOUNT_1,
        [
          `${Network.Localnet}/${SolanaCaip19Tokens.SOL}`,
          `${Network.Localnet}/token:address1`,
          `${Network.Localnet}/token:address2`,
        ],
      );
      expect(accountBalance).toStrictEqual({
        [`${Network.Localnet}/${SolanaCaip19Tokens.SOL}`]: {
          amount: '0.123456789',
          unit: 'SOL',
        },
        [`${Network.Localnet}/token:address1`]: {
          amount: '0.123456789',
          unit: 'MOCK1',
        },
        [`${Network.Localnet}/token:address2`]: {
          amount: '0.987654321',
          unit: 'MOCK2',
        },
      });
    });

    it('throws an error if balance fails to be retrieved', async () => {
      const mockSend = jest
        .fn()
        .mockRejectedValueOnce(new Error('Error getting assets'));
      const mockGetBalance = jest.fn().mockReturnValue({ send: mockSend });
      jest.spyOn(mockConnection, 'getRpc').mockReturnValue({
        getBalance: mockGetBalance,
        getTokenAccountsByOwner: mockGetBalance,
      } as any);

      await expect(
        balancesService.getAccountBalances(MOCK_SOLANA_KEYRING_ACCOUNT_1, [
          KnownCaip19Id.SolMainnet,
        ]),
      ).rejects.toThrow('Error getting assets');
    });
  });

  describe('updateBalancesPostTransaction', () => {
    const MOCK_ACCOUNT_1 = {
      id: 'account-1',
      address: 'address-1',
      type: SolAccountType.DataAccount,
      index: 0,
      methods: [SolMethod.SendAndConfirmTransaction],
      scopes: [SolScope.Mainnet],
      options: {
        imported: false,
      },
    };

    const MOCK_ACCOUNT_2 = {
      id: 'account-2',
      address: 'address-2',
      type: SolAccountType.DataAccount,
      index: 1,
      methods: [SolMethod.SendAndConfirmTransaction],
      scopes: [SolScope.Mainnet],
      options: {
        imported: false,
      },
    };

    const MOCK_UNTRACKED_ADDRESS = 'untracked-address';

    const MOCK_NATIVE_ASSET =
      `${Network.Localnet}/${SolanaCaip19Tokens.SOL}` as const;
    const MOCK_SPL_TOKEN_1 = `${Network.Localnet}/token:mock-token-1` as const;
    const MOCK_SPL_TOKEN_2 = `${Network.Localnet}/token:mock-token-2` as const;
    const MOCK_SPL_TOKEN_3 = `${Network.Localnet}/token:mock-token-3` as const;

    it('correctly updates balances after processing transactions', async () => {
      const mockTransactions: Transaction[] = [
        {
          id: 'tx-1',
          type: 'send' as const,
          chain: `${Network.Localnet}:chain` as const,
          account: MOCK_ACCOUNT_1.id,
          status: 'confirmed' as const,
          timestamp: Date.now(),
          events: [
            {
              status: 'confirmed' as const,
              timestamp: Date.now(),
            },
          ],
          fees: [
            {
              type: 'base' as const,
              asset: {
                type: MOCK_NATIVE_ASSET,
                amount: '0.000005',
                unit: 'SOL',
                fungible: true,
              },
            },
          ],
          from: [
            // From account 1: sending native asset (has balance)
            {
              address: MOCK_ACCOUNT_1.address,
              asset: {
                type: MOCK_NATIVE_ASSET,
                amount: '0.5',
                unit: 'SOL',
                fungible: true,
              },
            },
            // From account 1: sending SPL token (has balance)
            {
              address: MOCK_ACCOUNT_1.address,
              asset: {
                type: MOCK_SPL_TOKEN_1,
                amount: '50',
                unit: 'TOKEN1',
                fungible: true,
              },
            },
            // From account 2: sending native asset (no balance)
            {
              address: MOCK_ACCOUNT_2.address,
              asset: {
                type: MOCK_SPL_TOKEN_3,
                amount: '75',
                unit: 'TOKEN3',
                fungible: true,
              },
            },
            // From untracked address (should be ignored)
            {
              address: MOCK_UNTRACKED_ADDRESS,
              asset: {
                type: MOCK_NATIVE_ASSET,
                amount: '1.0',
                unit: 'SOL',
                fungible: true,
              },
            },
          ],
          to: [
            // To account 2: receiving native asset (has balance)
            {
              address: MOCK_ACCOUNT_2.address,
              asset: {
                type: MOCK_NATIVE_ASSET,
                amount: '0.5',
                unit: 'SOL',
                fungible: true,
              },
            },
            // To account 2: receiving SPL token (has balance)
            {
              address: MOCK_ACCOUNT_2.address,
              asset: {
                type: MOCK_SPL_TOKEN_2,
                amount: '100',
                unit: 'TOKEN2',
                fungible: true,
              },
            },
            // To account 1: receiving new SPL token (no previous balance)
            {
              address: MOCK_ACCOUNT_1.address,
              asset: {
                type: MOCK_SPL_TOKEN_3,
                amount: '150',
                unit: 'TOKEN3',
                fungible: true,
              },
            },
            // To untracked address (should be ignored)
            {
              address: MOCK_UNTRACKED_ADDRESS,
              asset: {
                type: MOCK_SPL_TOKEN_1,
                amount: '25',
                unit: 'TOKEN1',
                fungible: true,
              },
            },
          ],
        },
      ];

      mockStateValue = {
        keyringAccounts: {
          [MOCK_ACCOUNT_1.id]: MOCK_ACCOUNT_1,
          [MOCK_ACCOUNT_2.id]: MOCK_ACCOUNT_2,
        },
        mapInterfaceNameToId: {},
        isFetchingTransactions: false,
        transactions: {},
        isFetchingAssets: false,
        assets: {
          [MOCK_ACCOUNT_1.id]: {
            [MOCK_NATIVE_ASSET]: {
              amount: '1.5',
              unit: 'SOL',
            },
            [MOCK_SPL_TOKEN_1]: {
              amount: '100',
              unit: 'TOKEN1',
            },
          },
          [MOCK_ACCOUNT_2.id]: {
            [MOCK_NATIVE_ASSET]: {
              amount: '2.0',
              unit: 'SOL',
            },
            [MOCK_SPL_TOKEN_2]: {
              amount: '200',
              unit: 'TOKEN2',
            },
          },
        },
        metadata: {},
        tokenPrices: {},
      };

      // Create a mock refreshAssets function that updates the state with expected values
      const mockRefreshAssets = jest
        .fn()
        .mockImplementation(async ({ request }) => {
          const { accountId } = request.params;

          // Update the state based on the account ID
          await mockState.update((state) => {
            if (accountId === MOCK_ACCOUNT_1.id) {
              return {
                ...state,
                assets: {
                  ...state.assets,
                  [MOCK_ACCOUNT_1.id]: {
                    [MOCK_NATIVE_ASSET]: {
                      amount: '1', // 1.5 - 0.5
                      unit: 'SOL',
                    },
                    [MOCK_SPL_TOKEN_1]: {
                      amount: '50', // 100 - 50
                      unit: 'TOKEN1',
                    },
                    [MOCK_SPL_TOKEN_3]: {
                      amount: '150', // 0 + 150 (new token)
                      unit: 'TOKEN3',
                    },
                  },
                },
              };
            } else if (accountId === MOCK_ACCOUNT_2.id) {
              return {
                ...state,
                assets: {
                  ...state.assets,
                  [MOCK_ACCOUNT_2.id]: {
                    [MOCK_NATIVE_ASSET]: {
                      amount: '2.5', // 2.0 + 0.5
                      unit: 'SOL',
                    },
                    [MOCK_SPL_TOKEN_2]: {
                      amount: '300', // 200 + 100
                      unit: 'TOKEN2',
                    },
                  },
                },
              };
            }
            return state;
          });
        });

      // Create a new balancesService with our custom mock
      const testBalancesService = new BalancesService(
        new AssetsService({
          connection: mockConnection,
          logger,
        }),
        mockTokenMetadataService,
        mockState,
        mockRefreshAssets,
      );

      await Promise.all(
        mockTransactions.map(async (transaction) =>
          testBalancesService.updateBalancesPostTransaction(transaction),
        ),
      );

      const updatedState = await mockState.get();

      // Verify account 1 balances
      expect(updatedState.assets[MOCK_ACCOUNT_1.id]).toStrictEqual({
        [MOCK_NATIVE_ASSET]: {
          amount: '1', // 1.5 - 0.5
          unit: 'SOL',
        },
        [MOCK_SPL_TOKEN_1]: {
          amount: '50', // 100 - 50
          unit: 'TOKEN1',
        },
        [MOCK_SPL_TOKEN_3]: {
          amount: '150', // 0 + 150 (new token)
          unit: 'TOKEN3',
        },
      });

      // Verify account 2 balances
      expect(updatedState.assets[MOCK_ACCOUNT_2.id]).toStrictEqual({
        [MOCK_NATIVE_ASSET]: {
          amount: '2.5', // 2.0 + 0.5
          unit: 'SOL',
        },
        [MOCK_SPL_TOKEN_2]: {
          amount: '300', // 200 + 100
          unit: 'TOKEN2',
        },
      });

      // Verify that we did not add any new accounts, like the UNTRACKED_ADDRESS
      expect(Object.keys(updatedState.assets)).toHaveLength(2);
    });
  });
});
