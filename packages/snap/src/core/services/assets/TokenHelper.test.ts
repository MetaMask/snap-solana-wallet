/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable no-restricted-globals */
import type { Mint } from '@solana-program/token-2022';
import type { Account, Address } from '@solana/kit';
import { address, lamports } from '@solana/kit';

import { TokenHelper } from './TokenHelper';

describe('TokenHelper', () => {
  const mockMint = address('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');

  const createMockMintAccount: () => Account<Mint, Address> = () =>
    ({
      data: {
        decimals: 6,
        extensions: {
          __option: 'None',
        },
      },
    }) as unknown as Account<Mint, Address>;

  describe('when the mint has no multiplier', () => {
    const mintAccount = createMockMintAccount();

    it('returns the uiAmount in lamports', () => {
      const result = TokenHelper.uiAmountToAmountForMint(mintAccount, '1000');
      expect(result).toBe(lamports(1000n * 10n ** 6n));
    });
  });

  describe('when the mint has a multiplier', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2022-01-01T00:00:00.000Z'));
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    describe('when the extension is ScaledUiAmountConfig', () => {
      describe('when the new multiplier is not yet effective', () => {
        const nowInSeconds = Math.floor(Date.now() / 1000);
        const extension = {
          __kind: 'ScaledUiAmountConfig' as const,
          multiplier: 1.5,
          newMultiplier: 2,
          newMultiplierEffectiveTimestamp: BigInt(nowInSeconds + 1000), // The new multiplier is not yet effective
          authority: mockMint,
        };

        it('converts the uiAmount to the raw amount correctly', async () => {
          const mockMintAccount = createMockMintAccount();
          mockMintAccount.data.extensions = {
            __option: 'Some',
            value: [extension],
          };

          const amount = TokenHelper.uiAmountToAmountForMint(
            mockMintAccount,
            '1000',
          );

          expect(amount).toBe(666666666n);
        });
      });

      describe('when the new multiplier is already effective', () => {
        const extension = {
          __kind: 'ScaledUiAmountConfig' as const,
          multiplier: 1.5,
          newMultiplier: 2,
          newMultiplierEffectiveTimestamp: 0n,
          authority: mockMint,
        };

        it('converts the uiAmount to the amount in lamports correctly', async () => {
          const mockMintAccount = createMockMintAccount();
          mockMintAccount.data.extensions = {
            __option: 'Some',
            value: [extension],
          };

          const amount = TokenHelper.uiAmountToAmountForMint(
            mockMintAccount,
            '1000',
          );

          expect(amount).toBe(500000000n);
        });
      });
    });

    describe('when the extension is InterestBearingConfig', () => {
      let extension: any;

      beforeEach(() => {
        const nowInSeconds = Math.floor(Date.now() / 1000);

        extension = {
          __kind: 'InterestBearingConfig' as const,
          // Last update was 1 day ago (in seconds)
          lastUpdateTimestamp: BigInt(nowInSeconds - 86400),
          // The interest bearing extension was initialized 30 days ago (in seconds)
          initializationTimestamp: BigInt(nowInSeconds - 86400 * 30),
          // Interest rate in basis points (1 basis point = 0.01%) before last update
          preUpdateAverageRate: 500, // 5%
          // Current interest rate in basis points
          currentRate: 700, // 7%
          rateAuthority: mockMint,
        };
      });

      it('converts the uiAmount to the raw amount correctly', async () => {
        const mockMintAccount = createMockMintAccount();
        mockMintAccount.data.extensions = {
          __option: 'Some',
          value: [extension],
        };

        const amount = TokenHelper.uiAmountToAmountForMint(
          mockMintAccount,
          '1000',
        );

        expect(amount).toBe(995847000n);
      });
    });
  });
});
