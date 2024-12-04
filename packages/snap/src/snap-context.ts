import { PriceApiClient } from './core/clients/price-api/price-api-client';
import { SolanaConnection } from './core/services/connection';
import { SolanaKeyring } from './core/services/keyring';
import { SolanaState } from './core/services/state';
import { TokenRatesService } from './core/services/TokenRatesService';
import logger from './core/utils/logger';

export type SnapExecutionContext = {
  connection: SolanaConnection;
  keyring: SolanaKeyring;
  priceApiClient: PriceApiClient;
  state: SolanaState;
  tokenRatesService: TokenRatesService;
};

const state = new SolanaState();
const connection = new SolanaConnection();
const keyring = new SolanaKeyring(connection);
const priceApiClient = new PriceApiClient();
const tokenRatesService = new TokenRatesService(
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
  tokenRatesService,
};

export { connection, keyring, priceApiClient, state, tokenRatesService };

export default snapContext;
