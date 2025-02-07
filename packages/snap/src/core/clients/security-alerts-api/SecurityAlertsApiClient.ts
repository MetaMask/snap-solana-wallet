/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable no-restricted-globals */
import bs58 from 'bs58';

import { Network } from '../../constants/solana';
import type { ConfigProvider } from '../../services/config';
import type { ILogger } from '../../utils/logger';
import logger from '../../utils/logger';

const SCOPE_TO_CHAIN: Record<Network, string> = {
  [Network.Mainnet]: 'mainnet',
  [Network.Devnet]: 'devnet',
  [Network.Testnet]: 'testnet',
  [Network.Localnet]: 'localnet',
};

export class SecurityAlertsApiClient {
  readonly #fetch: typeof globalThis.fetch;

  readonly #logger: ILogger;

  readonly #baseUrl: string;

  constructor(
    configProvider: ConfigProvider,
    _fetch: typeof globalThis.fetch = globalThis.fetch,
    _logger: ILogger = logger,
  ) {
    const { baseUrl } = configProvider.get().securityAlertsApi;

    this.#fetch = _fetch;
    this.#logger = _logger;
    this.#baseUrl = baseUrl;
  }

  async scanTransactions({
    method,
    accountAddress,
    transactions,
    scope,
    options,
  }: {
    method: string;
    accountAddress: string;
    transactions: string[];
    scope: Network;
    options: string[];
  }): Promise<any> {
    const base64AccountAddress = Buffer.from(
      bs58.decode(accountAddress),
    ).toString('base64');

    const response = await this.#fetch(
      `${this.#baseUrl}/v0/solana/message/scan`,
      {
        headers: {
          'Content-Type': 'application/json',
          accept: 'application/json',
          'x-client-id': '', // FIXME: Add the correct client id when it works
        },
        method: 'POST',
        body: JSON.stringify({
          method,
          encoding: 'base64',
          account_address: base64AccountAddress,
          metadata: {
            url: 'https://example.com', // FIXME: Add the correct url
          },
          chain: SCOPE_TO_CHAIN[scope],
          transactions,
          options,
        }),
      },
    );

    return response.json();
  }
}
