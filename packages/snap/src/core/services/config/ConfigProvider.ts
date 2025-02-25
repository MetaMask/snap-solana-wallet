/* eslint-disable no-restricted-globals */
import type { Infer } from '@metamask/superstruct';
import {
  array,
  coerce,
  create,
  enums,
  object,
  string,
} from '@metamask/superstruct';

import { Network, Networks } from '../../constants/solana';
import { UrlStruct } from '../../validation/structs';

const CommaSeparatedListOfUrlsStruct = coerce(
  array(UrlStruct),
  string(),
  (value: string) => value.split(','),
);

const CommaSeparatedListOfStringsStruct = coerce(
  array(string()),
  string(),
  (value: string) => value.split(','),
);

const EnvStruct = object({
  ENVIRONMENT: enums(['local', 'test', 'production']),
  RPC_URL_MAINNET_LIST: CommaSeparatedListOfUrlsStruct,
  RPC_URL_DEVNET_LIST: CommaSeparatedListOfUrlsStruct,
  RPC_URL_TESTNET_LIST: CommaSeparatedListOfUrlsStruct,
  RPC_URL_LOCALNET_LIST: CommaSeparatedListOfStringsStruct,
  PRICE_API_BASE_URL: UrlStruct,
  TOKEN_API_BASE_URL: UrlStruct,
  STATIC_API_BASE_URL: UrlStruct,
  SECURITY_ALERTS_API_BASE_URL: UrlStruct,
  LOCAL_API_BASE_URL: string(),
  SEGMENT_API_BASE_URL: UrlStruct,
  SEGMENT_API_WRITE_KEY: string(),
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
    storageLimit: number;
  };
  securityAlertsApi: {
    baseUrl: string;
  };
  segmentApi: {
    baseUrl: string;
    writeKey: string;
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
      // Blockaid
      SECURITY_ALERTS_API_BASE_URL: process.env.SECURITY_ALERTS_API_BASE_URL,
      // Local API
      LOCAL_API_BASE_URL: process.env.LOCAL_API_BASE_URL,
      // Segment API
      SEGMENT_API_BASE_URL: process.env.SEGMENT_API_BASE_URL,
      SEGMENT_API_WRITE_KEY: process.env.SEGMENT_API_WRITE_KEY,
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
        storageLimit: 20,
      },
      securityAlertsApi: {
        baseUrl:
          environment.ENVIRONMENT === 'test'
            ? environment.LOCAL_API_BASE_URL
            : environment.SECURITY_ALERTS_API_BASE_URL,
      },
      segmentApi: {
        baseUrl:
          environment.ENVIRONMENT === 'test' ||
          environment.ENVIRONMENT === 'local'
            ? environment.LOCAL_API_BASE_URL
            : environment.SEGMENT_API_BASE_URL,
        writeKey: environment.SEGMENT_API_WRITE_KEY,
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
