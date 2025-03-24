import { Network } from '../../../../snap/src/core/constants/solana';

const NETWORK_TO_URL: Record<Network, string> = {
  [Network.Mainnet]: 'https://api.mainnet-beta.solana.com',
  [Network.Devnet]: 'https://api.devnet.solana.com',
  [Network.Testnet]: 'https://api.testnet.solana.com',
  [Network.Localnet]: 'http://localhost:8899',
} as const;

export const networkToUrl = (network: Network) => NETWORK_TO_URL[network];
