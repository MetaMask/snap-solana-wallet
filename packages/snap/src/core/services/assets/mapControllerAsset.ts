import type { Asset } from '@metamask/assets-controller';
import type { CaipAssetType } from '@metamask/utils';
import { parseCaipAssetType } from '@metamask/utils';
import { findAssociatedTokenPda, TOKEN_PROGRAM_ADDRESS } from '@solana-program/token';
import { address as asAddress } from '@solana/kit';

import type { AssetEntity } from '../../../entities';
import type {
  NativeCaipAssetType,
  Network,
  TokenCaipAssetType,
} from '../../constants/solana';
import { SolanaCaip19Tokens } from '../../constants/solana';
import { fromTokenUnits } from '../../utils/fromTokenUnit';

/**
 * Maps an AssetsController asset to the Snap's {@link AssetEntity} shape.
 *
 * @param accountId - Keyring account ID.
 * @param assetId - CAIP-19 asset ID.
 * @param accountAddress - Solana account address for native/token pubkey derivation.
 * @param asset - Asset returned by AssetsController.
 * @returns Mapped asset entity.
 */
export async function mapControllerAsset(
  accountId: string,
  assetId: string,
  accountAddress: string,
  asset: Asset,
): Promise<AssetEntity> {
  const { chainId, assetReference } = parseCaipAssetType(
    assetId as CaipAssetType,
  );
  const decimals = asset.metadata.decimals ?? 0;
  const symbol = asset.metadata.symbol ?? 'UNKNOWN';
  const rawAmount = asset.balance.amount;
  const uiAmount = fromTokenUnits(rawAmount, decimals);
  const network = chainId as Network;

  if (assetId.endsWith(SolanaCaip19Tokens.SOL)) {
    return {
      assetType: assetId as NativeCaipAssetType,
      keyringAccountId: accountId,
      network,
      address: accountAddress,
      symbol,
      decimals,
      rawAmount,
      uiAmount,
    };
  }

  const mint = assetReference;
  const [pubkey] = await findAssociatedTokenPda({
    mint: asAddress(mint),
    owner: asAddress(accountAddress),
    tokenProgram: TOKEN_PROGRAM_ADDRESS,
  });

  return {
    assetType: assetId as TokenCaipAssetType,
    keyringAccountId: accountId,
    network,
    mint,
    pubkey,
    symbol,
    decimals,
    rawAmount,
    uiAmount,
  };
}
