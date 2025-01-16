/* eslint-disable no-restricted-globals */
import type { Infer } from 'superstruct';
import { array, coerce, create, object, optional, string } from 'superstruct';

import { Network, Networks } from '../../constants/solana';

const CommaSeparatedString = coerce(
  array(string()),
  string(),
  (value: string) => value.split(','),
);

const EnvStruct = object({
  RPC_URL_MAINNET_LIST: CommaSeparatedString,
  RPC_URL_DEVNET_LIST: CommaSeparatedString,
  RPC_URL_TESTNET_LIST: CommaSeparatedString,
  RPC_URL_LOCALNET_LIST: CommaSeparatedString,
  PRICE_API_BASE_URL: string(),
  TOKEN_API_BASE_URL: string(),
  TOKEN_API_KEY: string(),
  LOCAL_API_URL: string(),
  LOCAL: optional(string()),
});

export type Env = Infer<typeof EnvStruct>;

export type NetworkWithRpcUrls = (typeof Networks)[Network] & {
  rpcUrls: string[];
};

export type Config = {
  networks: NetworkWithRpcUrls[];
  isLocal: boolean;
  activeNetworks: Network[];
  priceApi: {
    baseUrl: string;
  };
  tokenApi: {
    baseUrl: string;
    apiKey: string;
  };
};

/**
 * A utility class that provides the configuration of the snap.
 *
 * @example
 * const configProvider = new ConfigProvider();
 * const { networks } = configProvider.get();
 * @example
 * // You can use utility methods for more advanced manipulations.
 * const network = configProvider.getNetworkBy('caip2Id', 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp');
 */
export class ConfigProvider {
  #config: Config;

  constructor() {
    const environment = this.#parseEnvironment();
    this.#config = this.#buildConfig(environment);
  }

  #parseEnvironment() {
    const rawEnvironment = {
      RPC_URL_MAINNET_LIST: process.env.RPC_URL_MAINNET_LIST,
      RPC_URL_DEVNET_LIST: process.env.RPC_URL_DEVNET_LIST,
      RPC_URL_TESTNET_LIST: process.env.RPC_URL_TESTNET_LIST,
      RPC_URL_LOCALNET_LIST: process.env.RPC_URL_LOCALNET_LIST,
      // Price API
      PRICE_API_BASE_URL: process.env.PRICE_API_BASE_URL,
      // Token API
      TOKEN_API_BASE_URL: process.env.TOKEN_API_BASE_URL,
      TOKEN_API_KEY: process.env.TOKEN_API_KEY,
      // TODO: Remove this once we have a better way to handle local environment
      LOCAL: process.env.LOCAL,
      LOCAL_API_URL: process.env.LOCAL_API_URL,
    };

    // Validate and parse them before returning
    return create(rawEnvironment, EnvStruct);
  }

  #buildConfig(environment: Env): Config {
    return {
      networks: [
        {
          ...Networks[Network.Mainnet],
          rpcUrls: environment.RPC_URL_MAINNET_LIST,
        },
        {
          ...Networks[Network.Devnet],
          rpcUrls: environment.RPC_URL_DEVNET_LIST,
        },
        {
          ...Networks[Network.Testnet],
          rpcUrls: environment.RPC_URL_TESTNET_LIST,
        },
        {
          ...Networks[Network.Localnet],
          rpcUrls: environment.RPC_URL_LOCALNET_LIST,
        },
      ],
      isLocal: Boolean(environment.LOCAL),
      activeNetworks: environment.LOCAL
        ? [Network.Localnet]
        : [Network.Mainnet, Network.Devnet],
      priceApi: {
        baseUrl: environment.LOCAL
          ? environment.LOCAL_API_URL
          : environment.PRICE_API_BASE_URL,
      },
      tokenApi: {
        baseUrl: environment.LOCAL
          ? environment.LOCAL_API_URL
          : environment.TOKEN_API_BASE_URL,
        apiKey: environment.TOKEN_API_KEY,
      },
    };
  }

  public get(): Config {
    return this.#config;
  }

  public getNetworkBy(
    key: keyof NetworkWithRpcUrls,
    value: string,
  ): NetworkWithRpcUrls {
    const network = this.get().networks.find((item) => item[key] === value);
    if (!network) {
      throw new Error(`Network ${key} not found`);
    }
    return network;
  }
}
