import { PriceApiClient } from './core/clients/price-api/PriceApiClient';
import { SecurityAlertsApiClient } from './core/clients/security-alerts-api/SecurityAlertsApiClient';
import { TokenMetadataClient } from './core/clients/token-metadata-client/TokenMetadataClient';
import { SolanaKeyring } from './core/handlers/onKeyringRequest/Keyring';
import { AssetsService } from './core/services/assets/AssetsService';
import { BalancesService } from './core/services/balances/BalancesService';
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
import { refreshAssets as refreshAssetsHandler } from './core/handlers/onCronjob/refreshAssets';

/**
 * Initializes all the services using dependency injection.
 */

export type SnapExecutionContext = {
  configProvider: ConfigProvider;
  connection: SolanaConnection;
  keyring: SolanaKeyring;
  priceApiClient: PriceApiClient;
  state: EncryptedState;
  assetsService: AssetsService;
  tokenPricesService: TokenPricesService;
  transactionHelper: TransactionHelper;
  transactionsService: TransactionsService;
  sendSolBuilder: SendSolBuilder;
  sendSplTokenBuilder: SendSplTokenBuilder;
  fromBase64EncodedBuilder: FromBase64EncodedBuilder;
  walletService: WalletService;
  transactionScanService: TransactionScanService;
  balancesService: BalancesService;
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

// Circular dependency fix:
// There was a circular dependency between BalancesService.ts, refreshAssets.ts, and snapContext.ts
// To solve it, we made refreshAssets an injectable dependency of the BalancesService class
// And defined a type RefreshAssetsFunction to ensure type safety
const refreshAssetsWrapper = async (params: {
  request: {
    params: {
      accountId: string;
    };
    id: string;
    method: string;
    jsonrpc: string;
  };
}): Promise<void> => {
  await refreshAssetsHandler(params as any);
};

const balancesService = new BalancesService(
  assetsService,
  tokenMetadataService,
  state,
  refreshAssetsWrapper,
);

const walletService = new WalletService(
  fromBase64EncodedBuilder,
  transactionHelper,
  balancesService,
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
  logger,
  assetsService,
  balancesService,
  walletService,
});

const tokenPricesService = new TokenPricesService(priceApiClient);

const snapContext: SnapExecutionContext = {
  configProvider,
  connection,
  keyring,
  priceApiClient,
  state,
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
  balancesService,
};

export {
  assetsService,
  balancesService,
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
