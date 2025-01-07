import { PriceApiClient } from './core/clients/price-api/price-api-client';
import { ConfigProvider } from './core/services/config';
import { SolanaConnection } from './core/services/connection/SolanaConnection';
import { EncryptedSolanaState } from './core/services/encrypted-state';
import { SolanaKeyring } from './core/services/keyring';
import { SolanaState } from './core/services/state';
import { TokenPricesService } from './core/services/TokenPricesService';
import { TransactionHelper } from './core/services/TransactionHelper/TransactionHelper';
import { TransactionsService } from './core/services/transactions';
import { TransferSolHelper } from './core/services/TransferSolHelper/TransferSolHelper';
import { TransferSPLTokenHelper } from './core/services/TransferSPLTokenHelper/TransferSPLTokenHelper';
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
  tokenPricesService: TokenPricesService;
  transactionHelper: TransactionHelper;
  transactionsService: TransactionsService;
  transferSolHelper: TransferSolHelper;
  transferSPLTokenHelper: TransferSPLTokenHelper;
};

const configProvider = new ConfigProvider();
const state = new SolanaState();
const encryptedState = new EncryptedSolanaState();
const connection = new SolanaConnection(configProvider);
const transactionHelper = new TransactionHelper(connection, logger);
const transferSolHelper = new TransferSolHelper(transactionHelper, logger);
const transferSPLTokenHelper = new TransferSPLTokenHelper(
  transactionHelper,
  logger,
);
const transactionsService = new TransactionsService({
  logger,
  connection,
});
const priceApiClient = new PriceApiClient(configProvider);

const keyring = new SolanaKeyring({
  state,
  encryptedState,
  connection,
  transactionsService,
  transferSolHelper,
  transferSPLTokenHelper,
  logger,
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
  tokenPricesService,
  transactionHelper,
  transactionsService,
  transferSolHelper,
  transferSPLTokenHelper,
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
  transferSolHelper,
  transferSPLTokenHelper,
};

export default snapContext;
