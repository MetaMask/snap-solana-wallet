import { PriceApiClient } from './core/clients/price-api/price-api-client';
import { ConfigProvider } from './core/services/config';
import { SolanaConnection } from './core/services/connection/SolanaConnection';
import { SolanaKeyring } from './core/services/keyring';
import { SolanaState } from './core/services/state';
import { TokenPricesService } from './core/services/TokenPricesService';
import { TransactionHelper } from './core/services/TransactionHelper/TransactionHelper';
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
  state: SolanaState;
  tokenPricesService: TokenPricesService;
  transactionHelper: TransactionHelper;
  transferSolHelper: TransferSolHelper;
};

const configProvider = new ConfigProvider();
const state = new SolanaState();
const connection = new SolanaConnection(configProvider);
const transactionHelper = new TransactionHelper(connection, logger);
const transferSolHelper = new TransferSolHelper(
  transactionHelper,
  connection,
  logger,
);
const keyring = new SolanaKeyring(connection, logger, transferSolHelper);
const priceApiClient = new PriceApiClient(configProvider);
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
  state,
  tokenPricesService,
  transactionHelper,
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
  transferSolHelper,
};

export default snapContext;
