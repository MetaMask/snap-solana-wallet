import {
  resolveDomain,
  getPrimaryDomain,
} from '@solana-name-service/sns-sdk-kit';
import type { Address } from '@solana/kit';
import { address as asAddress } from '@solana/kit';

import type { Network } from '../../constants/solana';
import type { ILogger } from '../../utils/logger';
import type { SolanaConnection } from '../connection/SolanaConnection';

export class NameResolutionService {
  #connection: SolanaConnection;

  #logger: ILogger;

  constructor(connection: SolanaConnection, logger: ILogger) {
    this.#connection = connection;
    this.#logger = logger;
  }

  async resolveDomain(scope: Network, domain: string): Promise<Address> {
    const connection = this.#connection.getRpc(scope);
    return resolveDomain(connection, domain);
  }

  async resolveAddress(
    scope: Network,
    address: string,
  ): Promise<string | null> {
    try {
      const connection = this.#connection.getRpc(scope);
      const primaryDomain = await getPrimaryDomain(
        connection,
        asAddress(address),
      );

      return `${primaryDomain.domainName}.sol`;
    } catch (error) {
      this.#logger.error('Error resolving address', error);
      return null;
    }
  }
}
