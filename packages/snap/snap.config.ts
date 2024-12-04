/* eslint-disable n/no-process-env */
import type { SnapConfig } from '@metamask/snaps-cli';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { create, object, string } from 'superstruct';

dotenv.config();

const EnvConfigStruct = object({
  RPC_URL_MAINNET: string(),
  RPC_URL_DEVNET: string(),
  RPC_URL_TESTNET: string(),
  RPC_URL_LOCALNET: string(),
});

// Read and validate environment variables
const rawEnvironment = {
  RPC_URL_MAINNET: process.env.RPC_URL_MAINNET,
  RPC_URL_DEVNET: process.env.RPC_URL_DEVNET,
  RPC_URL_TESTNET: process.env.RPC_URL_TESTNET,
  RPC_URL_LOCALNET: process.env.RPC_URL_LOCALNET,
};

// Validate the environment variables, and retrieve the parsed values
const environment = create(rawEnvironment, EnvConfigStruct);

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
