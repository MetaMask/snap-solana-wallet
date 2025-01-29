import { PriceApiClient } from './core/clients/price-api/PriceApiClient';
import { TokenMetadataClient } from './core/clients/token-metadata-client/TokenMetadataClient';
import { AssetsService } from './core/services/assets/Assets';
import { ConfigProvider } from './core/services/config';
import { SolanaConnection } from './core/services/connection/SolanaConnection';
import { EncryptedSolanaState } from './core/services/encrypted-state/EncryptedState';
import { SplTokenHelper } from './core/services/execution/SplTokenHelper';
import { TransactionHelper } from './core/services/execution/TransactionHelper';
import { TransferSolHelper } from './core/services/execution/TransferSolHelper';
import { SolanaKeyring } from './core/services/keyring/Keyring';
import { SolanaState } from './core/services/state/State';
import { TokenMetadataService } from './core/services/token-metadata/TokenMetadata';
import { TokenPrices } from './core/services/token-prices/TokenPrices';
import { TransactionsService } from './core/services/transactions/Transactions';
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
  tokenPricesService: TokenPrices;
  transactionHelper: TransactionHelper;
  transactionsService: TransactionsService;
  transferSolHelper: TransferSolHelper;
  splTokenHelper: SplTokenHelper;
};

const configProvider = new ConfigProvider();
const state = new SolanaState();
const encryptedState = new EncryptedSolanaState();
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

const keyring = new SolanaKeyring({
  state,
  encryptedState,
  configProvider,
  transactionsService,
  transactionHelper,
  logger,
  assetsService,
  tokenMetadataService,
});

const tokenPricesService = new TokenPrices(priceApiClient);

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
  splTokenHelper,
};

export {
  assetsService,
  configProvider,
  connection,
  encryptedState,
  keyring,
  priceApiClient,
  splTokenHelper,
  state,
  tokenPricesService,
  tokenMetadataService,
  tokenMetadataClient,
  transactionHelper,
  transactionsService,
  transferSolHelper,
};

export default snapContext;
