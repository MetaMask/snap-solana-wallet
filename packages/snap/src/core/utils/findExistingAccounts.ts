import {
  createKeyPairFromPrivateKeyBytes,
  getAddressFromPublicKey,
} from '@solana/web3.js';

import { Network } from '../constants/solana';
import type { AssetsService } from '../services/assets/AssetsService';
import { deriveSolanaPrivateKey } from './deriveSolanaPrivateKey';
import logger from './logger';

export type ExistingAccountData = {
  index: number;
  address: string;
  balance: bigint;
};

/**
 * Searches for existing Solana accounts with non-zero balances.
 * Checks the first 5 derivation paths and returns the first account found with a balance.
 *
 * @param assetsService - Service to query account balances.
 * @returns Array of existing accounts with their indices, addresses, and balances.
 * Returns empty array if no accounts with balance are found.
 */
export async function findExistingAccounts(
  assetsService: AssetsService,
): Promise<ExistingAccountData[]> {
  try {
    const existingAccounts: ExistingAccountData[] = [];

    // Checks the first 5 derivation paths
    for (let index = 0; index < 5; index++) {
      const { privateKeyBytes } = await deriveSolanaPrivateKey(index);
      const keyPair = await createKeyPairFromPrivateKeyBytes(privateKeyBytes);
      const address = await getAddressFromPublicKey(keyPair.publicKey);

      const nativeAsset = await assetsService.getNativeAsset(
        address,
        Network.Mainnet,
      );

      if (BigInt(nativeAsset.balance) > 0n) {
        existingAccounts.push({
          index,
          address,
          balance: BigInt(nativeAsset.balance),
        });
        break;
      }
    }

    return existingAccounts;
  } catch (error) {
    logger.error({ error }, 'Error finding existing accounts');
    throw error;
  }
}
