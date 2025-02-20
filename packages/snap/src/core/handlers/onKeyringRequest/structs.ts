import type { Infer } from 'superstruct';
import { object } from 'superstruct';

import { SolanaWalletStandardRequestStruct } from '../../services/wallet/structs';
import { NetworkStruct, UuidStruct } from '../../validation/structs';

/**
 * A narrower type of the `KeyringRequestStruct` struct that is specific to the Solana snap.
 */
export const SolanaKeyringRequestStruct = object({
  id: UuidStruct,
  scope: NetworkStruct,
  account: UuidStruct,
  request: SolanaWalletStandardRequestStruct,
});

export type SolanaKeyringRequest = Infer<typeof SolanaKeyringRequestStruct>;
