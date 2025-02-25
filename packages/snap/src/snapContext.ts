import { PriceApiClient } from './core/clients/price-api/PriceApiClient';
import { SecurityAlertsApiClient } from './core/clients/security-alerts-api/SecurityAlertsApiClient';
import { SegmentApiClient } from './core/clients/segment-api/SegmentApiClient';
import { TokenMetadataClient } from './core/clients/token-metadata-client/TokenMetadataClient';
import { SolanaKeyring } from './core/handlers/onKeyringRequest/Keyring';
import { AssetsService } from './core/services/assets/AssetsService';
import { ConfigProvider } from './core/services/config';
import { SolanaConnection } from './core/services/connection/SolanaConnection';
import { EncryptedState } from './core/services/encrypted-state/EncryptedState';
import { FromBase64EncodedBuilder } from './core/services/execution/builders/FromBase64EncodedBuilder';
import { SendSolBuilder } from './core/services/execution/builders/SendSolBuilder';
import { SendSplTokenBuilder } from './core/services/execution/builders/SendSplTokenBuilder';
import { TransactionHelper } from './core/services/execution/TransactionHelper';
import { TokenMetadataService } from './core/services/token-metadata/TokenMetadata';
import { TokenPricesService } from './core/services/token-prices/TokenPrices';
import { TransactionScanService } from './core/services/transaction-scan/TransactionScan';
import { TransactionsService } from './core/services/transactions/Transactions';
import { WalletService } from './core/services/wallet/WalletService';
import logger from './core/utils/logger';

/**
 * Initializes all the services using dependency injection.
 */

export type SnapExecutionContext = {
  configProvider: ConfigProvider;
  connection: SolanaConnection;
  keyring: SolanaKeyring;
  state: EncryptedState;
  /* Clients */
  priceApiClient: PriceApiClient;
  segmentApiClient: SegmentApiClient;
  /* Services */
  assetsService: AssetsService;
  tokenPricesService: TokenPricesService;
  transactionHelper: TransactionHelper;
  transactionsService: TransactionsService;
  sendSolBuilder: SendSolBuilder;
  sendSplTokenBuilder: SendSplTokenBuilder;
  fromBase64EncodedBuilder: FromBase64EncodedBuilder;
  walletService: WalletService;
  transactionScanService: TransactionScanService;
};

const configProvider = new ConfigProvider();
const state = new EncryptedState();
const connection = new SolanaConnection(configProvider);
const transactionHelper = new TransactionHelper(connection, logger);
const sendSolBuilder = new SendSolBuilder(transactionHelper, logger);
const sendSplTokenBuilder = new SendSplTokenBuilder(
  connection,
  transactionHelper,
  logger,
);
const fromBase64EncodedBuilder = new FromBase64EncodedBuilder(
  transactionHelper,
);
const tokenMetadataClient = new TokenMetadataClient(configProvider);
const priceApiClient = new PriceApiClient(configProvider);
const segmentApiClient = new SegmentApiClient(configProvider);

const assetsService = new AssetsService({
  connection,
  logger,
});

const tokenMetadataService = new TokenMetadataService({
  tokenMetadataClient,
  logger,
});

const transactionsService = new TransactionsService({
  logger,
  connection,
  tokenMetadataService,
});

const walletService = new WalletService(
  fromBase64EncodedBuilder,
  transactionHelper,
  logger,
);

const transactionScanService = new TransactionScanService(
  new SecurityAlertsApiClient(configProvider),
  logger,
);

const keyring = new SolanaKeyring({
  state,
  configProvider,
  transactionsService,
  transactionHelper,
  logger,
  assetsService,
  tokenMetadataService,
  walletService,
  fromBase64EncodedBuilder,
  segmentApiClient,
});

const tokenPricesService = new TokenPricesService(priceApiClient);

const snapContext: SnapExecutionContext = {
  configProvider,
  connection,
  keyring,
  state,
  /* Clients */
  priceApiClient,
  segmentApiClient,
  /* Services */
  assetsService,
  tokenPricesService,
  transactionHelper,
  transactionsService,
  sendSolBuilder,
  sendSplTokenBuilder,
  fromBase64EncodedBuilder,
  walletService,
  transactionScanService,
};

export {
  assetsService,
  configProvider,
  connection,
  fromBase64EncodedBuilder,
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
