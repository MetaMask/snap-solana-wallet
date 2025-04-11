import type { ICache } from './core/caching/ICache';
import { StateCache } from './core/caching/StateCache';
import { PriceApiClient } from './core/clients/price-api/PriceApiClient';
import { SecurityAlertsApiClient } from './core/clients/security-alerts-api/SecurityAlertsApiClient';
import { TokenMetadataClient } from './core/clients/token-metadata-client/TokenMetadataClient';
import { SolanaKeyring } from './core/handlers/onKeyringRequest/Keyring';
import type { Serializable } from './core/serialization/types';
import { AnalyticsService } from './core/services/analytics/AnalyticsService';
import { AssetsService } from './core/services/assets/AssetsService';
import { ConfigProvider } from './core/services/config';
import { ConfirmationHandler } from './core/services/confirmation/ConfirmationHandler';
import { SolanaConnection } from './core/services/connection/SolanaConnection';
import { SendSolBuilder } from './core/services/execution/builders/SendSolBuilder';
import { SendSplTokenBuilder } from './core/services/execution/builders/SendSplTokenBuilder';
import { TransactionHelper } from './core/services/execution/TransactionHelper';
import type { IStateManager } from './core/services/state/IStateManager';
import type {
  EncryptedStateValue,
  UnencryptedStateValue,
} from './core/services/state/State';
import {
  DEFAULT_ENCRYPTED_STATE,
  DEFAULT_UNENCRYPTED_STATE,
  State,
} from './core/services/state/State';
import { TokenMetadataService } from './core/services/token-metadata/TokenMetadata';
import { TokenPricesService } from './core/services/token-prices/TokenPrices';
import { TransactionScanService } from './core/services/transaction-scan/TransactionScan';
import { TransactionsService } from './core/services/transactions/TransactionsService';
import { WalletService } from './core/services/wallet/WalletService';
import logger from './core/utils/logger';

/**
 * Initializes all the services using dependency injection.
 */

export type SnapExecutionContext = {
  configProvider: ConfigProvider;
  connection: SolanaConnection;
  keyring: SolanaKeyring;
  priceApiClient: PriceApiClient;
  encryptedState: IStateManager<EncryptedStateValue>;
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
};

const configProvider = new ConfigProvider();
const encryptedState = new State({
  encrypted: true,
  defaultState: DEFAULT_ENCRYPTED_STATE,
});
const state = new State({
  encrypted: false,
  defaultState: DEFAULT_UNENCRYPTED_STATE,
});

const cache = new StateCache(state);

const connection = new SolanaConnection(configProvider);
const transactionHelper = new TransactionHelper(connection, logger);
const sendSolBuilder = new SendSolBuilder(transactionHelper, logger);
const sendSplTokenBuilder = new SendSplTokenBuilder(
  connection,
  transactionHelper,
  logger,
);
const tokenMetadataClient = new TokenMetadataClient(configProvider);
const priceApiClient = new PriceApiClient(configProvider, cache);

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
  logger,
);

const confirmationHandler = new ConfirmationHandler();

const keyring = new SolanaKeyring({
  encryptedState,
  state,
  transactionsService,
  logger,
  assetsService,
  walletService,
  confirmationHandler,
});

const tokenPricesService = new TokenPricesService(priceApiClient);

const snapContext: SnapExecutionContext = {
  configProvider,
  connection,
  keyring,
  priceApiClient,
  encryptedState,
  state,
  cache,
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
};

export {
  analyticsService,
  assetsService,
  configProvider,
  confirmationHandler,
  connection,
  encryptedState,
  keyring,
  priceApiClient,
  sendSolBuilder,
  sendSplTokenBuilder,
  state,
  tokenMetadataClient,
  tokenMetadataService,
  tokenPricesService,
  transactionHelper,
  transactionScanService,
  transactionsService,
  walletService,
};

export default snapContext;
