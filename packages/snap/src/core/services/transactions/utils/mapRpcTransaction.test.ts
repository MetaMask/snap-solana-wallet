import { address as asAddress } from '@solana/kit';

import { Network, Networks } from '../../../constants/solana';
import { EXPECTED_NATIVE_SOL_TRANSFER_DATA } from '../../../test/mocks/transactions-data/native-sol-transfer';
import { EXPECTED_NATIVE_SOL_TRANSFER_TO_SELF_DATA } from '../../../test/mocks/transactions-data/native-sol-transfer-to-self';
import { EXPECTED_SEND_JUP_TRANSFER_CHECKED_DATA } from '../../../test/mocks/transactions-data/send-jup-transfer-checked-to-self';
import { EXPECTED_SEND_USDC_TRANSFER_DATA } from '../../../test/mocks/transactions-data/send-usdc-transfer';
import { EXPECTED_SEND_USDC_TRANSFER_TO_SELF_DATA } from '../../../test/mocks/transactions-data/send-usdc-transfer-to-self';
import { EXPECTED_SWAP_USDC_TO_COBIE_DATA } from '../../../test/mocks/transactions-data/swap-usdc-to-cobie';
import { EXPECTED_SWAP_USDC_TO_JUP_DATA } from '../../../test/mocks/transactions-data/swap-usdc-to-jup';
import { mapRpcTransaction } from './mapRpcTransaction';

describe('mapRpcTransaction', () => {
  it('maps native SOL transfers - as a sender', () => {
    const result = mapRpcTransaction({
      scope: Network.Localnet,
      address: asAddress('BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP'),
      transactionData: EXPECTED_NATIVE_SOL_TRANSFER_DATA,
    });

    expect(result).toStrictEqual({
      id: '2qfNzGs15dt999rt1AUJ7D1oPQaukMPPmHR2u5ZmDo4cVtr1Pr2Dax4Jo7ryTpM8jxjtXLi5NHy4uyr68MVh5my6',
      account: 'BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP',
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

  it('maps native SOL transfers - as a sender to self', () => {
    const result = mapRpcTransaction({
      scope: Network.Localnet,
      address: asAddress('BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP'),
      transactionData: EXPECTED_NATIVE_SOL_TRANSFER_TO_SELF_DATA,
    });

    expect(result).toStrictEqual({
      id: '4Ccb8PaSob6JjsyDnoFJfUpJZDJHTwcjnK7MxiyVeMtPSsBGKuaMHEVL1VsXTKWS4w26tAhbc3T78aNELjfN8Zwb',
      account: 'BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP',
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

  it('maps native SOL transfers - as a receiver', () => {
    const result = mapRpcTransaction({
      scope: Network.Localnet,
      address: asAddress('FDUGdV6bjhvw5gbirXCvqbTSWK9999kcrZcrHoCQzXJK'),
      transactionData: EXPECTED_NATIVE_SOL_TRANSFER_DATA,
    });

    expect(result).toStrictEqual({
      id: '2qfNzGs15dt999rt1AUJ7D1oPQaukMPPmHR2u5ZmDo4cVtr1Pr2Dax4Jo7ryTpM8jxjtXLi5NHy4uyr68MVh5my6',
      account: 'FDUGdV6bjhvw5gbirXCvqbTSWK9999kcrZcrHoCQzXJK',
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
      fees: [],
      events: [
        {
          status: 'confirmed',
          timestamp: 1736500242,
        },
      ],
    });
  });

  it('maps native SOL transfers - failure', () => {
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
      account: 'BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP',
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

  it('maps SPL token transfers - as a sender', () => {
    const result = mapRpcTransaction({
      scope: Network.Devnet,
      address: asAddress('BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP'),
      transactionData: EXPECTED_SEND_USDC_TRANSFER_DATA,
    });

    expect(result).toStrictEqual({
      id: '3Zj5XkvE1Uec1frjue6SK2ND2cqhKPvPkZ1ZFPwo2v9iL4NX4b4WWG1wPNEQdnJJU8sVx7MMHjSH1HxoR21vEjoV',
      account: 'BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP',
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

  it('maps SPL token transfers - as a sender to self', () => {
    const result = mapRpcTransaction({
      scope: Network.Devnet,
      address: asAddress('BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP'),
      transactionData: EXPECTED_SEND_USDC_TRANSFER_TO_SELF_DATA,
    });

    expect(result).toStrictEqual({
      id: 'fFSAjDzu7CdhzVUUC7DMKf7xuuVn8cZ8njPnpjkTBMHo4Y43SZto2GDuy123yKDoTieihPfDHvBpysE7Eh9aPmH',
      account: 'BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP',
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

  it('maps SPL token transfers - as a receiver', () => {
    const result = mapRpcTransaction({
      scope: Network.Devnet,
      address: asAddress('BXT1K8kzYXWMi6ihg7m9UqiHW4iJbJ69zumELHE9oBLe'),
      transactionData: EXPECTED_SEND_USDC_TRANSFER_DATA,
    });

    expect(result).toStrictEqual({
      id: '3Zj5XkvE1Uec1frjue6SK2ND2cqhKPvPkZ1ZFPwo2v9iL4NX4b4WWG1wPNEQdnJJU8sVx7MMHjSH1HxoR21vEjoV',
      account: 'BXT1K8kzYXWMi6ihg7m9UqiHW4iJbJ69zumELHE9oBLe',
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
      fees: [],
      events: [
        {
          status: 'confirmed',
          timestamp: 1736502537,
        },
      ],
    });
  });

  it('maps SPL token transfers - using TransferChecked', () => {
    const result = mapRpcTransaction({
      scope: Network.Mainnet,
      address: asAddress('DtMUkCoeyzs35B6EpQQxPyyog6TRwXxV1W1Acp8nWBNa'),
      transactionData: EXPECTED_SEND_JUP_TRANSFER_CHECKED_DATA,
    });

    expect(result).toStrictEqual({
      id: '4zvFGpqjihSXgHdw6ymHA8hVfyHURNPwASz4FS4c9wADCMSooojx8k42EUuhoDiGGM73SixUcNXafgnuM5dnKHfH',
      account: 'DtMUkCoeyzs35B6EpQQxPyyog6TRwXxV1W1Acp8nWBNa',
      timestamp: 1742387710,
      chain: Network.Mainnet,
      status: 'confirmed',
      type: 'send',
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
      fees: [
        {
          type: 'base',
          asset: {
            fungible: true,
            type: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
            unit: 'SOL',
            amount: '0.000005',
          },
        },
        {
          type: 'priority',
          asset: {
            fungible: true,
            type: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
            unit: 'SOL',
            amount: '0.000075001',
          },
        },
      ],
      events: [{ status: 'confirmed', timestamp: 1742387710 }],
    });
  });

  it.todo('maps SPL token transfers - failure');

  it('maps swaps - #1 USDC -> Cobie', () => {
    const result = mapRpcTransaction({
      scope: Network.Mainnet,
      address: asAddress('DtMUkCoeyzs35B6EpQQxPyyog6TRwXxV1W1Acp8nWBNa'),
      transactionData: EXPECTED_SWAP_USDC_TO_COBIE_DATA,
    });

    /**
     * Mainnet - Swap
     * Transaction: 2pfnv4drhnitfzCFKxiRoJMzFQpG7wZ9mpRQVk7xm5TQ27g6FZH95HVF6KgwQBS872yGtyhuq57jXXS1y29ub11
     *
     * Fee Payer:
     * DtMUkCoeyzs35B6EpQQxPyyog6TRwXxV1W1Acp8nWBNa pays 0.000074798 SOL
     *
     * Senders:
     * DtMUkCoeyzs35B6EpQQxPyyog6TRwXxV1W1Acp8nWBNa sends 0.01 USDC
     *
     * Receivers:
     * DtMUkCoeyzs35B6EpQQxPyyog6TRwXxV1W1Acp8nWBNa gets 2583.728601 Cobie
     */
    expect(result).toStrictEqual({
      id: '2pfnv4drhnitfzCFKxiRoJMzFQpG7wZ9mpRQVk7xm5TQ27g6FZH95HVF6KgwQBS872yGtyhuq57jXXS1y29ub11',
      account: 'DtMUkCoeyzs35B6EpQQxPyyog6TRwXxV1W1Acp8nWBNa',
      timestamp: 1740480781,
      chain: Network.Mainnet,
      status: 'confirmed',
      type: 'swap',
      from: [
        {
          address: 'DtMUkCoeyzs35B6EpQQxPyyog6TRwXxV1W1Acp8nWBNa',
          asset: {
            fungible: true,
            type: `${Network.Mainnet}/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`,
            unit: '',
            amount: '0.01',
          },
        },
      ],
      to: [
        {
          address: 'DtMUkCoeyzs35B6EpQQxPyyog6TRwXxV1W1Acp8nWBNa',
          asset: {
            fungible: true,
            type: `${Network.Mainnet}/token:HaMv3cdfDW6357yjpDur6kb6w52BUPJrMJpR76tjpump`,
            unit: '',
            amount: '2583.728601',
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

  it('maps swaps - #2 USDC -> JUP', () => {
    const result = mapRpcTransaction({
      scope: Network.Mainnet,
      address: asAddress('DtMUkCoeyzs35B6EpQQxPyyog6TRwXxV1W1Acp8nWBNa'),
      transactionData: EXPECTED_SWAP_USDC_TO_JUP_DATA,
    });

    /**
     * Mainnet - Swap
     * Transaction: 5LuTa5k9UvgM2eJknVUD9MjfcmcTP7nvFrCedU8d7ZLXCHbrrwqhXDQYTSfncm1wTSNFPZj3Y4cRkWC8CLG6Zcvh
     *
     * Fee Payer:
     * DtMUkCoeyzs35B6EpQQxPyyog6TRwXxV1W1Acp8nWBNa pays 0.00008 SOL
     *
     * Senders:
     * DtMUkCoeyzs35B6EpQQxPyyog6TRwXxV1W1Acp8nWBNa sends 1.1 USDC
     *
     * Receivers:
     * DtMUkCoeyzs35B6EpQQxPyyog6TRwXxV1W1Acp8nWBNa gets 2.143812 JUP
     */
    expect(result).toStrictEqual({
      id: '5LuTa5k9UvgM2eJknVUD9MjfcmcTP7nvFrCedU8d7ZLXCHbrrwqhXDQYTSfncm1wTSNFPZj3Y4cRkWC8CLG6Zcvh',
      account: 'DtMUkCoeyzs35B6EpQQxPyyog6TRwXxV1W1Acp8nWBNa',
      timestamp: 1742297902,
      chain: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
      status: 'confirmed',
      type: 'swap',
      from: [
        {
          address: 'DtMUkCoeyzs35B6EpQQxPyyog6TRwXxV1W1Acp8nWBNa',
          asset: {
            fungible: true,
            type: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
            unit: '',
            amount: '1.1',
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
            amount: '2.143812',
          },
        },
      ],
      fees: [
        {
          type: 'base',
          asset: {
            fungible: true,
            type: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
            unit: 'SOL',
            amount: '0.000005',
          },
        },
        {
          type: 'priority',
          asset: {
            fungible: true,
            type: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
            unit: 'SOL',
            amount: '0.000075001',
          },
        },
      ],
      events: [{ status: 'confirmed', timestamp: 1742297902 }],
    });
  });

  it.todo('maps swaps - failure');

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
