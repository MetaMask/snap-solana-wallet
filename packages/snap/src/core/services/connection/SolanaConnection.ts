/* eslint-disable @typescript-eslint/naming-convention */
import { assert } from '@metamask/superstruct';
import { Duration } from '@metamask/utils';
import { fetchMint, type Mint } from '@solana-program/token-2022';
import type { Account, Address, FetchAccountConfig } from '@solana/kit';
import {
  address as asAddress,
  createSolanaRpcFromTransport,
  type Rpc,
  type SolanaRpcApi,
} from '@solana/kit';

import type { ICache } from '../../caching/ICache';
import { useCache } from '../../caching/useCache';
import type { Network } from '../../constants/solana';
import type { Serializable } from '../../serialization/types';
import { NetworkStruct } from '../../validation/structs';
import type { ConfigProvider } from '../config/ConfigProvider';
import { createMainTransport } from './transport';

/**
 * The SolanaConnection class is responsible for managing the connections to the Solana networks.
 */
export class SolanaConnection {
  readonly #configProvider: ConfigProvider;

  readonly #cache: ICache<Serializable>;

  readonly #cacheTtlsMilliseconds = {
    fetchMint: Duration.Minute,
  };

  /**
   * A mapping of Solana network CAIP-2 IDs to their respective RPC clients.
   *
   * Each network has its own RPC connection for making JSON-RPC requests
   * to the Solana blockchain.
   */
  readonly #networkCaip2IdToRpc: Map<Network, Rpc<SolanaRpcApi>> = new Map();

  constructor(configProvider: ConfigProvider, cache: ICache<Serializable>) {
    this.#configProvider = configProvider;
    this.#cache = cache;
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

  /**
   * Returns the mint account for the given address and network.
   *
   * It's a wrapper around the fetchMint function that caches the result for 1 minute.
   * @param address - The address of the mint.
   * @param caip2Id - The CAIP-2 ID of the network.
   * @param config - The config for the fetchMint function.
   * @returns The mint.
   */
  public async fetchMint(
    address: string,
    caip2Id: Network,
    config?: FetchAccountConfig,
  ): Promise<Account<Mint, Address>> {
    /**
     * Defines the base uncached function for fetching a mint account.
     *
     * This wrapper is used instead of directly caching the SDK's fetchMint function
     * to ensure that only simple arguments are used, as these arguments form the cache key.
     */

    const fetchMintInternal = async (
      _address: Address,
      _caip2Id: Network,
      _config?: FetchAccountConfig,
    ) => {
      const rpc = this.getRpc(caip2Id);
      return fetchMint(rpc, asAddress(address), config);
    };

    // Create a cached version of the function
    const fetchMintCached = useCache<
      [Address, Network, FetchAccountConfig | undefined],
      Account<Mint, Address> & Serializable
    >(fetchMintInternal as any, this.#cache, {
      ttlMilliseconds: this.#cacheTtlsMilliseconds.fetchMint,
      functionName: 'SolanaConnection::fetchMint',
    });

    return fetchMintCached(asAddress(address), caip2Id, config);
  }
}
