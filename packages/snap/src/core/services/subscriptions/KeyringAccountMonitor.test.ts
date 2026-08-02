/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { TransactionType } from '@metamask/keyring-api';
import type { Transaction } from '@metamask/keyring-api';
import { TOKEN_PROGRAM_ADDRESS } from '@solana-program/token';
import type { Address } from '@solana/kit';
import { signature } from '@solana/kit';

import type {
  AccountNotification,
  AccountNotificationHandler,
  ConfirmedSubscription,
  ProgramNotification,
  ProgramNotificationHandler,
  Subscription,
} from '../../../entities';
import { KnownCaip19Id, Network } from '../../constants/solana';
import { MOCK_SOLANA_KEYRING_ACCOUNTS } from '../../test/mocks/solana-keyring-accounts';
import type { AccountsSynchronizer } from '../accounts';
import type { AccountsService } from '../accounts/AccountsService';
import type { ConfigProvider } from '../config';
import { mockLogger } from '../mocks/logger';
import type { TransactionsService } from '../transactions';
import { KeyringAccountMonitor } from './KeyringAccountMonitor';
import type { SubscriptionService } from './SubscriptionService';

describe('KeyringAccountMonitor', () => {
  let keyringAccountMonitor: KeyringAccountMonitor;
  let mockSubscriptionService: SubscriptionService;
  let mockAccountService: AccountsService;
  let mockTransactionsService: TransactionsService;
  let mockAccountsSynchronizer: AccountsSynchronizer;
  let mockConfigProvider: ConfigProvider;

  const account = MOCK_SOLANA_KEYRING_ACCOUNTS[0];

  let accountNotificationHandlers: AccountNotificationHandler[] = [];
  let programNotificationHandlers: ProgramNotificationHandler[] = [];

  const createAccountSubscribeSubscription = (
    address: string,
    network: Network,
  ): ConfirmedSubscription => ({
    id: 'some-subscription-id',
    status: 'confirmed',
    method: 'accountSubscribe',
    network,
    params: [address, { commitment: 'confirmed' as const }],
    rpcSubscriptionId: 1,
    requestId: 'some-request-id',
    createdAt: '2024-01-01T00:00:00.000Z',
    confirmedAt: '2024-01-02T00:00:00.000Z',
  });

  const createProgramSubscribeSubscription = (
    address: string,
    programAddress: Address,
    network: Network,
  ): ConfirmedSubscription => ({
    id: 'some-subscription-id',
    status: 'confirmed',
    method: 'programSubscribe',
    network,
    params: [
      programAddress,
      {
        commitment: 'confirmed' as const,
        encoding: 'jsonParsed',
        filters: [
          {
            memcmp: {
              offset: 32,
              bytes: address,
              encoding: 'base58',
            },
          },
        ],
      },
    ],
    rpcSubscriptionId: 1,
    requestId: 'some-request-id',
    createdAt: '2024-01-01T00:00:00.000Z',
    confirmedAt: '2024-01-02T00:00:00.000Z',
  });

  beforeEach(() => {
    jest.clearAllMocks();

    accountNotificationHandlers = [];
    programNotificationHandlers = [];

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
        .mockImplementation(async (method, _network, handler) => {
          if (method === 'accountSubscribe') {
            accountNotificationHandlers.push(handler);
          } else if (method === 'programSubscribe') {
            programNotificationHandlers.push(handler);
          }
        }),
      registerConnectionRecoveryHandler: jest.fn(),
    } as unknown as SubscriptionService;

    mockAccountService = {
      getAll: jest.fn(),
      findByAddress: jest.fn(),
    } as unknown as AccountsService;

    mockTransactionsService = {
      fetchLatestSignatures: jest.fn(),
      fetchBySignature: jest.fn(),
      save: jest.fn(),
    } as unknown as TransactionsService;

    mockAccountsSynchronizer = {
      synchronize: jest.fn(),
    } as unknown as AccountsSynchronizer;

    mockConfigProvider = {
      getActiveNetworks: jest
        .fn()
        .mockResolvedValue([Network.Mainnet, Network.Devnet]),
    } as unknown as ConfigProvider;

    keyringAccountMonitor = new KeyringAccountMonitor(
      mockSubscriptionService,
      mockAccountService,
      mockTransactionsService,
      mockAccountsSynchronizer,
      mockConfigProvider,
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

  describe('setMonitoredAccounts', () => {
    const account0 = MOCK_SOLANA_KEYRING_ACCOUNTS[0];
    const account1 = MOCK_SOLANA_KEYRING_ACCOUNTS[1];
    const account2 = MOCK_SOLANA_KEYRING_ACCOUNTS[2];
    const accounts = [account0, account1, account2];

    beforeEach(() => {
      // Setup 1 active network for simplicity
      jest
        .spyOn(mockConfigProvider, 'getActiveNetworks')
        .mockResolvedValue([Network.Mainnet]);

      jest.spyOn(mockAccountService, 'getAll').mockResolvedValue(accounts);
    });

    it('starts monitoring the passed accounts that are not currently monitored', async () => {
      // No account currently monitored
      jest.spyOn(mockSubscriptionService, 'getAll').mockResolvedValue([]);

      await keyringAccountMonitor.setMonitoredAccounts([
        account0.id,
        account1.id,
      ]);

      // It should start monitoring account2 and account3 because they are in the requested list and were not currently monitored
      expect(mockSubscriptionService.subscribe).toHaveBeenCalledTimes(6);
    });

    it('does not start monitoring the passed accounts that are currently monitored', async () => {
      // account0 is currently monitored = we have a subscription for it
      const mockSubscriptionAccount0 = createAccountSubscribeSubscription(
        account0.address,
        Network.Mainnet,
      );
      jest
        .spyOn(mockSubscriptionService, 'getAll')
        .mockResolvedValue([mockSubscriptionAccount0]);

      await keyringAccountMonitor.setMonitoredAccounts([account0.id]);

      // It should not start monitoring account0 because it is already monitored
      expect(mockSubscriptionService.subscribe).not.toHaveBeenCalled();
    });

    it('stops monitoring the accounts that are currently monitored, that are not in the passed list', async () => {
      // account0 is currently monitored = we have a subscription for it
      const mockSubscriptionAccount0 = createAccountSubscribeSubscription(
        account0.address,
        Network.Mainnet,
      );
      jest
        .spyOn(mockSubscriptionService, 'getAll')
        .mockResolvedValue([mockSubscriptionAccount0]);

      await keyringAccountMonitor.setMonitoredAccounts([]);

      // It should stop monitoring account0 because it was previously monitored, but is not the requested list
      expect(mockSubscriptionService.unsubscribe).toHaveBeenCalledTimes(1);
    });

    it('does not stop monitoring accounts that are not currently monitored', async () => {
      // No account currently monitored
      jest.spyOn(mockSubscriptionService, 'getAll').mockResolvedValue([]);

      await keyringAccountMonitor.setMonitoredAccounts([account1.id]);

      // It should not stop monitoring any account
      expect(mockSubscriptionService.unsubscribe).not.toHaveBeenCalled();
    });

    it('does not stop monitoring accounts that are currently monitored and in the requested list', async () => {
      // account0 is currently monitored
      const mockSubscriptionAccount0 = createAccountSubscribeSubscription(
        account0.address,
        Network.Mainnet,
      );
      jest
        .spyOn(mockSubscriptionService, 'getAll')
        .mockResolvedValue([mockSubscriptionAccount0]);

      await keyringAccountMonitor.setMonitoredAccounts([account0.id]);

      // It should not stop monitoring account0 because it's in both current and requested lists
      expect(mockSubscriptionService.unsubscribe).not.toHaveBeenCalled();
      expect(mockSubscriptionService.subscribe).not.toHaveBeenCalled();
    });

    it('mixed case', async () => {
      // account0 and account1 are currently monitored = we have subscriptions for them
      const mockSubscriptionAccount0 = createAccountSubscribeSubscription(
        account0.address,
        Network.Mainnet,
      );
      const mockSubscriptionAccount1 = createProgramSubscribeSubscription(
        account1.address,
        TOKEN_PROGRAM_ADDRESS,
        Network.Mainnet,
      );
      jest
        .spyOn(mockSubscriptionService, 'getAll')
        .mockResolvedValue([
          mockSubscriptionAccount0,
          mockSubscriptionAccount1,
        ]);

      await keyringAccountMonitor.setMonitoredAccounts([
        account1.id,
        account2.id,
      ]);

      // It should stop monitoring account0 because it was previously monitored, but is not the requested list
      expect(mockSubscriptionService.unsubscribe).toHaveBeenCalledTimes(1);

      // It should start monitoring account2 because it is in the requested list and is not currently monitored
      expect(mockSubscriptionService.subscribe).toHaveBeenCalledTimes(3);
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
      jest
        .spyOn(mockConfigProvider, 'getActiveNetworks')
        .mockResolvedValue([Network.Mainnet]);

      jest.spyOn(mockAccountService, 'getAll').mockResolvedValue([account]);

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
      const mockNotification: AccountNotification = {
        jsonrpc: '2.0',
        method: 'accountNotification',
        params: {
          subscription: 1,
          result: {
            context: {
              slot: 1,
            },
            value: {
              data: {},
              executable: false,
              lamports: 1000000000, // 1 SOL
              owner: '11111111111111111111111111111111',
              rentEpoch: null,
            },
          },
        },
      };

      const mockSubscription = {
        method: 'accountSubscribe',
        network: Network.Mainnet,
        params: [account.address, { commitment: 'confirmed' as const }],
      } as unknown as Subscription;

      it('persists the causing transaction without saving asset balance', async () => {
        await keyringAccountMonitor.setMonitoredAccounts([account.id]);

        // Send the notification by manually calling the handler
        const handler = accountNotificationHandlers[0]!;
        await handler(mockNotification, mockSubscription);

        expect(mockTransactionsService.save).toHaveBeenCalledWith(
          mockCausingTransaction,
        );
      });

      it('fetches and saves the transaction that caused the native asset balance to change', async () => {
        await keyringAccountMonitor.setMonitoredAccounts([account.id]);

        // Send the notification by manually calling the handler
        const handler = accountNotificationHandlers[0]!;
        await handler(mockNotification, mockSubscription);

        expect(mockTransactionsService.save).toHaveBeenCalledWith(
          mockCausingTransaction,
        );
      });

      it('skips spam transactions', async () => {
        const mockSpamTransaction = {
          ...mockCausingTransaction,
          type: TransactionType.Receive,
          to: [
            {
              address: account.address,
              asset: {
                fungible: true,
                type: KnownCaip19Id.SolMainnet,
                amount: '0.00000001', // Very small amount so that it's caught by the spam detector
              },
            },
          ],
        } as unknown as Transaction;

        jest
          .spyOn(mockTransactionsService, 'fetchBySignature')
          .mockResolvedValue(mockSpamTransaction);

        await keyringAccountMonitor.setMonitoredAccounts([account.id]);

        // Send the notification by manually calling the handler
        const handler = accountNotificationHandlers[0]!;
        await handler(mockNotification, mockSubscription);

        expect(mockTransactionsService.save).not.toHaveBeenCalled();
      });
    });

    describe('when a token asset changed', () => {
      const mockNotification: ProgramNotification = {
        jsonrpc: '2.0',
        method: 'programNotification',
        params: {
          subscription: 1,
          result: {
            context: {
              slot: 1,
            },
            value: {
              account: {
                data: {
                  parsed: {
                    type: 'account',
                    info: {
                      isNative: false,
                      mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
                      owner: account.address,
                      state: 'initialized',
                      tokenAmount: {
                        amount: '123456789',
                        decimals: 6,
                        uiAmount: 123.456789,
                        uiAmountString: '123.456789',
                      },
                    },
                  },
                  program: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                  space: 165,
                },
                executable: true,
                lamports: 1000000000,
                owner: account.address,
                rentEpoch: 1,
              },
              pubkey: '9wt9PfjPD3JCy5r7o4K1cTGiuTG7fq2pQhdDCdQALKjg',
            },
          },
        },
      };

      const mockSubscription = {
        method: 'programSubscribe',
        network: Network.Mainnet,
        params: [TOKEN_PROGRAM_ADDRESS, { commitment: 'confirmed' as const }],
      } as unknown as Subscription;

      it('persists the causing transaction without saving token balance', async () => {
        await keyringAccountMonitor.setMonitoredAccounts([account.id]);

        const handler = programNotificationHandlers[0]!;
        await handler(mockNotification, mockSubscription);

        expect(mockTransactionsService.save).toHaveBeenCalledWith(
          mockCausingTransaction,
        );
      });

      it('fetches and saves the transaction that caused the token asset to change', async () => {
        await keyringAccountMonitor.setMonitoredAccounts([account.id]);

        const handler = programNotificationHandlers[0]!;
        await handler(mockNotification, mockSubscription);

        expect(mockTransactionsService.save).toHaveBeenCalledWith(
          mockCausingTransaction,
        );
      });

      it('throws an error when owner address is missing', async () => {
        const mockNotificationWithMissingOwner: ProgramNotification = {
          jsonrpc: '2.0',
          method: 'programNotification',
          params: {
            subscription: 1,
            result: {
              context: {
                slot: 1,
              },
              value: {
                pubkey: '9wt9PfjPD3JCy5r7o4K1cTGiuTG7fq2pQhdDCdQALKjg',
                account: {
                  data: {
                    parsed: {
                      info: {
                        isNative: false,
                        mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
                        owner: undefined as unknown as string, // Owner is missing
                        state: 'initialized',
                        tokenAmount: {
                          amount: '20011079',
                          decimals: 6,
                          uiAmount: 20.011079,
                          uiAmountString: '20.011079',
                        },
                      },
                      type: 'account',
                    },
                    program: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                    space: 165,
                  },
                  executable: true,
                  lamports: 1000000000,
                  owner: account.address,
                  rentEpoch: 1,
                },
              },
            },
          },
        };

        await keyringAccountMonitor.setMonitoredAccounts([account.id]);
        const handler = programNotificationHandlers[0]!;

        await expect(
          handler(mockNotificationWithMissingOwner, mockSubscription),
        ).rejects.toThrow('Expected a string, but received: undefined');
        expect(mockTransactionsService.save).not.toHaveBeenCalled();
      });

      describe('when #saveCausingTransaction encounters errors', () => {
        it('throws an error when no signatures are found', async () => {
          // No signatures found for the token account
          jest
            .spyOn(mockTransactionsService, 'fetchLatestSignatures')
            .mockResolvedValue([]);

          await keyringAccountMonitor.setMonitoredAccounts([account.id]);
          const handler = programNotificationHandlers[0]!;

          await expect(
            handler(mockNotification, mockSubscription),
          ).rejects.toThrow('No signature found');
          expect(mockTransactionsService.save).not.toHaveBeenCalled();
        });

        it('throws an error when transaction is not found', async () => {
          // No transaction found for the token account
          jest
            .spyOn(mockTransactionsService, 'fetchBySignature')
            .mockResolvedValue(null);

          await keyringAccountMonitor.setMonitoredAccounts([account.id]);
          const handler = programNotificationHandlers[0]!;

          await expect(
            handler(mockNotification, mockSubscription),
          ).rejects.toThrow('No transaction found');
          expect(mockTransactionsService.save).not.toHaveBeenCalled();
        });
      });
    });
  });

  describe('connection recovery', () => {
    const account0 = MOCK_SOLANA_KEYRING_ACCOUNTS[0];
    const account1 = MOCK_SOLANA_KEYRING_ACCOUNTS[1];
    const accounts = [account0, account1];

    beforeEach(() => {
      jest
        .spyOn(mockConfigProvider, 'getActiveNetworks')
        .mockResolvedValue([Network.Mainnet]);

      // Setup 2 accounts
      jest.spyOn(mockAccountService, 'getAll').mockResolvedValue(accounts);

      // These accounts are currently monitored
      jest
        .spyOn(mockSubscriptionService, 'getAll')
        .mockResolvedValue([
          createAccountSubscribeSubscription(account0.address, Network.Mainnet),
          createAccountSubscribeSubscription(account1.address, Network.Mainnet),
        ]);
    });

    it('syncs all monitored accounts', async () => {
      const syncSpy = jest.spyOn(mockAccountsSynchronizer, 'synchronize');

      // Simulate connection recovery
      const recoveryHandler = (
        mockSubscriptionService.registerConnectionRecoveryHandler as jest.Mock
      ).mock.calls[0][1];
      await recoveryHandler(Network.Mainnet);

      expect(syncSpy).toHaveBeenCalledTimes(1);
      expect(syncSpy).toHaveBeenCalledWith(accounts);
    });
  });
});
