import type { Mint } from '@solana-program/token-2022';
import {
  uiAmountToAmountForInterestBearingMintWithoutSimulation,
  uiAmountToAmountForScaledUiAmountMintWithoutSimulation,
} from '@solana-program/token-2022';
import type { Account, Address, Lamports } from '@solana/kit';
import { lamports, unwrapOption } from '@solana/kit';
import BigNumber from 'bignumber.js';

export class TokenHelper {
  /**
   * Some tokens use extensions that introduce a multiplier to the amount. This method extracts the multiplier from a mint account, accounting for special extensions such as
   * interest bearing or scaled UI amount mints. If no extension is present, returns 1.
   *
   * This is used for cosmetic balance calculations (e.g., yield, dividends, splits) and does not
   * affect the token program's internal transfer logic.
   *
   * Adapted from @solana-labs token-2022 implementation.
   * @see https://github.com/solana-program/token-2022/blob/rust-legacy%40v0.17.0/clients/js/src/amountToUiAmount.ts#L329
   * @param mintAccount - The mint account to extract the multiplier from.
   * @param uiAmount - The UI amount to convert to the amount in lamports.
   * @returns The amount in lamports.
   */
  static uiAmountToAmountForMintWithoutSimulation(
    mintAccount: Account<Mint, Address>,
    uiAmount: string,
  ): Lamports {
    const extensions = unwrapOption(mintAccount.data.extensions);
    const { decimals } = mintAccount.data;

    // Check for interest bearing mint extension
    const interestBearingMintConfigState: any = extensions?.find(
      (item: any) => item.__kind === 'InterestBearingConfig',
    );

    // Check for scaled UI amount extension
    const scaledUiAmountConfig: any = extensions?.find(
      (item: any) => item.__kind === 'ScaledUiAmountConfig',
    );

    // If no special extension, the amount in lamports is simply the uiAmount converted to lamports
    if (!interestBearingMintConfigState && !scaledUiAmountConfig) {
      return lamports(
        BigInt(
          BigNumber(uiAmount)
            .multipliedBy(10 ** decimals)
            .toString(),
        ),
      );
    }

    // Get timestamp if needed for special mint types
    const timestamp = Date.now() / 1000;

    // Handle interest bearing mint
    if (interestBearingMintConfigState) {
      const rawAmountLamports =
        uiAmountToAmountForInterestBearingMintWithoutSimulation(
          uiAmount,
          decimals,
          Number(timestamp),
          Number(interestBearingMintConfigState.lastUpdateTimestamp),
          Number(interestBearingMintConfigState.initializationTimestamp),
          interestBearingMintConfigState.preUpdateAverageRate,
          interestBearingMintConfigState.currentRate,
        );
      return lamports(rawAmountLamports);
    }

    // At this point, we know it must be a scaled UI amount mint
    if (scaledUiAmountConfig) {
      let { multiplier } = scaledUiAmountConfig;
      // Use new multiplier if it's effective
      if (timestamp >= scaledUiAmountConfig.newMultiplierEffectiveTimestamp) {
        multiplier = scaledUiAmountConfig.newMultiplier;
      }
      const rawAmountLamports =
        uiAmountToAmountForScaledUiAmountMintWithoutSimulation(
          uiAmount,
          decimals,
          multiplier,
        );
      return lamports(rawAmountLamports);
    }

    // This should never happen due to the conditions above
    throw new Error('Unknown mint extension type');
  }
}
