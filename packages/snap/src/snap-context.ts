import { PriceApiClient } from './core/clients/price-api/price-api-client';
import { ConfigProvider } from './core/services/config';
import { SolanaConnection } from './core/services/connection/SolanaConnection';
import { SolanaKeyring } from './core/services/keyring';
import { SolanaState } from './core/services/state';
import { TokenPricesService } from './core/services/TokenPricesService';
import logger from './core/utils/logger';

export type SnapExecutionContext = {
  connection: SolanaConnection;
  keyring: SolanaKeyring;
  priceApiClient: PriceApiClient;
  state: SolanaState;
  tokenPricesService: TokenPricesService;
};

const configProvider = new ConfigProvider();
const state = new SolanaState();
const connection = new SolanaConnection(configProvider);
const keyring = new SolanaKeyring(connection);
const priceApiClient = new PriceApiClient(configProvider);
const tokenPricesService = new TokenPricesService(
  priceApiClient,
  snap,
  state,
  logger,
);

const snapContext: SnapExecutionContext = {
  connection,
  keyring,
  priceApiClient,
  state,
  tokenPricesService,
};

export { connection, keyring, priceApiClient, state, tokenPricesService };

export default snapContext;
