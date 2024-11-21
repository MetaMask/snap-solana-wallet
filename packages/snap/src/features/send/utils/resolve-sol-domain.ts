// import { getDomainKeySync, NameRegistryState } from '@bonfida/spl-name-service';

import { SolanaCaip2Networks } from '../../../core/constants/solana';
import { RpcConnection } from '../../../core/services/rpc-connection';
import logger from '../../../core/utils/logger';

/**
 * Resolves a Solana public key from a given .sol domain name.
 * @param domain - The .sol domain name to resolve (e.g., "mydomain.sol").
 * @param _currentNetwork - The Solana network to use (currently unused as we default to mainnet).
 * @returns A promise that resolves to the owner's public key as a base58 string.
 * @throws {Error} When the domain is not found or has no owner.
 * @throws {Error} When there's an error resolving the domain.
 * @example
 * const publicKey = await getPublicKeyFromSolDomain("mydomain.sol", SolanaCaip2Networks.Mainnet);
 */
export async function getPublicKeyFromSolDomain(
  domain: string,
  _currentNetwork: SolanaCaip2Networks,
): Promise<string> {
  try {
    // @ts-expect-error remove this after installing the @bonfida/spl-name-service
    const { pubkey } = getDomainKeySync(domain);

    const rpcConnection = new RpcConnection({
      network: SolanaCaip2Networks.Mainnet,
    });

    // @ts-expect-error remove this after installing the @bonfida/spl-name-service
    const registry = await NameRegistryState.retrieve(
      rpcConnection.connection,
      pubkey,
    );

    if (!registry?.registry?.owner) {
      throw new Error('Domain not found or has no owner');
    }

    const owner = registry.registry.owner.toBase58();

    logger.info(`The owner of SNS Domain: ${domain} is: `, owner);

    return owner;
  } catch (error) {
    logger.error({ error }, 'Error resolving SOL domain');
    throw error;
  }
}
