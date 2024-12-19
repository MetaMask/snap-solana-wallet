/* eslint-disable no-restricted-globals */
import type { Infer } from 'superstruct';
import { array, coerce, create, object, optional, string } from 'superstruct';

import { SolanaCaip2Networks } from '../../constants/solana';

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
  PRICE_API_BASE_URL_LOCAL: string(),
  LOCAL: optional(string()),
});

export type Env = Infer<typeof EnvStruct>;

export type Network = {
  caip2Id: SolanaCaip2Networks;
  cluster: string;
  name: string;
  rpcUrls: string[];
};

export type Config = {
  networks: Network[];
  isLocal: boolean;
  priceApi: {
    baseUrl: string;
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
      PRICE_API_BASE_URL: process.env.PRICE_API_BASE_URL,
      PRICE_API_BASE_URL_LOCAL: process.env.PRICE_API_BASE_URL_LOCAL,
      LOCAL: process.env.LOCAL,
    };

    // Validate and parse them before returning
    return create(rawEnvironment, EnvStruct);
  }

  #buildConfig(environment: Env): Config {
    return {
      networks: [
        {
          caip2Id: SolanaCaip2Networks.Mainnet,
          cluster: 'Mainnet',
          name: 'Solana Mainnet',
          rpcUrls: environment.RPC_URL_MAINNET_LIST,
        },
        {
          caip2Id: SolanaCaip2Networks.Devnet,
          cluster: 'Devnet',
          name: 'Solana Devnet',
          rpcUrls: environment.RPC_URL_DEVNET_LIST,
        },
        {
          caip2Id: SolanaCaip2Networks.Testnet,
          cluster: 'Testnet',
          name: 'Solana Testnet',
          rpcUrls: environment.RPC_URL_TESTNET_LIST,
        },
        {
          caip2Id: SolanaCaip2Networks.Localnet,
          cluster: 'Localnet',
          name: 'Solana Localnet',
          rpcUrls: environment.RPC_URL_LOCALNET_LIST,
        },
      ],
      isLocal: Boolean(environment.LOCAL),
      priceApi: {
        baseUrl: environment.LOCAL
          ? environment.PRICE_API_BASE_URL_LOCAL
          : environment.PRICE_API_BASE_URL,
      },
    };
  }

  public get(): Config {
    return this.#config;
  }

  public getNetworkBy(key: keyof Network, value: string): Network {
    const network = this.get().networks.find((item) => item[key] === value);
    if (!network) {
      throw new Error(`Network ${key} not found`);
    }
    return network;
  }
}
