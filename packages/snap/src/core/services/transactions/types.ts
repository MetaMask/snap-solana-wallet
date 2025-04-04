import type { Network } from '../../constants/solana';

export type SignatureMapping = {
  // For bulk fetching: All signatures for a network
  byNetwork: Map<Network, Set<string>>;
  // For account mapping: Signatures for each account+network combination
  byAccountAndNetwork: Map<string, Map<Network, Set<string>>>;
};
