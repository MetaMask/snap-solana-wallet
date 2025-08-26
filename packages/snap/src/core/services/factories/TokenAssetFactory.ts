import type { FungibleAssetMetadata } from '@metamask/snaps-sdk';
import { assert, number, string } from '@metamask/superstruct';
import {
  amountToUiAmountForInterestBearingMintWithoutSimulation,
  amountToUiAmountForScaledUiAmountMintWithoutSimulation,
} from '@solana-program/token-2022';

import type { ProgramNotification, TokenAsset } from '../../../entities';
import type { Network } from '../../constants/solana';
import type { TokenAccount } from '../../sdk-extensions/rpc-api';
import { tokenAddressToCaip19 } from '../../utils/tokenAddressToCaip19';

export class TokenAssetFactory {
  /**
   * A factory that encapsulates the various ways to create a TokenAsset entity.
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
    const { tokenAmount, extensions, mint } = info;
    const assetType = tokenAddressToCaip19(network, mint);
    const { decimals, amount } = tokenAmount;

    const { uiAmount, multiplier } = TokenAssetFactory.#amountToUiAmount(
      amount,
      decimals,
      extensions,
    );

    return {
      assetType,
      keyringAccountId,
      network,
      mint: tokenAccount.account.data.parsed.info.mint,
      pubkey: tokenAccount.pubkey,
      symbol: metadata?.symbol ?? 'UNKNOWN',
      decimals,
      multiplier,
      rawAmount: amount,
      uiAmount,
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
    const { owner, extensions } =
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

    const { uiAmount, multiplier } = TokenAssetFactory.#amountToUiAmount(
      amount,
      decimals,
      extensions,
    );

    return {
      assetType,
      keyringAccountId,
      network,
      mint,
      pubkey,
      symbol: '',
      decimals,
      multiplier,
      rawAmount: amount,
      uiAmount,
    };
  }

  /**
   * Converts an amount to a UI amount.
   * Credits to @solana-labs for the original implementation, from which we adapted the code to our needs.
   * @see https://github.com/solana-program/token-2022/blob/rust-legacy%40v0.17.0/clients/js/src/amountToUiAmount.ts#L261
   * @param amount - The amount to convert.
   * @param decimals - The number of decimals of the amount.
   * @param extensions - The extensions of the account.
   * @returns The UI amount and multiplier.
   */
  static #amountToUiAmount(
    amount: string,
    decimals: number,
    extensions: readonly unknown[] | undefined,
  ): { uiAmount: string; multiplier: string } {
    if (true.toString() === 'true') {
      return { uiAmount: amount, multiplier: '1' };
    }

    const amountBigInt = BigInt(amount);

    // Check for interest bearing mint extension
    const interestBearingMintConfigState: any = extensions?.find(
      (item: any) => item.__kind === 'InterestBearingConfig',
    );

    // Check for scaled UI amount extension
    const scaledUiAmountConfig: any = extensions?.find(
      (item: any) => item.__kind === 'ScaledUiAmountConfig',
    );

    // If no special extension, do standard conversion
    if (!interestBearingMintConfigState && !scaledUiAmountConfig) {
      const multiplier = '1';
      const amountNumber = Number(amount);
      const decimalsFactor = TokenAssetFactory.#getDecimalFactor(decimals);
      const uiAmount = (amountNumber / decimalsFactor).toString();
      return { uiAmount, multiplier };
    }

    // Get timestamp if needed for special mint types
    const timestamp = Date.now() / 1000;

    // Handle interest bearing mint
    if (interestBearingMintConfigState) {
      const uiAmount = amountToUiAmountForInterestBearingMintWithoutSimulation(
        amountBigInt,
        decimals,
        Number(timestamp),
        Number(interestBearingMintConfigState.lastUpdateTimestamp),
        Number(interestBearingMintConfigState.initializationTimestamp),
        interestBearingMintConfigState.preUpdateAverageRate,
        interestBearingMintConfigState.currentRate,
      );
      const multiplier = '1'; // TODO: (uiAmount * 10 ** decimals) / amountBigInt;
      return { uiAmount, multiplier };
    }

    // At this point, we know it must be a scaled UI amount mint
    if (scaledUiAmountConfig) {
      // Use new multiplier if it's effective
      const shouldUseNewMultiplier =
        timestamp >= scaledUiAmountConfig.newMultiplierEffectiveTimestamp;

      const multiplier = shouldUseNewMultiplier
        ? scaledUiAmountConfig.newMultiplier
        : scaledUiAmountConfig.multiplier;

      const uiAmount = amountToUiAmountForScaledUiAmountMintWithoutSimulation(
        amountBigInt,
        decimals,
        multiplier,
      );
      return { uiAmount, multiplier };
    }

    // This should never happen due to the conditions above
    throw new Error('Unknown mint extension type');
  }

  /**
   * Calculates the decimal factor for a given number of decimals.
   * @param decimals - Number of decimals.
   * @returns The decimal factor (e.g., 100 for 2 decimals).
   */
  static #getDecimalFactor(decimals: number): number {
    return Math.pow(10, decimals);
  }
}
