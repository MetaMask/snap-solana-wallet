import type { ICache } from './core/caching/ICache';
import { InMemoryCache } from './core/caching/InMemoryCache';
import { StateCache } from './core/caching/StateCache';
import { NftApiClient } from './core/clients/nft-api/NftApiClient';
import { PriceApiClient } from './core/clients/price-api/PriceApiClient';
import { SecurityAlertsApiClient } from './core/clients/security-alerts-api/SecurityAlertsApiClient';
import { TokenApiClient } from './core/clients/token-api-client/TokenApiClient';
import { ClientRequestHandler } from './core/handlers';
import { SolanaKeyring } from './core/handlers/onKeyringRequest/Keyring';
import type { Serializable } from './core/serialization/types';
import {
  AccountsRepository,
  AccountsService,
  AccountsSynchronizer,
  ApproveTokenService,
  AssetsRepository,
  AssetsService,
  KeyringAccountMonitor,
  MonitoredAccountsInitializer,
  RecipientClassifier,
  SendService,
  SendSolBuilder,
  SendSplTokenBuilder,
  SignatureMonitor,
  Signer,
  SubscriptionRepository,
  SubscriptionService,
  TokenHelper,
  TransactionMapper,
  TransactionsRepository,
  TransactionsService,
  WebSocketConnectionRepository,
  WebSocketConnectionService,
} from './core/services';
import { AnalyticsService } from './core/services/analytics/AnalyticsService';
import { ConfigProvider } from './core/services/config';
import { ConfirmationHandler } from './core/services/confirmation/ConfirmationHandler';
import { SolanaConnection } from './core/services/connection/SolanaConnection';
import { NameResolutionService } from './core/services/name-resolution/NameResolutionService';
import { NftService } from './core/services/nft/NftService';
import type { IStateManager } from './core/services/state/IStateManager';
import type { UnencryptedStateValue } from './core/services/state/State';
import { DEFAULT_UNENCRYPTED_STATE, State } from './core/services/state/State';
import { TokenPricesService } from './core/services/token-prices/TokenPrices';
import { TransactionScanService } from './core/services/transaction-scan/TransactionScan';
import { WalletService } from './core/services/wallet/WalletService';
import logger, { noOpLogger } from './core/utils/logger';
import { EventEmitter } from './infrastructure';

/**
 * Initializes all the services using dependency injection.
 */

export type SnapExecutionContext = {
  configProvider: ConfigProvider;
  connection: SolanaConnection;
  keyring: SolanaKeyring;
  priceApiClient: PriceApiClient;
  state: IStateManager<UnencryptedStateValue>;
  assetsService: AssetsService;
  tokenPricesService: TokenPricesService;
  signer: Signer;
  transactionsService: TransactionsService;
  sendSolBuilder: SendSolBuilder;
  sendSplTokenBuilder: SendSplTokenBuilder;
  walletService: WalletService;
  transactionScanService: TransactionScanService;
  analyticsService: AnalyticsService;
  confirmationHandler: ConfirmationHandler;
  cache: ICache<Serializable>;
  nftService: NftService;
  clientRequestHandler: ClientRequestHandler;
  webSocketConnectionService: WebSocketConnectionService;
  subscriptionService: SubscriptionService;
  eventEmitter: EventEmitter;
  nameResolutionService: NameResolutionService;
  accountsService: AccountsService;
  accountsSynchronizer: AccountsSynchronizer;
  tokenHelper: TokenHelper;
};

const configProvider = new ConfigProvider();

const eventEmitter = new EventEmitter(logger);

const state = new State(eventEmitter, {
  encrypted: false,
  defaultState: DEFAULT_UNENCRYPTED_STATE,
});

const stateCache = new StateCache(state, logger);
const inMemoryCache = new InMemoryCache(noOpLogger);

const analyticsService = new AnalyticsService(logger);

const connection = new SolanaConnection(configProvider, inMemoryCache);

const webSocketConnectionRepository = new WebSocketConnectionRepository(
  configProvider,
);

const webSocketConnectionService = new WebSocketConnectionService(
  webSocketConnectionRepository,
  analyticsService,
  configProvider,
  state,
  eventEmitter,
  logger,
);

const subscriptionRepository = new SubscriptionRepository(state);

const subscriptionService = new SubscriptionService(
  webSocketConnectionService,
  subscriptionRepository,
  eventEmitter,
  logger,
);

const tokenHelper = new TokenHelper(connection);

const signer = new Signer(connection, logger);

const sendSolBuilder = new SendSolBuilder(connection, logger);

const recipientClassifier = new RecipientClassifier(connection, logger);

const sendSplTokenBuilder = new SendSplTokenBuilder(
  tokenHelper,
  recipientClassifier,
  connection,
  logger,
);

const priceApiClient = new PriceApiClient(configProvider, inMemoryCache);
const tokenApiClient = new TokenApiClient(configProvider);
const nftApiClient = new NftApiClient(configProvider, inMemoryCache);

const tokenPricesService = new TokenPricesService({
  configProvider,
  priceApiClient,
  logger,
});
const nameResolutionService = new NameResolutionService(connection, logger);

const assetsRepository = new AssetsRepository(state);
const assetsService = new AssetsService({
  connection,
  logger,
  configProvider,
  assetsRepository,
  tokenApiClient,
  cache: inMemoryCache,
  tokenPricesService,
  nftApiClient,
});

const accountsRepository = new AccountsRepository(state);
const accountsService = new AccountsService(accountsRepository);

const transactionsRepository = new TransactionsRepository(state);
const transactionMapper = new TransactionMapper(
  tokenHelper,
  assetsService,
  logger,
);
const transactionsService = new TransactionsService(
  transactionsRepository,
  transactionMapper,
  accountsService,
  assetsService,
  connection,
  logger,
);

const accountsSynchronizer = new AccountsSynchronizer(
  accountsService,
  assetsService,
  transactionsService,
  logger,
);

const transactionScanService = new TransactionScanService(
  new SecurityAlertsApiClient(configProvider),
  analyticsService,
  logger,
);

const confirmationHandler = new ConfirmationHandler();

const signatureMonitor = new SignatureMonitor(
  subscriptionService,
  accountsService,
  transactionsService,
  analyticsService,
  connection,
  configProvider,
  logger,
);

const keyringAccountMonitor = new KeyringAccountMonitor(
  subscriptionService,
  accountsService,
  assetsService,
  transactionsService,
  accountsSynchronizer,
  tokenHelper,
  configProvider,
  logger,
);

const monitoredAccountsInitializer = new MonitoredAccountsInitializer(
  accountsService,
  keyringAccountMonitor,
  eventEmitter,
  logger,
);

const walletService = new WalletService(
  connection,
  signer,
  signatureMonitor,
  analyticsService,
  logger,
);

const keyring = new SolanaKeyring({
  state,
  transactionsService,
  logger,
  assetsService,
  walletService,
  confirmationHandler,
  keyringAccountMonitor,
});

const nftService = new NftService(connection, logger);

const sendService = new SendService(
  connection,
  keyring,
  logger,
  inMemoryCache,
  recipientClassifier,
  sendSolBuilder,
  sendSplTokenBuilder,
  assetsService,
);

const approveTokenService = new ApproveTokenService(
  connection,
  tokenHelper,
  logger,
);

const clientRequestHandler = new ClientRequestHandler(
  accountsService,
  walletService,
  logger,
  sendService,
  approveTokenService,
);

const snapContext: SnapExecutionContext = {
  configProvider,
  connection,
  keyring,
  priceApiClient,
  state,
  cache: stateCache,
  /* Services */
  assetsService,
  tokenPricesService,
  signer,
  transactionsService,
  sendSolBuilder,
  sendSplTokenBuilder,
  walletService,
  transactionScanService,
  analyticsService,
  confirmationHandler,
  nftService,
  clientRequestHandler,
  webSocketConnectionService,
  subscriptionService,
  eventEmitter,
  nameResolutionService,
  accountsService,
  accountsSynchronizer,
  tokenHelper,
};

export {
  accountsService,
  accountsSynchronizer,
  analyticsService,
  assetsService,
  clientRequestHandler,
  configProvider,
  confirmationHandler,
  connection,
  eventEmitter,
  keyring,
  nameResolutionService,
  nftService,
  priceApiClient,
  sendSolBuilder,
  sendSplTokenBuilder,
  signer,
  state,
  subscriptionRepository,
  subscriptionService,
  tokenApiClient,
  tokenHelper,
  tokenPricesService,
  transactionScanService,
  transactionsService,
  walletService,
  webSocketConnectionService,
};

export default snapContext;
