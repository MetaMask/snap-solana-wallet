import { address as asAddress } from '@solana/web3.js';

import { Network, Networks } from '../../../constants/solana';
import { EXPECTED_NATIVE_SOL_TRANSFER_DATA } from '../../../test/mocks/transactions-data/native-sol-transfer';
import { EXPECTED_SEND_USDC_TRANSFER_DATA } from '../../../test/mocks/transactions-data/send-usdc-transfer';
import { EXPECTED_SWAP_TRANSFER_DATA } from '../../../test/mocks/transactions-data/swap-transfer';
import { mapRpcTransaction } from './mapRpcTransaction';

describe('mapRpcTransaction', () => {
  it('should map native SOL transfers - as a receiver', () => {
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

  it('should map native SOL transfers - as a sender', () => {
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

  it('should map SPL token transfers - as a receiver', () => {
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

  it('should map SPL token transfers - as a sender', () => {
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

  it('should return null if there is no transaction data', () => {
    const result = mapRpcTransaction({
      scope: Network.Localnet,
      address: asAddress('BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP'),
      transactionData: null,
    });

    expect(result).toBeNull();
  });

  it('should return null if the transaction has no signatures', () => {
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

  it('maps a swap transaction', () => {
    const result = mapRpcTransaction({
      scope: Network.Localnet,
      address: asAddress('DtMUkCoeyzs35B6EpQQxPyyog6TRwXxV1W1Acp8nWBNa'),
      transactionData: EXPECTED_SWAP_TRANSFER_DATA,
    });

    /**
     * Mainnet - Swap
     * Transaction: 2pfnv4drhnitfzCFKxiRoJMzFQpG7wZ9mpRQVk7xm5TQ27g6FZH95HVF6KgwQBS872yGtyhuq57jXXS1y29ub11
     *
     * Senders:
     * TODO: Investigate why we are getting 0.000000008 SOL back
     * Theory is that we paid an "estimated fee" and the blockchain returned the difference.
     * 8kR2HTHzPtTJuzpFZ8jtGCQ9TpahPaWbZfTNRs2GJdxq sends 0.000073111 SOL (0.000073111 - 0.000074798 = 0.000000008 SOL) - MISSING
     * DtMUkCoeyzs35B6EpQQxPyyog6TRwXxV1W1Acp8nWBNa sends 0.01 USDC - OK
     * HUCjBnmd4FoUjCCMYQ9xFz1ce1r8vWAd8uMhUQakE2FR sends 2583.728601 Cobie - OK
     * 3msVd34R5KxonDzyNSV5nT19UtUeJ2RF1NaQhvVPNLxL sends 0.000073111 WSOL - OK
     *
     * Receivers:
     * DtMUkCoeyzs35B6EpQQxPyyog6TRwXxV1W1Acp8nWBNa gets 0.000000008 SOL - MISSING
     * CebN5WGQ4jvEPvsVU4EoHEpgzq1VV7AbicfhtW4xC9iM gets 0.000000723 SOL - OK
     * HUCjBnmd4FoUjCCMYQ9xFz1ce1r8vWAd8uMhUQakE2FR gets 0.00007238 SOL - OK
     * DtMUkCoeyzs35B6EpQQxPyyog6TRwXxV1W1Acp8nWBNa gets 2583.728601 Cobie - OK
     * 3msVd34R5KxonDzyNSV5nT19UtUeJ2RF1NaQhvVPNLxL gets 0.01 USDC - OK
     */
    expect(result).toStrictEqual({
      id: '2pfnv4drhnitfzCFKxiRoJMzFQpG7wZ9mpRQVk7xm5TQ27g6FZH95HVF6KgwQBS872yGtyhuq57jXXS1y29ub11',
      timestamp: 1740480781,
      chain: 'solana:123456789abcdef',
      status: 'confirmed',
      type: 'swap',
      from: [
        {
          address: '8kR2HTHzPtTJuzpFZ8jtGCQ9TpahPaWbZfTNRs2GJdxq',
          asset: {
            fungible: true,
            type: 'solana:123456789abcdef/slip44:501',
            unit: 'SOL',
            amount: '0.000073111',
          },
        },
        {
          address: 'DtMUkCoeyzs35B6EpQQxPyyog6TRwXxV1W1Acp8nWBNa',
          asset: {
            fungible: true,
            type: 'solana:123456789abcdef/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
            unit: '',
            amount: '0.01',
          },
        },
        {
          address: 'HUCjBnmd4FoUjCCMYQ9xFz1ce1r8vWAd8uMhUQakE2FR',
          asset: {
            fungible: true,
            type: 'solana:123456789abcdef/token:HaMv3cdfDW6357yjpDur6kb6w52BUPJrMJpR76tjpump',
            unit: '',
            amount: '2583.728601',
          },
        },
        {
          address: '3msVd34R5KxonDzyNSV5nT19UtUeJ2RF1NaQhvVPNLxL',
          asset: {
            fungible: true,
            type: 'solana:123456789abcdef/token:So11111111111111111111111111111111111111112',
            unit: '',
            amount: '0.000073111',
          },
        },
      ],
      to: [
        {
          address: 'DtMUkCoeyzs35B6EpQQxPyyog6TRwXxV1W1Acp8nWBNa',
          asset: {
            fungible: true,
            type: 'solana:123456789abcdef/slip44:501',
            unit: 'SOL',
            amount: '8e-9',
          },
        },
        {
          address: 'CebN5WGQ4jvEPvsVU4EoHEpgzq1VV7AbicfhtW4xC9iM',
          asset: {
            fungible: true,
            type: 'solana:123456789abcdef/slip44:501',
            unit: 'SOL',
            amount: '7.23e-7',
          },
        },
        {
          address: 'HUCjBnmd4FoUjCCMYQ9xFz1ce1r8vWAd8uMhUQakE2FR',
          asset: {
            fungible: true,
            type: 'solana:123456789abcdef/slip44:501',
            unit: 'SOL',
            amount: '0.00007238',
          },
        },
        {
          address: 'DtMUkCoeyzs35B6EpQQxPyyog6TRwXxV1W1Acp8nWBNa',
          asset: {
            fungible: true,
            type: 'solana:123456789abcdef/token:HaMv3cdfDW6357yjpDur6kb6w52BUPJrMJpR76tjpump',
            unit: '',
            amount: '2583.728601',
          },
        },
        {
          address: '3msVd34R5KxonDzyNSV5nT19UtUeJ2RF1NaQhvVPNLxL',
          asset: {
            fungible: true,
            type: 'solana:123456789abcdef/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
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
            type: 'solana:123456789abcdef/slip44:501',
            unit: 'SOL',
            amount: '0.000074798',
          },
        },
      ],
      events: [{ status: 'confirmed', timestamp: 1740480781 }],
    });
  });
});
