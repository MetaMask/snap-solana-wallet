/* eslint-disable n/no-process-env */
import type { SnapConfig } from '@metamask/snaps-cli';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { create, defaulted, object, string } from 'superstruct';

dotenv.config();

const EnvConfigStruct = object({
  RPC_URL_MAINNET: defaulted(string(), 'https://api.mainnet-beta.solana.com/'),
  RPC_URL_DEVNET: defaulted(string(), 'https://api.devnet.solana.com/'),
  RPC_URL_TESTNET: defaulted(string(), 'https://api.testnet.solana.com/'),
});

// Read and validate environment variables
const rawEnvironment = {
  RPC_URL_MAINNET: process.env.RPC_URL_MAINNET,
  RPC_URL_DEVNET: process.env.RPC_URL_DEVNET,
  RPC_URL_TESTNET: process.env.RPC_URL_TESTNET,
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
