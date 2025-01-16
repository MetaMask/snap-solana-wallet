import { address as asAddress } from '@solana/web3.js';

import { Network, Networks } from '../../../constants/solana';
import { EXPECTED_NATIVE_SOL_TRANSFER_DATA } from '../../../test/mocks/transactions-data/native-sol-transfer';
import { EXPECTED_SEND_USDC_TRANSFER_DATA } from '../../../test/mocks/transactions-data/send-usdc-transfer';
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
});
