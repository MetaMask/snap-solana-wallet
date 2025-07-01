import type { ICache } from './core/caching/ICache';
import { InMemoryCache } from './core/caching/InMemoryCache';
import { StateCache } from './core/caching/StateCache';
import { PriceApiClient } from './core/clients/price-api/PriceApiClient';
import { SecurityAlertsApiClient } from './core/clients/security-alerts-api/SecurityAlertsApiClient';
import { TokenMetadataClient } from './core/clients/token-metadata-client/TokenMetadataClient';
import { ClientRequestHandler } from './core/handlers';
import { SolanaKeyring } from './core/handlers/onKeyringRequest/Keyring';
import type { Serializable } from './core/serialization/types';
import {
  SubscriptionRepository,
  SubscriptionService,
  WebSocketConnectionRepository,
  WebSocketConnectionService,
} from './core/services';
import { AnalyticsService } from './core/services/analytics/AnalyticsService';
import { AssetsService } from './core/services/assets/AssetsService';
import { ConfigProvider } from './core/services/config';
import { ConfirmationHandler } from './core/services/confirmation/ConfirmationHandler';
import { SolanaConnection } from './core/services/connection/SolanaConnection';
import { TransactionHelper } from './core/services/execution/TransactionHelper';
import { NftService } from './core/services/nft/NftService';
import type { IStateManager } from './core/services/state/IStateManager';
import type { UnencryptedStateValue } from './core/services/state/State';
import { DEFAULT_UNENCRYPTED_STATE, State } from './core/services/state/State';
import { TokenMetadataService } from './core/services/token-metadata/TokenMetadata';
import { TokenPricesService } from './core/services/token-prices/TokenPrices';
import { TransactionScanService } from './core/services/transaction-scan/TransactionScan';
import { TransactionsService } from './core/services/transactions/TransactionsService';
import { WalletService } from './core/services/wallet/WalletService';
import logger from './core/utils/logger';
import { SendSolBuilder } from './features/send/transactions/SendSolBuilder';
import { SendSplTokenBuilder } from './features/send/transactions/SendSplTokenBuilder';
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
  transactionHelper: TransactionHelper;
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
};

const configProvider = new ConfigProvider();

const eventEmitter = new EventEmitter(logger);

const state = new State({
  encrypted: false,
  defaultState: DEFAULT_UNENCRYPTED_STATE,
});

const stateCache = new StateCache(state, logger);
const inMemoryCache = new InMemoryCache(logger);

const connection = new SolanaConnection(configProvider);
const transactionHelper = new TransactionHelper(connection, logger);
const sendSolBuilder = new SendSolBuilder(connection, logger);
const sendSplTokenBuilder = new SendSplTokenBuilder(
  connection,
  transactionHelper,
  logger,
);
const tokenMetadataClient = new TokenMetadataClient(configProvider);
const priceApiClient = new PriceApiClient(configProvider, inMemoryCache);

const tokenMetadataService = new TokenMetadataService({
  tokenMetadataClient,
  logger,
});

const assetsService = new AssetsService({
  connection,
  logger,
  configProvider,
  state,
  tokenMetadataService,
  cache: inMemoryCache,
});

const transactionsService = new TransactionsService({
  logger,
  connection,
  tokenMetadataService,
  state,
  configProvider,
});

const analyticsService = new AnalyticsService(logger);

const walletService = new WalletService(connection, transactionHelper, logger);

const transactionScanService = new TransactionScanService(
  new SecurityAlertsApiClient(configProvider),
  tokenMetadataService,
  analyticsService,
  logger,
);

const confirmationHandler = new ConfirmationHandler();

const webSocketConnectionRepository = new WebSocketConnectionRepository();

const webSocketConnectionService = new WebSocketConnectionService(
  webSocketConnectionRepository,
  configProvider,
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

const keyring = new SolanaKeyring({
  state,
  transactionsService,
  logger,
  assetsService,
  walletService,
  confirmationHandler,
});

const tokenPricesService = new TokenPricesService(priceApiClient);

const nftService = new NftService(connection, logger);

const clientRequestHandler = new ClientRequestHandler(
  keyring,
  walletService,
  logger,
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
  transactionHelper,
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
};

export {
  analyticsService,
  assetsService,
  clientRequestHandler,
  configProvider,
  confirmationHandler,
  connection,
  eventEmitter,
  keyring,
  nftService,
  priceApiClient,
  sendSolBuilder,
  sendSplTokenBuilder,
  state,
  subscriptionRepository,
  subscriptionService,
  tokenMetadataClient,
  tokenMetadataService,
  tokenPricesService,
  transactionHelper,
  transactionScanService,
  transactionsService,
  walletService,
  webSocketConnectionService,
};

export default snapContext;
