import {
  type Cluster,
  Connection,
  PublicKey,
  clusterApiUrl,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';

export class SolanaOnChain {
  #connection: Connection;

  constructor({ cluster }: { cluster: Cluster }) {
    this.#connection = new Connection(clusterApiUrl(cluster));
  }

  async getBalance(address: string): Promise<string> {
    const publicKey = new PublicKey(address);
    const balance = await this.#connection.getBalance(publicKey);

    return String(balance / LAMPORTS_PER_SOL);
  }
}
