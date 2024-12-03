import { PriceApiClient } from './core/clients/price-api/price-api-client';
import { ConfigProvider } from './core/services/config';
import { SolanaConnection } from './core/services/connection/SolanaConnection';
import { EncryptedSolanaState } from './core/services/encrypted-state';
import { SolanaKeyring } from './core/services/keyring';
import { SolanaState } from './core/services/state';
import { TokenPricesService } from './core/services/TokenPricesService';
import { TransactionsService } from './core/services/transactions';
import logger from './core/utils/logger';

export type SnapExecutionContext = {
  connection: SolanaConnection;
  keyring: SolanaKeyring;
  priceApiClient: PriceApiClient;
  encryptedState: EncryptedSolanaState;
  state: SolanaState;
  tokenPricesService: TokenPricesService;
  transactionsService: TransactionsService;
};

const configProvider = new ConfigProvider();
const state = new SolanaState();
const encryptedState = new EncryptedSolanaState();
const connection = new SolanaConnection(configProvider);
const priceApiClient = new PriceApiClient(configProvider);

const transactionsService = new TransactionsService({
  logger,
  connection,
});

const keyring = new SolanaKeyring({
  state,
  encryptedState,
  connection,
  transactionsService,
});

const tokenPricesService = new TokenPricesService(
  priceApiClient,
  state,
  logger,
);

const snapContext: SnapExecutionContext = {
  connection,
  keyring,
  priceApiClient,
  encryptedState,
  state,
  /* Services */
  tokenPricesService,
  transactionsService,
};

export {
  configProvider,
  connection,
  encryptedState,
  keyring,
  priceApiClient,
  state,
  tokenPricesService,
  transactionsService,
};

export default snapContext;
