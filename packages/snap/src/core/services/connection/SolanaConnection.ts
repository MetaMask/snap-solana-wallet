import {
  createSolanaRpcFromTransport,
  type Rpc,
  type SolanaRpcApi,
} from '@solana/web3.js';
import { assert } from 'superstruct';

import type { Network } from '../../constants/solana';
import { NetworkStruct } from '../../validation/structs';
import type { ConfigProvider } from '../config/ConfigProvider';
import { createMainTransport } from './transport';

/**
 * The SolanaConnection class is responsible for managing the connections to the Solana networks.
 */
export class SolanaConnection {
  readonly #configProvider: ConfigProvider;

  /**
   * A mapping of Solana network CAIP-2 IDs to their respective RPC clients.
   *
   * Each network has its own RPC connection for making JSON-RPC requests
   * to the Solana blockchain.
   */
  readonly #networkCaip2IdToRpc: Map<Network, Rpc<SolanaRpcApi>> = new Map();

  constructor(configProvider: ConfigProvider) {
    this.#configProvider = configProvider;
  }

  #createRpc(caip2Id: Network): Rpc<SolanaRpcApi> {
    const network = this.#configProvider.getNetworkBy('caip2Id', caip2Id);
    const transport = createMainTransport(network.rpcUrls);
    const rpc = createSolanaRpcFromTransport(transport);
    this.#networkCaip2IdToRpc.set(caip2Id, rpc);
    return rpc;
  }

  /**
   * Returns the RPC client for the given network CAIP-2 ID.
   * If the RPC client does not exist, it creates a new one
   * and stores it in the map.
   *
   * @param caip2Id - The CAIP-2 ID of the network.
   * @returns The RPC client for the given network CAIP-2 ID.
   */
  public getRpc(caip2Id: Network): Rpc<SolanaRpcApi> {
    assert(caip2Id, NetworkStruct);
    return this.#networkCaip2IdToRpc.get(caip2Id) ?? this.#createRpc(caip2Id);
  }
}
