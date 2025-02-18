/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable no-restricted-globals */
import bs58 from 'bs58';

import { Network } from '../../constants/solana';
import type { ConfigProvider } from '../../services/config';
import type { ILogger } from '../../utils/logger';
import logger from '../../utils/logger';
import type { SecurityAlertSimulationValidationResponse } from './types';

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
  }): Promise<SecurityAlertSimulationValidationResponse> {
    // eslint-disable-next-line no-param-reassign
    transactions = [
      'vxBNpvao9QJmLKXUThbbjRnxm3ufu4Wku97kHd5a67FDjSqeHwcPrBKTjAHp4ECr61eWwoxvUEVTuuWX65P9bCNDJrTJpX64vjdtpHA8cogA4C92Ubj813wUUA8Ey4Bvcrdj5c1bSTCnwoE8HeFYiyioRLNZTpShx8zkyzXaxkpUvPVRN26363bGvJDNSJt8bihmwAPxfrH7kSV9BvAuhRWsiuUAN4GZzyAiptknHZ1xjzrKAHz68UNJpWnYkaUThye6r3iULZUcp7baBaGAtnUmAdDMGG1UpBusWLF',
    ];

    // eslint-disable-next-line no-param-reassign
    accountAddress = '86xCnPeV69n6t3DnyGvkKobf9FdN2H9oiVDdaMpo2MMY';

    const base64AccountAddress = Buffer.from(
      bs58.decode(accountAddress),
    ).toString('base64');

    this.#logger.info(
      {
        method,
        accountAddress,
        transactions,
        scope,
        options,
      },
      'Scanning transactions',
    );

    const response = await this.#fetch(`${this.#baseUrl}/solana/message/scan`, {
      headers: {
        'Content-Type': 'application/json',
        accept: 'application/json',
      },
      method: 'POST',
      body: JSON.stringify({
        method,
        encoding: 'base58',
        account_address: accountAddress,
        metadata: {
          url: 'https://metamask.io', // FIXME: Add the correct url
        },
        chain: SCOPE_TO_CHAIN[scope],
        transactions,
        options,
      }),
    });

    return response.json();
  }
}
