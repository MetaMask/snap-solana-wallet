/* eslint-disable n/no-process-env */
import type { SnapConfig } from '@metamask/snaps-cli';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config();

const environment = {
  ENVIRONMENT: process.env.ENVIRONMENT ?? '',
  RPC_URL_MAINNET_LIST: process.env.RPC_URL_MAINNET_LIST ?? '',
  RPC_URL_DEVNET_LIST: process.env.RPC_URL_DEVNET_LIST ?? '',
  RPC_URL_TESTNET_LIST: process.env.RPC_URL_TESTNET_LIST ?? '',
  RPC_URL_LOCALNET_LIST: process.env.RPC_URL_LOCALNET_LIST ?? '',
  RPC_WEB_SOCKET_URL_MAINNET: process.env.RPC_WEB_SOCKET_URL_MAINNET ?? '',
  RPC_WEB_SOCKET_URL_DEVNET: process.env.RPC_WEB_SOCKET_URL_DEVNET ?? '',
  RPC_WEB_SOCKET_URL_TESTNET: process.env.RPC_WEB_SOCKET_URL_TESTNET ?? '',
  RPC_WEB_SOCKET_URL_LOCALNET: process.env.RPC_WEB_SOCKET_URL_LOCALNET ?? '',
  EXPLORER_BASE_URL: process.env.EXPLORER_BASE_URL ?? '',
  PRICE_API_BASE_URL: process.env.PRICE_API_BASE_URL ?? '',
  TOKEN_API_BASE_URL: process.env.TOKEN_API_BASE_URL ?? '',
  STATIC_API_BASE_URL: process.env.STATIC_API_BASE_URL ?? '',
  SECURITY_ALERTS_API_BASE_URL: process.env.SECURITY_ALERTS_API_BASE_URL ?? '',
  NFT_API_BASE_URL: process.env.NFT_API_BASE_URL ?? '',
  LOCAL_API_BASE_URL: process.env.LOCAL_API_BASE_URL ?? '',
};

const config: SnapConfig = {
  input: resolve(__dirname, 'src/index.ts'),
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
