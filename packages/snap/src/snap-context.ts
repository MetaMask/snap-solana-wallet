import { PriceApiClient } from './core/clients/price-api/price-api-client';
import { TokenMetadataClient } from './core/clients/token-metadata-client/token-metadata-client';
import { AssetsService } from './core/services/assets';
import { ConfigProvider } from './core/services/config';
import { SolanaConnection } from './core/services/connection/SolanaConnection';
import { EncryptedSolanaState } from './core/services/encrypted-state';
import { SolanaKeyring } from './core/services/keyring';
import { SplTokenHelper } from './core/services/SplTokenHelper/SplTokenHelper';
import { SolanaState } from './core/services/state';
import { TokenMetadataService } from './core/services/token-metadata';
import { TokenPricesService } from './core/services/TokenPricesService';
import { TransactionHelper } from './core/services/TransactionHelper/TransactionHelper';
import { TransactionsService } from './core/services/transactions';
import { TransferSolHelper } from './core/services/TransferSolHelper/TransferSolHelper';
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
  splTokenHelper,
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
  splTokenHelper,
};

export {
  configProvider,
  connection,
  keyring,
  priceApiClient,
  splTokenHelper,
  state,
  tokenPricesService,
  transactionHelper,
  transactionsService,
  assetsService,
};

export default snapContext;
