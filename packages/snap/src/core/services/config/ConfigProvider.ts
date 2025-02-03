/* eslint-disable no-restricted-globals */
import type { Infer } from 'superstruct';
import { array, coerce, create, enums, object, string } from 'superstruct';

import { Network, Networks } from '../../constants/solana';

const CommaSeparatedString = coerce(
  array(string()),
  string(),
  (value: string) => value.split(','),
);

const EnvStruct = object({
  ENVIRONMENT: enums(['local', 'test', 'production']),
  RPC_URL_MAINNET_LIST: CommaSeparatedString,
  RPC_URL_DEVNET_LIST: CommaSeparatedString,
  RPC_URL_TESTNET_LIST: CommaSeparatedString,
  RPC_URL_LOCALNET_LIST: CommaSeparatedString,
  PRICE_API_BASE_URL: string(),
  TOKEN_API_BASE_URL: string(),
  STATIC_API_BASE_URL: string(),
  LOCAL_API_BASE_URL: string(),
});

export type Env = Infer<typeof EnvStruct>;

export type NetworkWithRpcUrls = (typeof Networks)[Network] & {
  rpcUrls: string[];
};

export type Config = {
  environment: string;
  networks: NetworkWithRpcUrls[];
  activeNetworks: Network[];
  priceApi: {
    baseUrl: string;
    chunkSize: number;
  };
  tokenApi: {
    baseUrl: string;
    chunkSize: number;
  };
  staticApi: {
    baseUrl: string;
  };
  transactions: {
    bootstrapLimit: number;
    storageLimit: number;
    fetchLimit: number;
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
      ENVIRONMENT: process.env.ENVIRONMENT,
      RPC_URL_MAINNET_LIST: process.env.RPC_URL_MAINNET_LIST,
      RPC_URL_DEVNET_LIST: process.env.RPC_URL_DEVNET_LIST,
      RPC_URL_TESTNET_LIST: process.env.RPC_URL_TESTNET_LIST,
      RPC_URL_LOCALNET_LIST: process.env.RPC_URL_LOCALNET_LIST,
      // Price API
      PRICE_API_BASE_URL: process.env.PRICE_API_BASE_URL,
      // Token API
      TOKEN_API_BASE_URL: process.env.TOKEN_API_BASE_URL,
      // Static API
      STATIC_API_BASE_URL: process.env.STATIC_API_BASE_URL,
      LOCAL_API_BASE_URL: process.env.LOCAL_API_BASE_URL,
    };

    // Validate and parse them before returning
    return create(rawEnvironment, EnvStruct);
  }

  #buildConfig(environment: Env): Config {
    return {
      environment: environment.ENVIRONMENT,
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
      activeNetworks:
        environment.ENVIRONMENT === 'test'
          ? [Network.Localnet]
          : [Network.Mainnet, Network.Devnet],
      priceApi: {
        baseUrl:
          environment.ENVIRONMENT === 'test'
            ? environment.LOCAL_API_BASE_URL
            : environment.PRICE_API_BASE_URL,
        chunkSize: 50,
      },
      tokenApi: {
        baseUrl:
          environment.ENVIRONMENT === 'test'
            ? environment.LOCAL_API_BASE_URL
            : environment.TOKEN_API_BASE_URL,
        chunkSize: 50,
      },
      staticApi: {
        baseUrl: environment.STATIC_API_BASE_URL,
      },
      transactions: {
        bootstrapLimit: 2,
        storageLimit: 5,
        fetchLimit: 2,
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
