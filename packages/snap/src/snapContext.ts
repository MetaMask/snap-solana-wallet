import { PriceApiClient } from './core/clients/price-api/PriceApiClient';
import { TokenMetadataClient } from './core/clients/token-metadata-client/TokenMetadataClient';
import { AssetsService } from './core/services/assets/Assets';
import { ConfigProvider } from './core/services/config';
import { SolanaConnection } from './core/services/connection/SolanaConnection';
import { EncryptedSolanaState } from './core/services/encrypted-state/EncryptedState';
import { SolanaKeyring } from './core/services/keyring/Keyring';
import { SolanaState } from './core/services/state/State';
import { TokenMetadataService } from './core/services/token-metadata/TokenMetadata';
import { TokenPricesService } from './core/services/token-prices/TokenPricesService';
import { TransactionHelper } from './core/services/transaction-helper/TransactionHelper';
import { TransactionsService } from './core/services/transactions/Transactions';
import { TransferSolHelper } from './core/services/transfer-sol-helper/TransferSolHelper';
import logger from './core/utils/logger';

/**
 * Initializes all the services using dependency injection.
 */

export type SnapExecutionContext = {
  configProvider: ConfigProvider;
  connection: SolanaConnection;
  keyring: SolanaKeyring;
  priceApiClient: PriceApiClient;
  encryptedState: EncryptedSolanaState;
  state: SolanaState;
  assetsService: AssetsService;
  tokenPricesService: TokenPricesService;
  transactionHelper: TransactionHelper;
  transactionsService: TransactionsService;
  transferSolHelper: TransferSolHelper;
};

const configProvider = new ConfigProvider();
const state = new SolanaState();
const encryptedState = new EncryptedSolanaState();
const connection = new SolanaConnection(configProvider);
const transactionHelper = new TransactionHelper(connection, logger);
const transferSolHelper = new TransferSolHelper(
  transactionHelper,
  connection,
  logger,
);
const tokenMetadataClient = new TokenMetadataClient(configProvider);
const priceApiClient = new PriceApiClient(configProvider);

const transactionsService = new TransactionsService({
  logger,
  connection,
});

const assetsService = new AssetsService({
  connection,
  logger,
});

const tokenMetadataService = new TokenMetadataService({
  tokenMetadataClient,
});

const keyring = new SolanaKeyring({
  state,
  encryptedState,
  configProvider,
  connection,
  transactionsService,
  transferSolHelper,
  logger,
  assetsService,
  tokenMetadataService,
});

const tokenPricesService = new TokenPricesService(
  priceApiClient,
  state,
  logger,
);

const snapContext: SnapExecutionContext = {
  configProvider,
  connection,
  keyring,
  priceApiClient,
  encryptedState,
  state,
  /* Services */
  assetsService,
  tokenPricesService,
  transactionHelper,
  transactionsService,
  transferSolHelper,
};

export {
  configProvider,
  connection,
  keyring,
  priceApiClient,
  state,
  tokenPricesService,
  transactionHelper,
  transactionsService,
  assetsService,
};

export default snapContext;
