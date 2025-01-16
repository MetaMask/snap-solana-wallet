import type { StringifiedBigInt, StringifiedNumber } from '@solana/web3.js';
import { address as asAddress } from '@solana/web3.js';

import { Network } from '../../../constants/solana';
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
            type: 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1/token:4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
            unit: '',
          },
        },
      ],
      to: [
        {
          address: 'BXT1K8kzYXWMi6ihg7m9UqiHW4iJbJ69zumELHE9oBLe',
          asset: {
            amount: '0.01',
            fungible: true,
            type: 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1/token:4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
            unit: '',
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
});
