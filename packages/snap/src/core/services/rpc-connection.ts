import {
  type Cluster,
  Connection,
  PublicKey,
  clusterApiUrl,
  LAMPORTS_PER_SOL,
  Keypair,
  Transaction,
  SystemProgram,
  sendAndConfirmTransaction,
} from '@solana/web3.js';

export class RpcConnection {
  #connection: Connection;

  constructor({ cluster }: { cluster: Cluster }) {
    this.#connection = new Connection(clusterApiUrl(cluster), {
      commitment: 'confirmed',
    });
  }

  async getBalance(address: string): Promise<string> {
    const publicKey = new PublicKey(address);
    const balance = await this.#connection.getBalance(publicKey);

    return String(balance / LAMPORTS_PER_SOL);
  }

  async transferSol(
    from: Keypair,
    to: PublicKey,
    solAmount: number,
  ): Promise<string> {
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: from.publicKey,
        toPubkey: to,
        lamports: solAmount * LAMPORTS_PER_SOL,
      }),
    );

    // const signature = await this.#connection.sendTransaction(transaction, [
    //   from,
    // ]);

    const signature = await sendAndConfirmTransaction(
      this.#connection,
      transaction,
      [from],
    );

    return signature;
  }
}
