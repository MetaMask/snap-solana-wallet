/* eslint-disable jsdoc/check-indentation */
import type { Base58EncodedBytes, Transaction } from '@solana/kit';

import { MOCK_EXECUTION_SCENARIO_SEND_SOL } from '../services/execution/mocks/scenarios/sendSol';
import { MOCK_EXECUTION_SCENARIO_SEND_SPL_TOKEN } from '../services/execution/mocks/scenarios/sendSplToken';
import { EXPECTED_SWAP_SOL_TO_OBRIC_DATA } from '../test/mocks/transactions-data/swap-sol-to-obric';
import { EXPECTED_SWAP_SOL_TO_USDC_DATA } from '../test/mocks/transactions-data/swap-sol-to-usdc';
import { EXPECTED_SWAP_USDC_TO_JUP_DATA } from '../test/mocks/transactions-data/swap-usdc-to-jup';
import type { SolanaTransaction } from '../types/solana';
import { FeeCalculatorUnsupportedInputTypeError } from './errors';
import { FeeCalculator } from './FeeCalculator';

describe('FeeCalculator', () => {
  describe('calculateFee', () => {
    describe('when the input is a Kit Transaction', () => {
      it('calculates fee a simple send SOL with no priority fee', () => {
        const kitTransaction: Transaction =
          MOCK_EXECUTION_SCENARIO_SEND_SOL.signedTransaction;

        const feeBreakdown = FeeCalculator.calculateFee(kitTransaction);

        expect(feeBreakdown).toStrictEqual({
          ed25519SignaturesCount: 1,
          secp256k1SignaturesCount: 0,
          secp256r1SignaturesCount: 0,
          totalSignaturesCount: 1,
          baseFee: 5000n,
          computeUnitLimit: 300,
          computeUnitPriceMicroLamportsPerComputeUnit: 1000n,
          priorityFee: 0n, // Since both fields above are non zero, it should be non-zero as well, but it gets swallowed by the rounding ( = lower than 1 lamport)
          totalFee: 5000n,
        });
      });

      it('calculates fee a SPL token send', () => {
        const kitTransaction: Transaction =
          MOCK_EXECUTION_SCENARIO_SEND_SPL_TOKEN.signedTransaction;

        const feeBreakdown = FeeCalculator.calculateFee(kitTransaction);

        expect(feeBreakdown).toStrictEqual({
          ed25519SignaturesCount: 1,
          secp256k1SignaturesCount: 0,
          secp256r1SignaturesCount: 0,
          totalSignaturesCount: 1,
          baseFee: 5000n,
          computeUnitLimit: 4794,
          computeUnitPriceMicroLamportsPerComputeUnit: 1000n,
          priorityFee: 4n,
          totalFee: 5004n,
        });
      });
    });

    describe('when the input is a base64 string', () => {
      it('calculates fee for a send SOL', () => {
        const { signedTransactionBase64Encoded } =
          MOCK_EXECUTION_SCENARIO_SEND_SOL;

        const feeBreakdown = FeeCalculator.calculateFee(
          signedTransactionBase64Encoded,
        );

        expect(feeBreakdown).toStrictEqual({
          ed25519SignaturesCount: 1,
          secp256k1SignaturesCount: 0,
          secp256r1SignaturesCount: 0,
          totalSignaturesCount: 1,
          baseFee: 5000n,
          computeUnitLimit: 300,
          computeUnitPriceMicroLamportsPerComputeUnit: 1000n,
          priorityFee: 0n,
          totalFee: 5000n,
        });
      });
    });

    describe('when the input is a Solana Transaction', () => {
      it('calculates fee for a swap SOL to USDC', () => {
        const solanaTransaction: SolanaTransaction =
          EXPECTED_SWAP_SOL_TO_USDC_DATA;

        const feeBreakdown = FeeCalculator.calculateFee(solanaTransaction);

        expect(feeBreakdown).toStrictEqual({
          ed25519SignaturesCount: 1,
          secp256k1SignaturesCount: 0,
          secp256r1SignaturesCount: 0,
          totalSignaturesCount: 1,
          baseFee: 5000n,
          computeUnitLimit: 100719,
          computeUnitPriceMicroLamportsPerComputeUnit: 100000n,
          priorityFee: 10071n,
          totalFee: 15071n,
        });

        // Can also verify values at https://solscan.io/tx/2X4vKsDS56avumw6jh6Z5wj28GNvK5UkMfY1Ta2Mtouic886EGAraa1gsCJ5rkXyHCeL9p2wHRty3QHAhjf352Dp
      });

      it('calculates fee for a swap SOL to OBRIC', () => {
        const solanaTransaction: SolanaTransaction =
          EXPECTED_SWAP_SOL_TO_OBRIC_DATA;

        const feeBreakdown = FeeCalculator.calculateFee(solanaTransaction);

        expect(feeBreakdown).toStrictEqual({
          ed25519SignaturesCount: 1,
          secp256k1SignaturesCount: 0,
          secp256r1SignaturesCount: 0,
          totalSignaturesCount: 1,
          baseFee: 5000n,
          computeUnitLimit: 121290,
          computeUnitPriceMicroLamportsPerComputeUnit: 100000n,
          priorityFee: 12129n,
          totalFee: 17129n,
        });

        // Can also verify values at https://solscan.io/tx/28rWme56aMyaP8oX18unFeZg65iyDEhjLhvMBpxyFgKcn38P37ZRsssSZoHDCCr5xUfwfpqsVSSBoShLitHQLdrr
      });

      it('calculates fee for a swap USDC to JUP', () => {
        const solanaTransaction: SolanaTransaction =
          EXPECTED_SWAP_USDC_TO_JUP_DATA;

        const feeBreakdown = FeeCalculator.calculateFee(solanaTransaction);

        expect(feeBreakdown).toStrictEqual({
          ed25519SignaturesCount: 1,
          secp256k1SignaturesCount: 0,
          secp256r1SignaturesCount: 0,
          totalSignaturesCount: 1,
          baseFee: 5000n,
          computeUnitLimit: 75583,
          computeUnitPriceMicroLamportsPerComputeUnit: 992287n,
          priorityFee: 75000n,
          totalFee: 80000n,
        });

        // Can also verify values at https://solscan.io/tx/5LuTa5k9UvgM2eJknVUD9MjfcmcTP7nvFrCedU8d7ZLXCHbrrwqhXDQYTSfncm1wTSNFPZj3Y4cRkWC8CLG6Zcvh
      });

      it('calculates fee for a transaction with secp256k1 signatures', () => {
        /**
         * Example taken from https://solscan.io/tx/h6CgrypQ1WQcpSCxdF1ot8ghhHwdvZ2aEDq4T5D7uYgbrTsyzh2FcmUmduXpW1EJ1VMYnMxFwVNC8DE85rz8i7e,
         * stripped down to only include the relevant fields
         */
        const solanaTransaction = {
          transaction: {
            message: {
              accountKeys: [
                'FBZHdo1DRq1FPcu8oq8iFAXNxsPiQyXqBFooDWGqRMy8',
                'KeccakSecp256k11111111111111111111111111111',
                'SBondMDrcV3K4kxZR1HNVT7osZxAHVHgYXL5Ze1oMUv',
                'DznDmDUujQFSVjw5QWSQgwwPLMPvBWDdYpcS1m5YgUuw',
                'ComputeBudget111111111111111111111111111111',
              ],
              instructions: [
                {
                  accounts: [],
                  data: '4GitRX1TrUudSfhNjqnrEr8moSWnpf8JFgUcETEVr9zj8N1tJEPFtwkyAX2mNSF2QUAmPB8tajRgfUWBnrjL3E9yLLX9S3iN91LpR2YtR95G8Gxhydrx7fJAdUmxnz2DDvmSNSJUFFJGi7KwwFPohJK5PjAVBgiP1GjUEiFjWP7KDjWeak7qkKT7P2wGssiMd28Zdn5awtA931LWjkQ2iNf8wK6AQfpGhQqnBgmeq1PZm5SmqdvANfdrJzN1iMPLUoUgrNde8WgVSDx9RQmhbnwLeK6zbSxGUx48AUBCfXV7EncCGz5HfbyGqKjNzE52Jecv2E2U6vacEcqauESgULLWn88wvWa9Zq4nL4KFXNivrDZT6PunaM7LSe6nkdtvdLExitw1vomz7XRxXZWzSy4HKhGKL4ZzEDgRuQy2y1iGvvXwq5j1Wa' as Base58EncodedBytes,
                  programIdIndex: 1,
                  stackHeight: null,
                },
                {
                  accounts: [6, 9, 7, 8, 5, 3, 10, 11],
                  data: '2MhfeB5b7uKAndiWYjwUobgC6a3WmtumxZQ9Ao4abcn9j5DGEK' as Base58EncodedBytes,
                  programIdIndex: 2,
                  stackHeight: null,
                },
                {
                  accounts: [],
                  data: 'G9oAjh' as Base58EncodedBytes,
                  programIdIndex: 4,
                  stackHeight: null,
                },
                {
                  accounts: [],
                  data: '3ZCMAp4yqfCB' as Base58EncodedBytes,
                  programIdIndex: 4,
                  stackHeight: null,
                },
              ],
            },
            signatures: [
              'h6CgrypQ1WQcpSCxdF1ot8ghhHwdvZ2aEDq4T5D7uYgbrTsyzh2FcmUmduXpW1EJ1VMYnMxFwVNC8DE85rz8i7e',
            ],
          },
        } as unknown as SolanaTransaction;

        const feeBreakdown = FeeCalculator.calculateFee(solanaTransaction);

        expect(feeBreakdown).toStrictEqual({
          ed25519SignaturesCount: 1,
          secp256k1SignaturesCount: 3,
          secp256r1SignaturesCount: 0,
          totalSignaturesCount: 4,
          baseFee: 20000n,
          computeUnitLimit: 50000,
          computeUnitPriceMicroLamportsPerComputeUnit: 374n,
          priorityFee: 18n,
          totalFee: 20018n,
        });

        /**
         * If we verify the values at https://solscan.io/tx/h6CgrypQ1WQcpSCxdF1ot8ghhHwdvZ2aEDq4T5D7uYgbrTsyzh2FcmUmduXpW1EJ1VMYnMxFwVNC8DE85rz8i7e,
         * we notice that Solscan doesn't properly breakdown the fees (as for Sept. 17, 2025)
         *  - It correctly detects that the total fee is 20018 lamports ✅
         *  - But it believes that there is just 1 signature, the regular ed25519 one, while in fact there are 4 in total ❌
         *  - It causes it to wrongfully consider that the base fee is 5000 lamports (while it should be 5000 * 4 = 20000 lamports) ❌
         *  - And so it incorrectly attributes the remaining 20018 - 5000 = 15018 lamports to the priority fee ❌
         *  - A priority fee of 15018 is incorrect. It should be 18 lamports, which can be verified by calculating it manually with the compute unit limit and price.
         */
      });

      it('calculates fee for a transaction with secp256r1 signatures', () => {
        /**
         * Example taken from https://solscan.io/tx/2CDp2XYu3KsfhKnCmbPKoqxfF34ootxr2L8TFf5cqCZVXbotSyQB2SRbiEu3gsBceZwq9D6hFXCBhhEAUerqELXp
         * stripped down to only include the relevant fields
         */
        const solanaTransaction = {
          transaction: {
            message: {
              accountKeys: [
                '3EKX2bfqj6hKNeM4yMxEDMZB4vGB9RmQcdovgQZb7GGQ',
                '1QsRZqBRy1PXUZ5mgt1n1npe7BMWgJys6nKc1zeDuN8',
                '11111111111111111111111111111111',
                'Secp256r1SigVerify1111111111111111111111111',
                'Sysvar1nstructions1111111111111111111111111',
                'jitodontfrontdPSjdxeD1ZUg4tmZg7hLDB9GqRMrxq',
                'sa12qbQyuQqEaDcEqEPKmZEGTdzSMaqj87nKRYbE3QE',
              ],
              instructions: [
                {
                  accounts: [0, 0, 1, 2, 4, 6, 6, 5],
                  data: '4tUjktD1csGoKXLhoPTyVUhSVVRXeQ33rxJqLQNS9GA6hKfYKee3hA2X9pXt65JNuDK2YfLcx6sGV1zoDJCt8S8Rus3XEiZU9B3TQdbQXp5dUcnjg2LDKaaErxSQeDNQshjciSc6oqwL3sdwGfmxJN5hDhXVnz563HH1Uc2GLmB1um8p9M8e1qtBBHEaMG14tUzpic9aHQ1v6JfhcX3k36wKpfg1V2ZP1eZRddyD3pmYHpdKRwGB8ZE8WSisT8nm9sBBcDksDCskq7h9fEjgBWjPMz82bZoPT7mkfPbhFJ25gNsjBj2AU7voN653iGAjhzkdxYNB9Yg4PULuZ8ffzAxc4hSKzm5Du5g63',
                  programIdIndex: 6,
                  stackHeight: null,
                },
                {
                  accounts: [],
                  data: '37bVnf5k5XNTVwdBpMaj56HaSdM5wjEsUcWkSNab2fVyUdekdyaxYJcFq2GatwnuQyTUMMB3GWTF7gmVv9CiKbw3HGUX1868ghSuq7FdpKb2v7UHPBhEfpANQ4dithun9HJCsfmnZpcD16xTt8FL8ZvVugd76arLFRqEiUfXEqVt1M96QSiw5gAei2L8e43bLW1USz98ABchXNPFS4fqUxuoHq37Kp7RHnQgsB6CFbYVYKPqFaksnV5j',
                  programIdIndex: 3,
                  stackHeight: null,
                },
              ],
            },
            signatures: [
              '2CDp2XYu3KsfhKnCmbPKoqxfF34ootxr2L8TFf5cqCZVXbotSyQB2SRbiEu3gsBceZwq9D6hFXCBhhEAUerqELXp',
            ],
          },
        } as unknown as SolanaTransaction;

        const feeBreakdown = FeeCalculator.calculateFee(solanaTransaction);

        expect(feeBreakdown).toStrictEqual({
          ed25519SignaturesCount: 1,
          secp256k1SignaturesCount: 0,
          secp256r1SignaturesCount: 1,
          totalSignaturesCount: 2,
          baseFee: 10000n,
          computeUnitLimit: 0,
          computeUnitPriceMicroLamportsPerComputeUnit: 0n,
          priorityFee: 0n,
          totalFee: 10000n,
        });

        /**
         * Here again, we notice that Solscan doesn't properly breakdown the fees (as for Sept. 17, 2025).
         *  - It correctly detects that the total fee is 10000 lamports ✅
         *  - But it believes that there is just 1 signature, the regular ed25519 one, while in fact there are 2 in total ❌
         *  - It causes it to wrongfully consider that the base fee is 5000 lamports (while it should be 5000 * 2 = 10000 lamports) ❌
         *  - And so it incorrectly attributes the remaining 10000 - 5000 = 5000 lamports to the priority fee ❌
         *  - A priority fee of 5000 is incorrect. It should be 0 lamports, because there is no compute unit limit or price in this transaction.
         */
      });
    });
  });

  describe('when the input is an invalid type', () => {
    it('throws error for unsupported input type', () => {
      const invalidInput = { invalid: 'data' } as any;

      expect(() => FeeCalculator.calculateFee(invalidInput)).toThrow(
        FeeCalculatorUnsupportedInputTypeError,
      );
    });
  });
});
