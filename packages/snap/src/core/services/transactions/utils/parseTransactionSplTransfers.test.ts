import { Network } from '../../../constants/solana';
import type { SolanaTransaction } from '../../../domain';
import { EXPECTED_SEND_JUP_TRANSFER_CHECKED_DATA } from '../../../test/mocks/transactions-data/send-jup-transfer-checked-to-self';
import { EXPECTED_SEND_USDC_TRANSFER_DATA } from '../../../test/mocks/transactions-data/send-usdc-transfer';
import { EXPECTED_SEND_USDC_TRANSFER_TO_SELF_DATA } from '../../../test/mocks/transactions-data/send-usdc-transfer-to-self';
import { parseTransactionSplTransfers } from './parseTransactionSplTransfers';

describe('parseTransactionSplTransfers', () => {
  it('parses SPL token transfers', () => {
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

  it(`parses SPL token transfers to self`, () => {
    const result = parseTransactionSplTransfers({
      scope: Network.Devnet,
      transactionData: EXPECTED_SEND_USDC_TRANSFER_TO_SELF_DATA,
    });

    expect(result).toStrictEqual({
      from: [
        {
          address: 'BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP',
          asset: {
            amount: '1',
            fungible: true,
            type: 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1/token:4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
            unit: '',
          },
        },
      ],
      to: [
        {
          address: 'BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP',
          asset: {
            amount: '1',
            fungible: true,
            type: 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1/token:4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
            unit: '',
          },
        },
      ],
    });
  });

  it('parses SPL token transfers - using TransferChecked', () => {
    const result = parseTransactionSplTransfers({
      scope: Network.Mainnet,
      transactionData: EXPECTED_SEND_JUP_TRANSFER_CHECKED_DATA,
    });

    expect(result).toStrictEqual({
      from: [
        {
          address: 'DtMUkCoeyzs35B6EpQQxPyyog6TRwXxV1W1Acp8nWBNa',
          asset: {
            fungible: true,
            type: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
            unit: '',
            amount: '1',
          },
        },
      ],
      to: [
        {
          address: 'DtMUkCoeyzs35B6EpQQxPyyog6TRwXxV1W1Acp8nWBNa',
          asset: {
            fungible: true,
            type: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
            unit: '',
            amount: '1',
          },
        },
      ],
    });
  });

  it('parses empty token balances', () => {
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
