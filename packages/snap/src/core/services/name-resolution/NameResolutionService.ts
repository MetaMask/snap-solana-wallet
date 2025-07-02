import {
  resolveDomain,
  getPrimaryDomain,
} from '@solana-name-service/sns-sdk-kit';
import type { Address } from '@solana/kit';
import { address as asAddress } from '@solana/kit';

import type { Network } from '../../constants/solana';
import type { SolanaConnection } from '../connection/SolanaConnection';

export class NameResolutionService {
  #connection: SolanaConnection;

  constructor(connection: SolanaConnection) {
    this.#connection = connection;
  }

  async resolveDomain(scope: Network, domain: string): Promise<Address> {
    const connection = this.#connection.getRpc(scope);
    return resolveDomain(connection, domain);
  }

  async resolveAddress(scope: Network, address: string): Promise<string> {
    const connection = this.#connection.getRpc(scope);
    return (await getPrimaryDomain(connection, asAddress(address)))
      .domainAddress;
  }
}
