import type {
  Lamports,
  StringifiedBigInt,
  StringifiedNumber,
} from '@solana/web3.js';
import { address as asAddress } from '@solana/web3.js';

import { Caip19Id, Network } from '../../../constants/solana';
import { EXPECTED_SEND_USDC_TRANSFER_DATA } from '../../../test/mocks/transactions-data/send-usdc-transfer';
import type { SolanaTransaction } from '../../../types/solana';
import { parseTransactionSplTransfers } from './parseTransactionSplTransfers';

describe('parseTransactionSplTransfers', () => {
  it('should handle normal SPL transfers correctly - USDC Devnet', () => {
    const result = parseTransactionSplTransfers({
      scope: Network.Devnet,
      transactionData: EXPECTED_SEND_USDC_TRANSFER_DATA,
    });

    expect(result).toStrictEqual({
      from: [
        {
          address: 'BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP',
          asset: {
            amount: '0.01',
            fungible: true,
            type: Caip19Id.UsdcDevnet,
            unit: 'USDC',
          },
        },
      ],
      to: [
        {
          address: 'BXT1K8kzYXWMi6ihg7m9UqiHW4iJbJ69zumELHE9oBLe',
          asset: {
            amount: '0.01',
            fungible: true,
            type: Caip19Id.UsdcDevnet,
            unit: 'USDC',
          },
        },
      ],
    });
  });

  it(`should handle 'zero' as a possible balance difference`, () => {
    const result = parseTransactionSplTransfers({
      scope: Network.Devnet,
      transactionData: {
        ...EXPECTED_SEND_USDC_TRANSFER_DATA,
        meta: {
          ...EXPECTED_SEND_USDC_TRANSFER_DATA.meta,
          preTokenBalances: [
            {
              accountIndex: 1,
              mint: asAddress('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'),
              owner: asAddress('BXT1K8kzYXWMi6ihg7m9UqiHW4iJbJ69zumELHE9oBLe'),
              uiTokenAmount: {
                amount: '60000' as StringifiedBigInt,
                decimals: 6,
                uiAmount: 0.06,
                uiAmountString: '0.06' as StringifiedNumber,
              },
            },
          ],
          postTokenBalances: [
            {
              accountIndex: 1,
              mint: asAddress('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'),
              owner: asAddress('BXT1K8kzYXWMi6ihg7m9UqiHW4iJbJ69zumELHE9oBLe'),
              uiTokenAmount: {
                amount: '60000' as StringifiedBigInt,
                decimals: 6,
                uiAmount: 0.06,
                uiAmountString: '0.06' as StringifiedNumber,
              },
            },
          ],
        } as SolanaTransaction['meta'],
      },
    });

    expect(result).toStrictEqual({
      from: [],
      to: [],
    });
  });

  it('should handle empty token balances', () => {
    const result = parseTransactionSplTransfers({
      scope: Network.Devnet,
      transactionData: {
        ...EXPECTED_SEND_USDC_TRANSFER_DATA,
        meta: {
          ...EXPECTED_SEND_USDC_TRANSFER_DATA.meta,
          preTokenBalances: [],
          postTokenBalances: [],
        } as SolanaTransaction['meta'],
      },
    });

    expect(result).toStrictEqual({
      from: [],
      to: [],
    });
  });

  /**
   * TO DISCUSS: Do we want to ignore unknown tokens?
   * Pros: - safer because we avoid SPAM + SCAMS
   * Cons: - more reliability on the token metadata provider
   */
  it('should handle unknown token', () => {
    const result = parseTransactionSplTransfers({
      scope: Network.Devnet,
      transactionData: {
        ...EXPECTED_SEND_USDC_TRANSFER_DATA,
        meta: {
          computeUnitsConsumed: 4644n,
          ...EXPECTED_SEND_USDC_TRANSFER_DATA.meta,
          logMessages: [],
          postBalances: [0n] as Lamports[],
          preBalances: [0n] as Lamports[],
          preTokenBalances: [
            {
              accountIndex: 1,
              mint: asAddress('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
              owner: asAddress('BXT1K8kzYXWMi6ihg7m9UqiHW4iJbJ69zumELHE9oBLe'),
              uiTokenAmount: {
                amount: '60000' as StringifiedBigInt,
                decimals: 6,
                uiAmount: 0.06,
                uiAmountString: '0.06' as StringifiedNumber,
              },
            },
          ],
          postTokenBalances: [
            {
              accountIndex: 1,
              mint: asAddress('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
              owner: asAddress('BXT1K8kzYXWMi6ihg7m9UqiHW4iJbJ69zumELHE9oBLe'),
              uiTokenAmount: {
                amount: '70000' as StringifiedBigInt,
                decimals: 6,
                uiAmount: 0.07,
                uiAmountString: '0.07' as StringifiedNumber,
              },
            },
          ],
        } as SolanaTransaction['meta'],
      },
    });

    expect(result).toStrictEqual({
      from: [],
      to: [],
    });
  });
});
