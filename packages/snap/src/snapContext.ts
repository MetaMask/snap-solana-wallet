import { PriceApiClient } from './core/clients/price-api/PriceApiClient';
import { TokenMetadataClient } from './core/clients/token-metadata-client/TokenMetadataClient';
import { AssetsService } from './core/services/assets/AssetsService';
import { ConfigProvider } from './core/services/config';
import { SolanaConnection } from './core/services/connection/SolanaConnection';
import { EncryptedState } from './core/services/encrypted-state/EncryptedState';
import { SplTokenHelper } from './core/services/execution/SplTokenHelper';
import { TransactionHelper } from './core/services/execution/TransactionHelper';
import { TransferSolHelper } from './core/services/execution/TransferSolHelper';
import { SolanaKeyring } from './core/services/keyring/Keyring';
import { TokenMetadataService } from './core/services/token-metadata/TokenMetadata';
import { TokenPricesService } from './core/services/token-prices/TokenPrices';
import { TransactionsService } from './core/services/transactions/Transactions';
import { WalletStandardService } from './core/services/wallet-standard/WalletStandardService';
import logger from './core/utils/logger';

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
  transferSolHelper: TransferSolHelper;
  splTokenHelper: SplTokenHelper;
  walletStandardService: WalletStandardService;
};

const configProvider = new ConfigProvider();
const state = new EncryptedState();
const connection = new SolanaConnection(configProvider);
const transactionHelper = new TransactionHelper(connection, logger);
const transferSolHelper = new TransferSolHelper(transactionHelper, logger);
const splTokenHelper = new SplTokenHelper(
  connection,
  transactionHelper,
  logger,
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
  configProvider,
  tokenMetadataService,
});

const walletStandardService = new WalletStandardService(logger);

const keyring = new SolanaKeyring({
  state,
  configProvider,
  transactionsService,
  transactionHelper,
  logger,
  assetsService,
  tokenMetadataService,
  walletStandardService,
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
  transferSolHelper,
  splTokenHelper,
  walletStandardService,
};

export {
  assetsService,
  configProvider,
  connection,
  keyring,
  priceApiClient,
  splTokenHelper,
  state,
  tokenMetadataClient,
  tokenMetadataService,
  tokenPricesService,
  transactionHelper,
  transactionsService,
  transferSolHelper,
  walletStandardService,
};

export default snapContext;
