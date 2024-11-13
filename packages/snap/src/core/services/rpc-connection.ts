import {
  type Cluster,
  Connection,
  PublicKey,
  clusterApiUrl,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';

import { SolanaCaip2Networks } from '../constants/solana';

export class RpcConnection {
  #connection: Connection;

  constructor({ network }: { network: SolanaCaip2Networks }) {
    const networkToCluster = {
      [SolanaCaip2Networks.Mainnet]: 'mainnet-beta',
      [SolanaCaip2Networks.Devnet]: 'devnet',
      [SolanaCaip2Networks.Testnet]: 'testnet',
    };

    this.#connection = new Connection(
      clusterApiUrl(networkToCluster[network] as Cluster),
    );
  }

  async getBalance(address: string): Promise<string> {
    const publicKey = new PublicKey(address);
    const balance = await this.#connection.getBalance(publicKey);

    return String(balance / LAMPORTS_PER_SOL);
  }
}
