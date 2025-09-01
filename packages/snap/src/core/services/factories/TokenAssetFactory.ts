import type { FungibleAssetMetadata } from '@metamask/snaps-sdk';
import { assert, number, string } from '@metamask/superstruct';

import type { ProgramNotification, TokenAsset } from '../../../entities';
import type { Network } from '../../constants/solana';
import type { TokenAccount } from '../../sdk-extensions/rpc-api';
import { tokenAddressToCaip19 } from '../../utils/tokenAddressToCaip19';

/**
 * A factory that creates TokenAsset entities from different sources.
 */
export class TokenAssetFactory {
  /**
   * Creates a TokenAsset from a token account.
   * @param tokenAccount - The token account to create the TokenAsset from.
   * @param metadata - The metadata to use for the TokenAsset.
   * @param keyringAccountId - The keyring account id to use for the TokenAsset.
   * @param network - The network to use for the TokenAsset.
   * @returns The created TokenAsset.
   */
  static createFromTokenAccount(
    tokenAccount: TokenAccount,
    metadata: FungibleAssetMetadata | undefined,
    keyringAccountId: string,
    network: Network,
  ): TokenAsset {
    const { info } = tokenAccount.account.data.parsed;
    const { tokenAmount, mint } = info;
    const assetType = tokenAddressToCaip19(network, mint);
    const { decimals, amount, uiAmountString } = tokenAmount;

    return {
      assetType,
      keyringAccountId,
      network,
      mint: tokenAccount.account.data.parsed.info.mint,
      pubkey: tokenAccount.pubkey,
      symbol: metadata?.symbol ?? 'UNKNOWN',
      decimals,
      rawAmount: amount,
      uiAmount: uiAmountString,
    };
  }

  /**
   * Creates a TokenAsset from a program notification.
   * @param programNotification - The program notification to create the TokenAsset from.
   * @param keyringAccountId - The keyring account id to use for the TokenAsset.
   * @param network - The network to use for the TokenAsset.
   * @returns The created TokenAsset.
   */
  static createFromProgramNotification(
    programNotification: ProgramNotification,
    keyringAccountId: string,
    network: Network,
  ): TokenAsset {
    const { owner } =
      programNotification.params.result.value.account.data.parsed.info;
    assert(owner, string());

    const { mint } =
      programNotification.params.result.value.account.data.parsed.info;
    assert(mint, string());

    const { amount, decimals, uiAmountString } =
      programNotification.params.result.value.account.data.parsed.info
        .tokenAmount;
    assert(amount, string());
    assert(decimals, number());
    assert(uiAmountString, string());

    const { pubkey } = programNotification.params.result.value;
    assert(pubkey, string());

    const assetType = tokenAddressToCaip19(network, mint);

    return {
      assetType,
      keyringAccountId,
      network,
      mint,
      pubkey,
      symbol: '',
      decimals,
      rawAmount: amount,
      uiAmount: uiAmountString,
    };
  }
}
