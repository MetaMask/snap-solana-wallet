import { getDomainKeySync, NameRegistryState } from '@bonfida/spl-name-service';
import { RpcConnection } from '../../../core/services/rpc-connection';
import { SolanaCaip2Networks } from '../../../core/constants/solana';
import logger from '../../../core/utils/logger';

export async function getPublicKeyFromSolDomain(
  domain: string,
  _currentNetwork: SolanaCaip2Networks,
): Promise<string> {
  try {
    const { pubkey } = await getDomainKeySync(domain);

    const rpcConnection = new RpcConnection({
      network: SolanaCaip2Networks.Mainnet,
    });

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
