/* eslint-disable n/no-process-env */
import type { SnapConfig } from '@metamask/snaps-cli';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config();

const environment = {
  RPC_URL_MAINNET_LIST: process.env.RPC_URL_MAINNET_LIST ?? '',
  RPC_URL_DEVNET_LIST: process.env.RPC_URL_DEVNET_LIST ?? '',
  RPC_URL_TESTNET_LIST: process.env.RPC_URL_TESTNET_LIST ?? '',
  RPC_URL_LOCALNET_LIST: process.env.RPC_URL_LOCALNET_LIST ?? '',
  PRICE_API_BASE_URL: process.env.PRICE_API_BASE_URL ?? '',
  TOKEN_API_BASE_URL: process.env.TOKEN_API_BASE_URL ?? '',
  TOKEN_API_KEY: process.env.TOKEN_API_KEY ?? '',
  LOCAL_API_BASE_URL: process.env.LOCAL_API_BASE_URL ?? '',
  LOCAL: process.env.LOCAL,
};

const config: SnapConfig = {
  bundler: 'webpack',
  input: resolve(__dirname, 'src/index.tsx'),
  server: {
    port: 8080,
  },
  environment,
  polyfills: {
    buffer: true,
    crypto: true,
  },
};

export default config;
