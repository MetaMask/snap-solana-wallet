import { PriceApiClient } from './core/clients/price-api/price-api-client';
import { SolanaConnection } from './core/services/connection';
import { SolanaKeyring } from './core/services/keyring';
import { SolanaState } from './core/services/state';

export type SnapExecutionContext = {
  connection: SolanaConnection;
  keyring: SolanaKeyring;
  priceApiClient: PriceApiClient;
  state: SolanaState;
};

const state = new SolanaState();
const connection = new SolanaConnection();
const keyring = new SolanaKeyring(connection);
const priceApiClient = new PriceApiClient();

const snapContext: SnapExecutionContext = {
  connection,
  keyring,
  priceApiClient,
  state,
};

export { connection, keyring, priceApiClient, state };

export default snapContext;
