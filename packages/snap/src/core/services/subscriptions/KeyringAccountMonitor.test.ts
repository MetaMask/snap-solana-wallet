/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { TransactionType, type Transaction } from '@metamask/keyring-api';
import { TOKEN_PROGRAM_ADDRESS } from '@solana-program/token';
import { TOKEN_2022_PROGRAM_ADDRESS } from '@solana-program/token-2022';
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
import type { AssetsService, TokenHelper } from '../assets';
import type { ConfigProvider } from '../config';
import { mockLogger } from '../mocks/logger';
import type { TransactionsService } from '../transactions';
import { KeyringAccountMonitor } from './KeyringAccountMonitor';
import type { SubscriptionService } from './SubscriptionService';

describe('KeyringAccountMonitor', () => {
  let keyringAccountMonitor: KeyringAccountMonitor;
  let mockSubscriptionService: SubscriptionService;
  let mockAccountService: AccountsService;
  let mockAssetsService: AssetsService;
  let mockTransactionsService: TransactionsService;
  let mockAccountsSynchronizer: AccountsSynchronizer;
  let mockTokenHelper: TokenHelper;
  let mockConfigProvider: ConfigProvider;

  const account = MOCK_SOLANA_KEYRING_ACCOUNTS[0];

  let accountNotificationHandlers: AccountNotificationHandler[] = [];
  let programNotificationHandlers: ProgramNotificationHandler[] = [];

  const createAccountSubscribeSubscription = (
    network: Network = Network.Mainnet,
  ): ConfirmedSubscription => ({
    id: 'some-subscription-id',
    status: 'confirmed',
    method: 'accountSubscribe',
    network,
    params: [account.address, { commitment: 'confirmed' as const }],
    rpcSubscriptionId: 1,
    requestId: 'some-request-id',
    createdAt: '2024-01-01T00:00:00.000Z',
    confirmedAt: '2024-01-02T00:00:00.000Z',
    rpcUnsubscriptionId: null,
    unsubscribedAt: null,
  });

  const createProgramSubscribeSubscription = (
    programAddress: Address,
    network: Network = Network.Mainnet,
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
              bytes: account.address,
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
    rpcUnsubscriptionId: null,
    unsubscribedAt: null,
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

    mockAssetsService = {
      getTokenAccountsByOwnerMultiple: jest.fn(),
      save: jest.fn(),
      getAssetsMetadata: jest.fn().mockImplementation((assetType) => ({
        [assetType]: {
          symbol: 'USDC',
          decimals: 6,
        },
      })),
    } as unknown as AssetsService;

    mockTransactionsService = {
      fetchLatestSignatures: jest.fn(),
      fetchBySignature: jest.fn(),
      save: jest.fn(),
    } as unknown as TransactionsService;

    mockAccountsSynchronizer = {
      synchronize: jest.fn(),
    } as unknown as AccountsSynchronizer;

    mockTokenHelper = {
      uiAmountToAmountForMint: jest.fn(),
      amountToUiAmountForMint: jest.fn(),
    } as unknown as TokenHelper;

    mockConfigProvider = {
      getActiveNetworks: jest
        .fn()
        .mockResolvedValue([Network.Mainnet, Network.Devnet]),
    } as unknown as ConfigProvider;

    keyringAccountMonitor = new KeyringAccountMonitor(
      mockSubscriptionService,
      mockAccountService,
      mockAssetsService,
      mockTransactionsService,
      mockAccountsSynchronizer,
      mockTokenHelper,
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

  describe('monitorKeyringAccount', () => {
    beforeEach(() => {
      jest.spyOn(mockAccountService, 'getAll').mockResolvedValue([account]);
    });

    it('monitors the account native and token assets', async () => {
      // Setup 2 active networks
      jest
        .spyOn(mockConfigProvider, 'getActiveNetworks')
        .mockResolvedValue([Network.Mainnet, Network.Devnet]);

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

      jest
        .spyOn(mockConfigProvider, 'getActiveNetworks')
        .mockResolvedValue([Network.Mainnet, Network.Devnet]);

      await keyringAccountMonitor.monitorKeyringAccount(
        accountWithLimitedScopes,
      );

      // Should only monitor mainnet (1 native asset), not devnet
      expect(mockSubscriptionService.subscribe).toHaveBeenCalledTimes(3);
    });

    it("does not monitor an account on an active network that is not in the account's scopes", async () => {
      // Setup 1 active network
      jest
        .spyOn(mockConfigProvider, 'getActiveNetworks')
        .mockResolvedValue([Network.Mainnet]);

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
      jest
        .spyOn(mockConfigProvider, 'getActiveNetworks')
        .mockResolvedValue([Network.Mainnet]);

      // Try to monitor the account a first time
      await keyringAccountMonitor.monitorKeyringAccount(account);
      expect(mockSubscriptionService.subscribe).toHaveBeenCalledTimes(3);

      // As a consequence, we now have 3 subscriptions for the account
      jest
        .spyOn(mockSubscriptionService, 'getAll')
        .mockResolvedValue([
          createAccountSubscribeSubscription(),
          createProgramSubscribeSubscription(TOKEN_PROGRAM_ADDRESS),
          createProgramSubscribeSubscription(TOKEN_2022_PROGRAM_ADDRESS),
        ]);

      // Try to monitor the same account a second time
      await keyringAccountMonitor.monitorKeyringAccount(account);

      expect(mockSubscriptionService.subscribe).toHaveBeenCalledTimes(3);
    });
  });

  describe('stopMonitorKeyringAccount', () => {
    it('stops monitoring the account native and token assets on all active networks', async () => {
      // Setup 2 active networks
      jest
        .spyOn(mockConfigProvider, 'getActiveNetworks')
        .mockResolvedValue([Network.Mainnet, Network.Devnet]);

      await keyringAccountMonitor.monitorKeyringAccount(account);

      // As a consequence, we now have 6 subscriptions for the account (3 for each network)
      jest
        .spyOn(mockSubscriptionService, 'getAll')
        .mockResolvedValue([
          createAccountSubscribeSubscription(),
          createProgramSubscribeSubscription(TOKEN_PROGRAM_ADDRESS),
          createProgramSubscribeSubscription(TOKEN_2022_PROGRAM_ADDRESS),
          createAccountSubscribeSubscription(Network.Devnet),
          createProgramSubscribeSubscription(
            TOKEN_PROGRAM_ADDRESS,
            Network.Devnet,
          ),
          createProgramSubscribeSubscription(
            TOKEN_2022_PROGRAM_ADDRESS,
            Network.Devnet,
          ),
        ]);

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
      jest
        .spyOn(mockConfigProvider, 'getActiveNetworks')
        .mockResolvedValue([Network.Mainnet]);

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

      it('saves the new balance of the native asset', async () => {
        await keyringAccountMonitor.monitorKeyringAccount(account);

        // Send the notification by manually calling the handler
        const handler = accountNotificationHandlers[0]!;
        await handler(mockNotification, mockSubscription);

        expect(mockAssetsService.save).toHaveBeenCalledWith({
          assetType: KnownCaip19Id.SolMainnet,
          keyringAccountId: account.id,
          network: Network.Mainnet,
          address: account.address,
          symbol: 'SOL',
          decimals: 9,
          rawAmount: '1000000000',
          uiAmount: '1',
        });

        expect(mockTransactionsService.save).toHaveBeenCalledWith(
          mockCausingTransaction,
        );
      });

      it('fetches and saves the transaction that caused the native asset balance to change', async () => {
        await keyringAccountMonitor.monitorKeyringAccount(account);

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

        await keyringAccountMonitor.monitorKeyringAccount(account);

        // Send the notification by manually calling the handler
        const handler = accountNotificationHandlers[0]!;
        await handler(mockNotification, mockSubscription);

        expect(mockTransactionsService.save).not.toHaveBeenCalled();
      });

      it('throws an error when lamports is missing', async () => {
        const mockNotificationWithMissingLamports: AccountNotification = {
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
                lamports: undefined as unknown as number, // Lamports is missing
                owner: '11111111111111111111111111111111',
                rentEpoch: null,
              },
            },
          },
        };

        await keyringAccountMonitor.monitorKeyringAccount(account);

        const handler = accountNotificationHandlers[0]!;
        await expect(
          handler(mockNotificationWithMissingLamports, mockSubscription),
        ).rejects.toThrow('Expected a number, but received: undefined');
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

      beforeEach(() => {
        jest
          .spyOn(mockTokenHelper, 'amountToUiAmountForMint')
          .mockResolvedValue('123.456789');
      });

      it('saves the new balance of the token asset and the transaction that caused it', async () => {
        await keyringAccountMonitor.monitorKeyringAccount(account);

        const handler = programNotificationHandlers[0]!;
        await handler(mockNotification, mockSubscription);

        expect(mockAssetsService.save).toHaveBeenCalledWith({
          assetType: KnownCaip19Id.UsdcMainnet,
          keyringAccountId: account.id,
          network: Network.Mainnet,
          mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
          pubkey: '9wt9PfjPD3JCy5r7o4K1cTGiuTG7fq2pQhdDCdQALKjg',
          symbol: 'USDC',
          decimals: 6,
          rawAmount: '123456789',
          uiAmount: '123.456789',
        });
        expect(mockTransactionsService.save).toHaveBeenCalledWith(
          mockCausingTransaction,
        );
      });

      it('fetches and saves the transaction that caused the token asset to change', async () => {
        await keyringAccountMonitor.monitorKeyringAccount(account);

        const handler = programNotificationHandlers[0]!;
        await handler(mockNotification, mockSubscription);

        expect(mockTransactionsService.save).toHaveBeenCalledWith(
          mockCausingTransaction,
        );
      });

      it('throws an error when mint address is missing', async () => {
        const mockNotificationWithMissingMint: ProgramNotification = {
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
                        mint: undefined as unknown as string, // Mint is missing
                        owner: account.address,
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

        await keyringAccountMonitor.monitorKeyringAccount(account);
        const handler = programNotificationHandlers[0]!;

        await expect(
          handler(mockNotificationWithMissingMint, mockSubscription),
        ).rejects.toThrow('Expected a string, but received: undefined');
        expect(mockAssetsService.save).not.toHaveBeenCalled();
      });

      it('throws an error when uiAmountString is missing', async () => {
        const mockNotificationWithMissingUiAmountString: ProgramNotification = {
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
                        owner: account.address,
                        state: 'initialized',
                        tokenAmount: {
                          amount: '20011079',
                          decimals: 6,
                          uiAmount: 20.011079,
                          uiAmountString: undefined as unknown as string, // uiAmountString is missing
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

        await keyringAccountMonitor.monitorKeyringAccount(account);
        const handler = programNotificationHandlers[0]!;

        await expect(
          handler(mockNotificationWithMissingUiAmountString, mockSubscription),
        ).rejects.toThrow('Expected a string, but received: undefined');
        expect(mockAssetsService.save).not.toHaveBeenCalled();
      });

      describe('when #saveCausingTransaction encounters errors', () => {
        it('throws an error when no signatures are found', async () => {
          // No signatures found for the token account
          jest
            .spyOn(mockTransactionsService, 'fetchLatestSignatures')
            .mockResolvedValue([]);

          await keyringAccountMonitor.monitorKeyringAccount(account);
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

          await keyringAccountMonitor.monitorKeyringAccount(account);
          const handler = programNotificationHandlers[0]!;

          await expect(
            handler(mockNotification, mockSubscription),
          ).rejects.toThrow('No transaction found');
          expect(mockTransactionsService.save).not.toHaveBeenCalled();
        });
      });
    });
  });
});
