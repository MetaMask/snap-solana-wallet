import { KeyringRequestStruct } from '@metamask/keyring-api';
import type { Infer } from '@metamask/superstruct';
import {
  array,
  min,
  nonempty,
  number,
  object,
  string,
} from '@metamask/superstruct';

import { SolanaWalletRequestStruct } from '../../services/wallet/structs';
import { NetworkStruct } from '../../validation/structs';

/**
 * A narrower type of the `KeyringRequestStruct` struct (think of it as `SolanaKeyringRequestStruct extends KeyringRequestStruct`) that is specific to the Solana snap.
 */
export const SolanaKeyringRequestStruct = object({
  ...KeyringRequestStruct.schema, // Re-use default schema as a base.
  scope: NetworkStruct, // Narrow-down scopes for Solana only.
  request: SolanaWalletRequestStruct,
});

export type SolanaKeyringRequest = Infer<typeof SolanaKeyringRequestStruct>;

export const DiscoverAccountsRequestStruct = object({
  scopes: nonempty(array(NetworkStruct)),
  entropySource: string(),
  groupIndex: min(number(), 0),
});

export type DiscoverAccountsRequest = Infer<
  typeof DiscoverAccountsRequestStruct
>;
