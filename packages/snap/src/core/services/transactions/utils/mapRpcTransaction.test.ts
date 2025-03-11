import { address as asAddress } from '@solana/web3.js';

import { Network, Networks } from '../../../constants/solana';
import { EXPECTED_NATIVE_SOL_TRANSFER_DATA } from '../../../test/mocks/transactions-data/native-sol-transfer';
import { EXPECTED_NATIVE_SOL_TRANSFER_TO_SELF_DATA } from '../../../test/mocks/transactions-data/native-sol-transfer-to-self';
import { EXPECTED_SEND_USDC_TRANSFER_DATA } from '../../../test/mocks/transactions-data/send-usdc-transfer';
import { EXPECTED_SEND_USDC_TRANSFER_TO_SELF_DATA } from '../../../test/mocks/transactions-data/send-usdc-transfer-to-self';
import { EXPECTED_SWAP_FAILED_TRANSACTION_DATA } from '../../../test/mocks/transactions-data/swap-failed-transaction';
import { EXPECTED_SWAP_TRANSFER_DATA } from '../../../test/mocks/transactions-data/swap-transfer';
import { mapRpcTransaction } from './mapRpcTransaction';

describe('mapRpcTransaction', () => {
  it('maps native SOL transfers - as a receiver', () => {
    const result = mapRpcTransaction({
      scope: Network.Localnet,
      address: asAddress('FDUGdV6bjhvw5gbirXCvqbTSWK9999kcrZcrHoCQzXJK'),
      transactionData: EXPECTED_NATIVE_SOL_TRANSFER_DATA,
    });

    expect(result).toStrictEqual({
      id: '2qfNzGs15dt999rt1AUJ7D1oPQaukMPPmHR2u5ZmDo4cVtr1Pr2Dax4Jo7ryTpM8jxjtXLi5NHy4uyr68MVh5my6',
      timestamp: 1736500242,
      chain: Network.Localnet,
      status: 'confirmed',
      type: 'receive',
      from: [
        {
          address: 'BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP',
          asset: {
            fungible: true,
            type: Networks[Network.Localnet].nativeToken.caip19Id,
            unit: Networks[Network.Localnet].nativeToken.symbol,
            amount: '0.1',
          },
        },
      ],
      to: [
        {
          address: 'FDUGdV6bjhvw5gbirXCvqbTSWK9999kcrZcrHoCQzXJK',
          asset: {
            fungible: true,
            type: Networks[Network.Localnet].nativeToken.caip19Id,
            unit: Networks[Network.Localnet].nativeToken.symbol,
            amount: '0.1',
          },
        },
      ],
      fees: [
        {
          type: 'base',
          asset: {
            fungible: true,
            type: Networks[Network.Localnet].nativeToken.caip19Id,
            unit: Networks[Network.Localnet].nativeToken.symbol,
            amount: '0.000005',
          },
        },
      ],
      events: [
        {
          status: 'confirmed',
          timestamp: 1736500242,
        },
      ],
    });
  });

  it('maps native SOL transfers - as a sender', () => {
    const result = mapRpcTransaction({
      scope: Network.Localnet,
      address: asAddress('BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP'),
      transactionData: EXPECTED_NATIVE_SOL_TRANSFER_DATA,
    });

    expect(result).toStrictEqual({
      id: '2qfNzGs15dt999rt1AUJ7D1oPQaukMPPmHR2u5ZmDo4cVtr1Pr2Dax4Jo7ryTpM8jxjtXLi5NHy4uyr68MVh5my6',
      timestamp: 1736500242,
      chain: Network.Localnet,
      status: 'confirmed',
      type: 'send',
      from: [
        {
          address: 'BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP',
          asset: {
            fungible: true,
            type: Networks[Network.Localnet].nativeToken.caip19Id,
            unit: Networks[Network.Localnet].nativeToken.symbol,
            amount: '0.1',
          },
        },
      ],
      to: [
        {
          address: 'FDUGdV6bjhvw5gbirXCvqbTSWK9999kcrZcrHoCQzXJK',
          asset: {
            fungible: true,
            type: Networks[Network.Localnet].nativeToken.caip19Id,
            unit: Networks[Network.Localnet].nativeToken.symbol,
            amount: '0.1',
          },
        },
      ],
      fees: [
        {
          type: 'base',
          asset: {
            fungible: true,
            type: Networks[Network.Localnet].nativeToken.caip19Id,
            unit: Networks[Network.Localnet].nativeToken.symbol,
            amount: '0.000005',
          },
        },
      ],
      events: [
        {
          status: 'confirmed',
          timestamp: 1736500242,
        },
      ],
    });
  });

  it('maps native SOL transfers - to self', () => {
    const result = mapRpcTransaction({
      scope: Network.Localnet,
      address: asAddress('BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP'),
      transactionData: EXPECTED_NATIVE_SOL_TRANSFER_TO_SELF_DATA,
    });

    expect(result).toStrictEqual({
      id: '4Ccb8PaSob6JjsyDnoFJfUpJZDJHTwcjnK7MxiyVeMtPSsBGKuaMHEVL1VsXTKWS4w26tAhbc3T78aNELjfN8Zwb',
      timestamp: 1741791493,
      chain: Network.Localnet,
      status: 'confirmed',
      type: 'send',
      from: [
        {
          address: 'BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP',
          asset: {
            fungible: true,
            type: Networks[Network.Localnet].nativeToken.caip19Id,
            unit: Networks[Network.Localnet].nativeToken.symbol,
            amount: '0.1',
          },
        },
      ],
      to: [
        {
          address: 'BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP',
          asset: {
            fungible: true,
            type: Networks[Network.Localnet].nativeToken.caip19Id,
            unit: Networks[Network.Localnet].nativeToken.symbol,
            amount: '0.1',
          },
        },
      ],
      fees: [
        {
          type: 'base',
          asset: {
            fungible: true,
            type: Networks[Network.Localnet].nativeToken.caip19Id,
            unit: Networks[Network.Localnet].nativeToken.symbol,
            amount: '0.000005',
          },
        },
      ],
      events: [
        {
          status: 'confirmed',
          timestamp: 1741791493,
        },
      ],
    });
  });

  it.todo('maps native SOL transfers - failure');

  it('maps SPL token transfers - as a receiver', () => {
    const result = mapRpcTransaction({
      scope: Network.Devnet,
      address: asAddress('BXT1K8kzYXWMi6ihg7m9UqiHW4iJbJ69zumELHE9oBLe'),
      transactionData: EXPECTED_SEND_USDC_TRANSFER_DATA,
    });

    expect(result).toStrictEqual({
      id: '3Zj5XkvE1Uec1frjue6SK2ND2cqhKPvPkZ1ZFPwo2v9iL4NX4b4WWG1wPNEQdnJJU8sVx7MMHjSH1HxoR21vEjoV',
      timestamp: 1736502537,
      chain: Network.Devnet,
      status: 'confirmed',
      type: 'receive',
      from: [
        {
          address: 'BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP',
          asset: {
            fungible: true,
            type: 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1/token:4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
            unit: '',
            amount: '0.01',
          },
        },
      ],
      to: [
        {
          address: 'BXT1K8kzYXWMi6ihg7m9UqiHW4iJbJ69zumELHE9oBLe',
          asset: {
            fungible: true,
            type: 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1/token:4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
            unit: '',
            amount: '0.01',
          },
        },
      ],
      fees: [
        {
          type: 'base',
          asset: {
            fungible: true,
            type: Networks[Network.Devnet].nativeToken.caip19Id,
            unit: Networks[Network.Devnet].nativeToken.symbol,
            amount: '0.000005',
          },
        },
      ],
      events: [
        {
          status: 'confirmed',
          timestamp: 1736502537,
        },
      ],
    });
  });

  it('maps SPL token transfers - as a sender', () => {
    const result = mapRpcTransaction({
      scope: Network.Devnet,
      address: asAddress('BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP'),
      transactionData: EXPECTED_SEND_USDC_TRANSFER_DATA,
    });

    expect(result).toStrictEqual({
      id: '3Zj5XkvE1Uec1frjue6SK2ND2cqhKPvPkZ1ZFPwo2v9iL4NX4b4WWG1wPNEQdnJJU8sVx7MMHjSH1HxoR21vEjoV',
      timestamp: 1736502537,
      chain: Network.Devnet,
      status: 'confirmed',
      type: 'send',
      from: [
        {
          address: 'BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP',
          asset: {
            fungible: true,
            type: 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1/token:4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
            unit: '',
            amount: '0.01',
          },
        },
      ],
      to: [
        {
          address: 'BXT1K8kzYXWMi6ihg7m9UqiHW4iJbJ69zumELHE9oBLe',
          asset: {
            fungible: true,
            type: 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1/token:4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
            unit: '',
            amount: '0.01',
          },
        },
      ],
      fees: [
        {
          type: 'base',
          asset: {
            fungible: true,
            type: Networks[Network.Devnet].nativeToken.caip19Id,
            unit: Networks[Network.Devnet].nativeToken.symbol,
            amount: '0.000005',
          },
        },
      ],
      events: [
        {
          status: 'confirmed',
          timestamp: 1736502537,
        },
      ],
    });
  });

  it('maps SPL token transfers - to self', () => {
    const result = mapRpcTransaction({
      scope: Network.Devnet,
      address: asAddress('BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP'),
      transactionData: EXPECTED_SEND_USDC_TRANSFER_TO_SELF_DATA,
    });

    expect(result).toStrictEqual({
      id: 'fFSAjDzu7CdhzVUUC7DMKf7xuuVn8cZ8njPnpjkTBMHo4Y43SZto2GDuy123yKDoTieihPfDHvBpysE7Eh9aPmH',
      timestamp: 1741796354,
      chain: Network.Devnet,
      status: 'confirmed',
      type: 'send',
      from: [
        {
          address: 'BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP',
          asset: {
            fungible: true,
            type: 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1/token:4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
            unit: '',
            amount: '1',
          },
        },
      ],
      to: [
        {
          address: 'BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP',
          asset: {
            fungible: true,
            type: 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1/token:4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
            unit: '',
            amount: '1',
          },
        },
      ],
      fees: [
        {
          type: 'base',
          asset: {
            fungible: true,
            type: Networks[Network.Devnet].nativeToken.caip19Id,
            unit: Networks[Network.Devnet].nativeToken.symbol,
            amount: '0.000005',
          },
        },
      ],
      events: [
        {
          status: 'confirmed',
          timestamp: 1741796354,
        },
      ],
    });
  });

  it('maps a swap transaction', () => {
    const result = mapRpcTransaction({
      scope: Network.Mainnet,
      address: asAddress('DtMUkCoeyzs35B6EpQQxPyyog6TRwXxV1W1Acp8nWBNa'),
      transactionData: EXPECTED_SWAP_TRANSFER_DATA,
    });

    /**
     * Mainnet - Swap
     * Transaction: 2pfnv4drhnitfzCFKxiRoJMzFQpG7wZ9mpRQVk7xm5TQ27g6FZH95HVF6KgwQBS872yGtyhuq57jXXS1y29ub11
     *
     * Fee Payer:
     * DtMUkCoeyzs35B6EpQQxPyyog6TRwXxV1W1Acp8nWBNa pays 0.000074798 SOL
     *
     * Senders:
     * 8kR2HTHzPtTJuzpFZ8jtGCQ9TpahPaWbZfTNRs2GJdxq sends 0.000073111 SOL - OK
     * DtMUkCoeyzs35B6EpQQxPyyog6TRwXxV1W1Acp8nWBNa sends 0.01 USDC - OK
     * HUCjBnmd4FoUjCCMYQ9xFz1ce1r8vWAd8uMhUQakE2FR sends 2583.728601 Cobie - OK
     * 3msVd34R5KxonDzyNSV5nT19UtUeJ2RF1NaQhvVPNLxL sends 0.000073111 WSOL - OK
     *
     * Receivers:
     * CebN5WGQ4jvEPvsVU4EoHEpgzq1VV7AbicfhtW4xC9iM gets 0.000000723 SOL - OK
     * HUCjBnmd4FoUjCCMYQ9xFz1ce1r8vWAd8uMhUQakE2FR gets 0.00007238 SOL - OK
     * DtMUkCoeyzs35B6EpQQxPyyog6TRwXxV1W1Acp8nWBNa gets 2583.728601 Cobie - OK
     * 3msVd34R5KxonDzyNSV5nT19UtUeJ2RF1NaQhvVPNLxL gets 0.01 USDC - OK
     */
    expect(result).toStrictEqual({
      id: '2pfnv4drhnitfzCFKxiRoJMzFQpG7wZ9mpRQVk7xm5TQ27g6FZH95HVF6KgwQBS872yGtyhuq57jXXS1y29ub11',
      timestamp: 1740480781,
      chain: Network.Mainnet,
      status: 'confirmed',
      type: 'swap',
      from: [
        {
          address: '8kR2HTHzPtTJuzpFZ8jtGCQ9TpahPaWbZfTNRs2GJdxq',
          asset: {
            fungible: true,
            type: Networks[Network.Mainnet].nativeToken.caip19Id,
            unit: Networks[Network.Mainnet].nativeToken.symbol,
            amount: '0.000073111',
          },
        },
        {
          address: 'DtMUkCoeyzs35B6EpQQxPyyog6TRwXxV1W1Acp8nWBNa',
          asset: {
            fungible: true,
            type: `${Network.Mainnet}/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`,
            unit: '',
            amount: '0.01',
          },
        },
        {
          address: 'HUCjBnmd4FoUjCCMYQ9xFz1ce1r8vWAd8uMhUQakE2FR',
          asset: {
            fungible: true,
            type: `${Network.Mainnet}/token:HaMv3cdfDW6357yjpDur6kb6w52BUPJrMJpR76tjpump`,
            unit: '',
            amount: '2583.728601',
          },
        },
        {
          address: '3msVd34R5KxonDzyNSV5nT19UtUeJ2RF1NaQhvVPNLxL',
          asset: {
            fungible: true,
            type: `${Network.Mainnet}/token:So11111111111111111111111111111111111111112`,
            unit: '',
            amount: '0.000073111',
          },
        },
      ],
      to: [
        {
          address: 'CebN5WGQ4jvEPvsVU4EoHEpgzq1VV7AbicfhtW4xC9iM',
          asset: {
            fungible: true,
            type: Networks[Network.Mainnet].nativeToken.caip19Id,
            unit: Networks[Network.Mainnet].nativeToken.symbol,
            amount: '0.000000723',
          },
        },
        {
          address: 'HUCjBnmd4FoUjCCMYQ9xFz1ce1r8vWAd8uMhUQakE2FR',
          asset: {
            fungible: true,
            type: Networks[Network.Mainnet].nativeToken.caip19Id,
            unit: Networks[Network.Mainnet].nativeToken.symbol,
            amount: '0.00007238',
          },
        },
        {
          address: 'DtMUkCoeyzs35B6EpQQxPyyog6TRwXxV1W1Acp8nWBNa',
          asset: {
            fungible: true,
            type: `${Network.Mainnet}/token:HaMv3cdfDW6357yjpDur6kb6w52BUPJrMJpR76tjpump`,
            unit: '',
            amount: '2583.728601',
          },
        },
        {
          address: '3msVd34R5KxonDzyNSV5nT19UtUeJ2RF1NaQhvVPNLxL',
          asset: {
            fungible: true,
            type: `${Network.Mainnet}/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`,
            unit: '',
            amount: '0.01',
          },
        },
      ],
      fees: [
        {
          type: 'base',
          asset: {
            fungible: true,
            type: Networks[Network.Mainnet].nativeToken.caip19Id,
            unit: Networks[Network.Mainnet].nativeToken.symbol,
            amount: '0.000005',
          },
        },
        {
          type: 'priority',
          asset: {
            fungible: true,
            type: Networks[Network.Mainnet].nativeToken.caip19Id,
            unit: Networks[Network.Mainnet].nativeToken.symbol,
            amount: '0.000069798',
          },
        },
      ],
      events: [{ status: 'confirmed', timestamp: 1740480781 }],
    });
  });

  it('maps a failed swap transaction', () => {
    const result = mapRpcTransaction({
      scope: Network.Mainnet,
      address: asAddress('DtMUkCoeyzs35B6EpQQxPyyog6TRwXxV1W1Acp8nWBNa'),
      transactionData: EXPECTED_SWAP_FAILED_TRANSACTION_DATA,
    });

    expect(result).toStrictEqual({
      id: '58FymkjJUeSFGeEdaUQZbhHP5tdwwvbRR8BfKfuEgfYznqDqsApRBk8LCtiKny9EjQZBNi5NxGvLjR6F3gY6rxn1',
      timestamp: 1741949141,
      chain: Network.Mainnet,
      status: 'failed',
      type: 'receive',
      from: [
        {
          address: '9az5xpAV8KJ2Q2Jb1ZvBpvfUa5Cj4dZirbgvfPF5XsB8',
          asset: {
            amount: '0.000000006',
            fungible: true,
            type: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
            unit: 'SOL',
          },
        },
      ],
      to: [],
      fees: [
        {
          type: 'base',
          asset: {
            fungible: true,
            type: Networks[Network.Mainnet].nativeToken.caip19Id,
            unit: Networks[Network.Mainnet].nativeToken.symbol,
            amount: '0.000005',
          },
        },
        {
          type: 'priority',
          asset: {
            fungible: true,
            type: Networks[Network.Mainnet].nativeToken.caip19Id,
            unit: Networks[Network.Mainnet].nativeToken.symbol,
            amount: '0.000000146',
          },
        },
      ],
      events: [{ status: 'failed', timestamp: 1741949141 }],
    });
  });

  it('returns a failed transaction if the transaction has an error', () => {
    const result = mapRpcTransaction({
      scope: Network.Localnet,
      address: asAddress('BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP'),
      transactionData: {
        ...EXPECTED_NATIVE_SOL_TRANSFER_DATA,
        meta: {
          ...EXPECTED_NATIVE_SOL_TRANSFER_DATA.meta,
          // eslint-disable-next-line id-denylist
          err: {
            DuplicateInstruction: 1,
          },
          status: {
            Err: {
              DuplicateInstruction: 1,
            },
          },
        },
      },
    });

    expect(result).toStrictEqual({
      id: '2qfNzGs15dt999rt1AUJ7D1oPQaukMPPmHR2u5ZmDo4cVtr1Pr2Dax4Jo7ryTpM8jxjtXLi5NHy4uyr68MVh5my6',
      timestamp: 1736500242,
      chain: Network.Localnet,
      status: 'failed',
      type: 'send',
      from: [
        {
          address: 'BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP',
          asset: {
            fungible: true,
            type: Networks[Network.Localnet].nativeToken.caip19Id,
            unit: Networks[Network.Localnet].nativeToken.symbol,
            amount: '0.1',
          },
        },
      ],
      to: [
        {
          address: 'FDUGdV6bjhvw5gbirXCvqbTSWK9999kcrZcrHoCQzXJK',
          asset: {
            fungible: true,
            type: Networks[Network.Localnet].nativeToken.caip19Id,
            unit: Networks[Network.Localnet].nativeToken.symbol,
            amount: '0.1',
          },
        },
      ],
      fees: [
        {
          type: 'base',
          asset: {
            fungible: true,
            type: Networks[Network.Localnet].nativeToken.caip19Id,
            unit: Networks[Network.Localnet].nativeToken.symbol,
            amount: '0.000005',
          },
        },
      ],
      events: [
        {
          status: 'failed',
          timestamp: 1736500242,
        },
      ],
    });
  });

  it('returns null if there is no transaction data', () => {
    const result = mapRpcTransaction({
      scope: Network.Localnet,
      address: asAddress('BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP'),
      transactionData: null,
    });

    expect(result).toBeNull();
  });

  it('returns null if the transaction has no signatures', () => {
    const result = mapRpcTransaction({
      scope: Network.Localnet,
      address: asAddress('BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP'),
      transactionData: {
        ...EXPECTED_NATIVE_SOL_TRANSFER_DATA,
        transaction: {
          ...EXPECTED_NATIVE_SOL_TRANSFER_DATA.transaction,
          signatures: [],
        },
      },
    });

    expect(result).toBeNull();
  });
});
