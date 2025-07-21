/* eslint-disable @typescript-eslint/no-non-null-assertion */

import type { Transaction } from '@metamask/keyring-api';
import { TOKEN_PROGRAM_ADDRESS } from '@solana-program/token';
import { lamports, signature } from '@solana/kit';

import type {
  AccountNotification,
  AccountNotificationHandler,
  ProgramNotification,
  ProgramNotificationHandler,
  Subscription,
} from '../../../entities';
import { EventEmitter } from '../../../infrastructure';
import { KnownCaip19Id, Network } from '../../constants/solana';
import { MOCK_SOLANA_KEYRING_ACCOUNTS } from '../../test/mocks/solana-keyring-accounts';
import type { AssetsService } from '../assets/AssetsService';
import type { ConfigProvider } from '../config';
import type { Config } from '../config/ConfigProvider';
import { mockLogger } from '../mocks/logger';
import type { SubscriptionService } from '../subscriptions/SubscriptionService';
import type { TransactionsService } from '../transactions/TransactionsService';
import type { AccountsService } from './AccountsService';
import { KeyringAccountMonitor } from './KeyringAccountMonitor';

describe('KeyringAccountMonitor', () => {
  let keyringAccountMonitor: KeyringAccountMonitor;
  let mockSubscriptionService: SubscriptionService;
  let mockAccountService: AccountsService;
  let mockAssetsService: AssetsService;
  let mockTransactionsService: TransactionsService;
  let mockConfigProvider: ConfigProvider;
  let mockEventEmitter: EventEmitter;

  const account = MOCK_SOLANA_KEYRING_ACCOUNTS[0];

  let notificationHandlers: (
    | AccountNotificationHandler
    | ProgramNotificationHandler
  )[] = [];

  beforeEach(() => {
    jest.clearAllMocks();

    notificationHandlers = [];

    mockSubscriptionService = {
      subscribe: jest.fn().mockImplementation(async (request) => {
        // Return a simple hash of the request for testing purposes
        return JSON.stringify(request)
          .split('')
          .reduce((acc, char) => acc + char.charCodeAt(0), 0)
          .toString();
      }),
      unsubscribe: jest.fn(),
      getAll: jest.fn().mockResolvedValue([]),
      registerNotificationHandler: jest
        .fn()
        .mockImplementation(async (method, network, handler) => {
          notificationHandlers.push(handler);
        }),
      registerConnectionRecoveryHandler: jest.fn(),
    } as unknown as SubscriptionService;

    mockAccountService = {
      getAll: jest.fn(),
      findByAddress: jest.fn(),
    } as unknown as AccountsService;

    mockAssetsService = {
      getTokenAccountsByOwnerMultiple: jest.fn(),
      saveAsset: jest.fn(),
    } as unknown as AssetsService;

    mockTransactionsService = {
      fetchLatestSignatures: jest.fn(),
      fetchBySignature: jest.fn(),
      saveTransaction: jest.fn(),
    } as unknown as TransactionsService;

    mockConfigProvider = {
      get: jest.fn().mockReturnValue({
        activeNetworks: [Network.Mainnet],
      }),
    } as unknown as ConfigProvider;

    mockEventEmitter = new EventEmitter(mockLogger);

    keyringAccountMonitor = new KeyringAccountMonitor(
      mockSubscriptionService,
      mockAccountService,
      mockAssetsService,
      mockTransactionsService,
      mockConfigProvider,
      mockEventEmitter,
      mockLogger,
    );
  });

  describe('constructor', () => {
    it('registers handlers for account and program notifications', () => {
      expect(
        mockSubscriptionService.registerNotificationHandler,
      ).toHaveBeenCalledWith(
        'accountSubscribe',
        Network.Mainnet,
        expect.any(Function),
      );
    });

    it('registers handlers for connection recovery', () => {
      expect(
        mockSubscriptionService.registerConnectionRecoveryHandler,
      ).toHaveBeenCalledWith(Network.Mainnet, expect.any(Function));
    });
  });

  describe('#handleOnStart', () => {
    it('starts monitoring all keyring accounts', async () => {
      // Setup 2 keyring accounts
      jest
        .spyOn(mockAccountService, 'getAll')
        .mockResolvedValue([
          MOCK_SOLANA_KEYRING_ACCOUNTS[0],
          MOCK_SOLANA_KEYRING_ACCOUNTS[1],
        ]);

      jest
        .spyOn(keyringAccountMonitor, 'stopMonitorKeyringAccount')
        .mockResolvedValue(undefined);

      jest
        .spyOn(keyringAccountMonitor, 'monitorKeyringAccount')
        .mockResolvedValue(undefined);

      // Simulate a onStart event to start monitoring
      await mockEventEmitter.emitSync('onStart');

      // No account previously monitored
      expect(
        keyringAccountMonitor.stopMonitorKeyringAccount,
      ).not.toHaveBeenCalled();

      // 2 accounts to monitor
      expect(keyringAccountMonitor.monitorKeyringAccount).toHaveBeenCalledTimes(
        2,
      );
    });

    it('stops monitoring all previously monitored keyring accounts', async () => {
      // Setup 2 keyring accounts, already being monitored
      const accounts = [
        MOCK_SOLANA_KEYRING_ACCOUNTS[0]!,
        MOCK_SOLANA_KEYRING_ACCOUNTS[1]!,
      ] as const;

      await keyringAccountMonitor.monitorKeyringAccount(accounts[0]);
      await keyringAccountMonitor.monitorKeyringAccount(accounts[1]);
      (mockSubscriptionService.subscribe as jest.Mock).mockClear();

      jest
        .spyOn(mockAccountService, 'getAll')
        .mockResolvedValue([
          MOCK_SOLANA_KEYRING_ACCOUNTS[0],
          MOCK_SOLANA_KEYRING_ACCOUNTS[1],
        ]);

      jest
        .spyOn(keyringAccountMonitor, 'stopMonitorKeyringAccount')
        .mockResolvedValue(undefined);

      jest
        .spyOn(keyringAccountMonitor, 'monitorKeyringAccount')
        .mockResolvedValue(undefined);

      // Simulate an onStart event to re-initialize the monitor
      await mockEventEmitter.emitSync('onStart');

      // 2 accounts to stop monitoring
      expect(
        keyringAccountMonitor.stopMonitorKeyringAccount,
      ).toHaveBeenCalledTimes(2);

      // 2 accounts to monitor again
      expect(keyringAccountMonitor.monitorKeyringAccount).toHaveBeenCalledTimes(
        2,
      );
    });
  });

  describe('monitorKeyringAccount', () => {
    it('monitors the account native and token assets', async () => {
      // Setup 2 active networks
      jest.spyOn(mockConfigProvider, 'get').mockReturnValue({
        activeNetworks: [Network.Mainnet, Network.Devnet],
      } as unknown as Config);

      await keyringAccountMonitor.monitorKeyringAccount(account);

      /**
       * To monitor the account, we expect 3 calls per network:
       * - 1 call to monitor the native asset
       * - 2 calls to monitor each of the token programs
       * We have 2 networks, 2 * 3 = 6 calls in total
       */
      expect(mockSubscriptionService.subscribe).toHaveBeenCalledTimes(6);
    });

    it('respects account scopes when monitoring multiple networks', async () => {
      const accountWithLimitedScopes = {
        ...account,
        scopes: [Network.Mainnet], // Only mainnet, not devnet
      };

      jest.spyOn(mockConfigProvider, 'get').mockReturnValue({
        activeNetworks: [Network.Mainnet, Network.Devnet],
      } as unknown as Config);

      await keyringAccountMonitor.monitorKeyringAccount(
        accountWithLimitedScopes,
      );

      // Should only monitor mainnet (1 native asset), not devnet
      expect(mockSubscriptionService.subscribe).toHaveBeenCalledTimes(3);
    });

    it("does not monitor an account on an active network that is not in the account's scopes", async () => {
      // Setup 1 active network
      jest.spyOn(mockConfigProvider, 'get').mockReturnValue({
        activeNetworks: [Network.Mainnet],
      } as unknown as Config);

      const accountWithDifferentScopes = {
        ...account,
        scopes: [Network.Devnet],
      };

      await keyringAccountMonitor.monitorKeyringAccount(
        accountWithDifferentScopes,
      );

      expect(mockSubscriptionService.subscribe).not.toHaveBeenCalled();
    });

    it('does not monitor an account that is already monitored', async () => {
      // Setup 1 active network
      jest.spyOn(mockConfigProvider, 'get').mockReturnValue({
        activeNetworks: [Network.Mainnet],
      } as unknown as Config);

      // Try to monitor the same account twice
      await keyringAccountMonitor.monitorKeyringAccount(account);
      await keyringAccountMonitor.monitorKeyringAccount(account);

      expect(mockSubscriptionService.subscribe).toHaveBeenCalledTimes(3);
    });
  });

  describe('stopMonitorKeyringAccount', () => {
    it('stops monitoring the account native and token assets on all active networks', async () => {
      // Setup 2 active networks
      jest.spyOn(mockConfigProvider, 'get').mockReturnValue({
        activeNetworks: [Network.Mainnet, Network.Devnet],
      } as unknown as Config);

      await keyringAccountMonitor.monitorKeyringAccount(account);

      await keyringAccountMonitor.stopMonitorKeyringAccount(account);

      // Account has 2 networks, 2 * 3 = 6 calls in total
      expect(mockSubscriptionService.unsubscribe).toHaveBeenCalledTimes(6);
    });
  });

  describe('when receiving a notification', () => {
    const mockSignature = signature(
      '4Pjp2FVBTA2FQCbF3UurnHES3hz2Zx5pTJeVEVhvcCCS7m5CytKqLvcQUGiUMPSBVW5V3dL5N8jwXpT8eV52Sw7b',
    );

    const mockCausingTransaction = {
      id: mockSignature.toString(),
    } as unknown as Transaction;

    beforeEach(() => {
      // Setup 1 active network for simplicity
      jest.spyOn(mockConfigProvider, 'get').mockReturnValue({
        activeNetworks: [Network.Mainnet],
      } as unknown as Config);

      jest
        .spyOn(mockTransactionsService, 'fetchLatestSignatures')
        .mockResolvedValue([mockSignature]);

      jest
        .spyOn(mockTransactionsService, 'fetchBySignature')
        .mockResolvedValue(mockCausingTransaction);

      jest
        .spyOn(mockAccountService, 'findByAddress')
        .mockResolvedValue(account);
    });

    describe('when the native asset changed', () => {
      const mockNotification = {
        params: {
          result: {
            value: {
              lamports: lamports(1000000000n), // 1 SOL
            },
          },
        },
      } as unknown as AccountNotification;

      const mockSubscription = {
        method: 'accountSubscribe',
        network: Network.Mainnet,
        params: [account.address, { commitment: 'confirmed' as const }],
      } as unknown as Subscription;

      it('saves the new balance of the native asset', async () => {
        await keyringAccountMonitor.monitorKeyringAccount(account);

        // Send the notification by manually calling the handler
        const handler = notificationHandlers[0]!;
        await handler(mockNotification, mockSubscription);

        expect(mockAssetsService.saveAsset).toHaveBeenCalledWith(
          account,
          KnownCaip19Id.SolMainnet,
          {
            amount: '1',
            unit: 'SOL',
          },
        );

        expect(mockTransactionsService.saveTransaction).toHaveBeenCalledWith(
          mockCausingTransaction,
          account,
        );
      });

      it('fetches and saves the transaction that caused the native asset balance to change', async () => {
        await keyringAccountMonitor.monitorKeyringAccount(account);

        // Send the notification by manually calling the handler
        const handler = notificationHandlers[0]!;
        await handler(mockNotification, mockSubscription);

        expect(mockTransactionsService.saveTransaction).toHaveBeenCalledWith(
          mockCausingTransaction,
          account,
        );
      });

      it('does not save the new balance of the native asset when lamports is missing', async () => {
        const mockNotificationWithMissingMint = {
          value: {
            lamports: undefined,
          },
        } as unknown as AccountNotification;

        await keyringAccountMonitor.monitorKeyringAccount(account);

        const handler = notificationHandlers[0]!;
        await handler(mockNotificationWithMissingMint, mockSubscription);

        expect(mockAssetsService.saveAsset).not.toHaveBeenCalled();
      });
    });

    describe('when a token asset changed', () => {
      const mockNotification = {
        params: {
          result: {
            value: {
              account: {
                data: {
                  parsed: {
                    info: {
                      mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
                      owner: 'BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP',
                      tokenAmount: {
                        uiAmountString: '123456789',
                      },
                    },
                  },
                },
              },
              pubkey: '9wt9PfjPD3JCy5r7o4K1cTGiuTG7fq2pQhdDCdQALKjg',
            },
          },
        },
      } as unknown as ProgramNotification;

      const mockSubscription = {
        method: 'programSubscribe',
        network: Network.Mainnet,
        params: [TOKEN_PROGRAM_ADDRESS, { commitment: 'confirmed' as const }],
      } as unknown as Subscription;

      it('saves the new balance of the token asset and the transaction that caused it', async () => {
        await keyringAccountMonitor.monitorKeyringAccount(account);

        const handler = notificationHandlers[1]!;
        await handler(mockNotification, mockSubscription);

        expect(mockAssetsService.saveAsset).toHaveBeenCalledWith(
          account,
          KnownCaip19Id.UsdcMainnet,
          { amount: '123456789', unit: '' },
        );
        expect(mockTransactionsService.saveTransaction).toHaveBeenCalledWith(
          mockCausingTransaction,
          account,
        );
      });

      it('fetches and saves the transaction that caused the token asset to change', async () => {
        await keyringAccountMonitor.monitorKeyringAccount(account);

        const handler = notificationHandlers[1]!;
        await handler(mockNotification, mockSubscription);

        expect(mockTransactionsService.saveTransaction).toHaveBeenCalledWith(
          mockCausingTransaction,
          account,
        );
      });

      it('does not save the new balance of the token asset when mint address is missing', async () => {
        const mockNotificationWithMissingMint = {
          value: {
            data: {
              parsed: {
                info: {
                  mint: undefined,
                },
              },
            },
          },
        } as unknown as AccountNotification;

        await keyringAccountMonitor.monitorKeyringAccount(account);

        const handler = notificationHandlers[1]!;
        await handler(mockNotificationWithMissingMint, mockSubscription);

        expect(mockAssetsService.saveAsset).not.toHaveBeenCalled();
      });

      it('does not save the new balance of the token asset when uiAmountString is missing', async () => {
        const mockNotificationWithMissingMint = {
          value: {
            data: {
              parsed: {
                info: {
                  mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
                  tokenAmount: {
                    uiAmountString: undefined,
                  },
                },
              },
            },
          },
        } as unknown as AccountNotification;

        await keyringAccountMonitor.monitorKeyringAccount(account);

        const handler = notificationHandlers[1]!;
        await handler(mockNotificationWithMissingMint, mockSubscription);

        expect(mockAssetsService.saveAsset).not.toHaveBeenCalled();
      });

      describe('when #saveCausingTransaction encounters errors', () => {
        it('handles when no signatures are found', async () => {
          // No signatures found for the token account
          jest
            .spyOn(mockTransactionsService, 'fetchLatestSignatures')
            .mockResolvedValue([]);

          await keyringAccountMonitor.monitorKeyringAccount(account);

          const handler = notificationHandlers[1]!;
          await handler(mockNotification, mockSubscription);

          expect(
            mockTransactionsService.saveTransaction,
          ).not.toHaveBeenCalled();
        });

        it('handles when transaction is not found', async () => {
          // No transaction found for the token account
          jest
            .spyOn(mockTransactionsService, 'fetchBySignature')
            .mockResolvedValue(null);

          await keyringAccountMonitor.monitorKeyringAccount(account);

          const handler = notificationHandlers[1]!;
          await handler(mockNotification, mockSubscription);

          expect(
            mockTransactionsService.saveTransaction,
          ).not.toHaveBeenCalled();
        });
      });
    });
  });
});
