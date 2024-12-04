import { PriceApiClient } from '../clients/price-api/price-api-client';
import { SolanaConnection } from './connection';
import { SolanaKeyring } from './keyring';
import { SolanaState } from './state';

const state = new SolanaState();
const connection = new SolanaConnection();
const keyring = new SolanaKeyring(connection);
const priceApiClient = new PriceApiClient();

export { connection, keyring, priceApiClient, state };
