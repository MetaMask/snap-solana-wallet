/* eslint-disable @typescript-eslint/prefer-reduce-type-parameter */
import { createSolanaRpc, type Rpc, type SolanaRpcApi } from '@solana/web3.js';

import {
  SOLANA_NETWORK_TO_RPC_URLS,
  SolanaCaip2Networks,
} from '../constants/solana';

/**
 * The SolanaConnection class is responsible for managing the connection to the Solana network.
 *
 * It's a helper class that holds one Solana's SDK "rpc" object per network.
 * And same for "rpcSubscriptions".
 */
export class SolanaConnection {
  /**
   * A mapping of Solana networks to their respective RPC clients.
   * Each network has its own RPC connection for making JSON-RPC requests
   * to the Solana blockchain.
   */
  readonly #networkToRpc: Map<SolanaCaip2Networks, Rpc<SolanaRpcApi>>;

  constructor() {
    console.log('hey');
    // For each network, create a dedicated RPC client and a dedicated RPC subscription client
    this.#networkToRpc = new Map();

    Object.entries(SOLANA_NETWORK_TO_RPC_URLS).forEach(([network, url]) => {
      this.#validateNetworkOrThrow(network as SolanaCaip2Networks);

      this.#networkToRpc.set(
        network as SolanaCaip2Networks,
        createSolanaRpc(url),
      );
    });
  }

  #isValidNetwork(network: string): network is SolanaCaip2Networks {
    return Object.values(SolanaCaip2Networks).includes(
      network as SolanaCaip2Networks,
    );
  }

  #validateNetworkOrThrow(network: SolanaCaip2Networks): void {
    if (!this.#isValidNetwork(network)) {
      throw new Error(`Invalid network: ${String(network)}`);
    }
  }

  public getRpc(network: SolanaCaip2Networks): Rpc<SolanaRpcApi> {
    const networkRpc = this.#networkToRpc.get(network);
    if (!networkRpc) {
      throw new Error(`Invalid network: ${network}`);
    }
    return networkRpc;
  }
}
