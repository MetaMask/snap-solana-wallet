/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable no-restricted-globals */
import { Network } from '../../../../snap/src/core/constants/solana';

const NETWORK_TO_URL: Record<Network, string> = {
  [Network.Mainnet]: process.env.RPC_URL_MAINNET!,
  [Network.Devnet]: process.env.RPC_URL_DEVNET!,
  [Network.Testnet]: process.env.RPC_URL_TESTNET!,
  [Network.Localnet]: process.env.RPC_URL_LOCAL!,
} as const;

console.log('NETWORK_TO_URL', NETWORK_TO_URL);

export const networkToUrl = (network: Network) => NETWORK_TO_URL[network];
