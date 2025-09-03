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
   * Converts a UI amount to the raw amount in lamports for a given mint, accounting for
   * any special mint extensions such as interest bearing or scaled UI amount mints.
   *
   * This is used for accurate cosmetic balance calculations (e.g., yield, dividends, splits)
   * and does not affect the token program's internal transfer logic.
   *
   * If no extension is present, the conversion is a simple decimal shift.
   *
   * Based on the implementation from @solana-labs token-2022.
   * @see https://github.com/solana-program/token-2022/blob/rust-legacy%40v0.17.0/clients/js/src/amountToUiAmount.ts#L329
   * @param mintAccount - The mint account containing extension and decimal information.
   * @param uiAmount - The UI amount to convert.
   * @returns The amount in lamports as a Lamports type.
   */
  static uiAmountToAmountForMint(
    mintAccount: Account<Mint, Address>,
    uiAmount: string,
  ): Lamports {
    try {
      console.log(
        '🔮🔮🔮 uiAmountToAmountForMintWithoutSimulation',
        mintAccount,
        uiAmount,
      );
      const extensions = unwrapOption(mintAccount.data?.extensions);
      const { decimals } = mintAccount.data ?? {};

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
    } catch (error: any) {
      const decimals = mintAccount.data?.decimals ?? 9;
      return lamports(
        BigInt(
          BigNumber(uiAmount)
            .multipliedBy(10 ** decimals)
            .toString(),
        ),
      );
    }
  }

  /**
   * Reverse operation of {@link uiAmountToAmountForMint}.
   * Instead of re-impleting the logic, we use a mathematical trick to find the multiplier.
   * @param mintAccount - The mint account containing extension and decimal information.
   * @param amount - The amount in lamports to convert.
   * @returns The UI amount as a string.
   */
  static amountToUiAmountForMint(
    mintAccount: Account<Mint, Address>,
    amount: Lamports,
  ): string {
    try {
      const fakeUiAmount = 1000000000n;

      const multiplier = BigNumber(
        TokenHelper.uiAmountToAmountForMint(
          mintAccount,
          fakeUiAmount.toString(),
        ).toString(),
      ).dividedBy(fakeUiAmount.toString());

      return BigNumber(amount.toString()).dividedBy(multiplier).toString();
    } catch (error: any) {
      const decimals = mintAccount.data?.decimals ?? 9;
      return BigNumber(amount.toString())
        .dividedBy(10 ** decimals)
        .toString();
    }
  }
}
