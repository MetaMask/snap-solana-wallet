import type { CaipAssetType } from '@metamask/keyring-api';

import type { PriceApiClient } from '../../clients/price-api/PriceApiClient';
import { KnownCaip19Id } from '../../constants/solana';
import { TokenPrices } from './TokenPrices';

describe('TokenPricesService', () => {
  describe('getMultipleTokenPrices', () => {
    let tokenPricesService: TokenPrices;
    let mockPriceApiClient: PriceApiClient;
    const currency = 'usd';

    beforeEach(() => {
      mockPriceApiClient = {
        getMultipleSpotPrices: jest.fn().mockResolvedValue({
          [KnownCaip19Id.SolMainnet]: { price: 1.23 },
          [KnownCaip19Id.UsdcLocalnet]: { price: 1.23 },
        }),
      } as unknown as PriceApiClient;

      tokenPricesService = new TokenPrices(mockPriceApiClient);
    });

    it('returns the correct token prices', async () => {
      const caip19Ids: CaipAssetType[] = [
        KnownCaip19Id.SolMainnet,
        KnownCaip19Id.UsdcLocalnet,
      ];
      const expectedPrices = {
        [KnownCaip19Id.SolMainnet]: { price: 1.23 },
        [KnownCaip19Id.UsdcLocalnet]: { price: 1.23 },
      };

      const prices = await tokenPricesService.getMultipleTokenPrices(
        caip19Ids,
        currency,
      );

      expect(prices).toStrictEqual(expectedPrices);
    });

    it('returns the correct token prices when using a different currency', async () => {
      const caip19Ids: CaipAssetType[] = [
        KnownCaip19Id.SolMainnet,
        KnownCaip19Id.UsdcLocalnet,
      ];
      const expectedPrices = {
        [KnownCaip19Id.SolMainnet]: { price: 1.23 },
        [KnownCaip19Id.UsdcLocalnet]: { price: 1.23 },
      };

      const prices = await tokenPricesService.getMultipleTokenPrices(
        caip19Ids,
        'eur',
      );

      expect(prices).toStrictEqual(expectedPrices);
    });

    it('returns an empty object if no caip19Ids are provided', async () => {
      const caip19Ids: CaipAssetType[] = [];

      const prices = await tokenPricesService.getMultipleTokenPrices(
        caip19Ids,
        currency,
      );
      expect(prices).toStrictEqual({});
    });
  });

  describe('getMultipleTokenConversions', () => {
    let tokenPricesService: TokenPrices;
    let mockPriceApiClient: PriceApiClient;
    const currency = 'usd';

    beforeEach(() => {
      mockPriceApiClient = {
        getMultipleSpotPrices: jest.fn().mockResolvedValue({
          [KnownCaip19Id.SolLocalnet]: { price: 1.23 },
          [KnownCaip19Id.UsdcLocalnet]: { price: 1.23 },
        }),
      } as unknown as PriceApiClient;

      tokenPricesService = new TokenPrices(mockPriceApiClient);
    });

    it('returns the correct token conversions', async () => {
      const conversions: { from: CaipAssetType; to: CaipAssetType }[] = [
        { from: KnownCaip19Id.SolLocalnet, to: 'swift:0/iso4217:EUR' },
        { from: KnownCaip19Id.UsdcLocalnet, to: 'swift:0/iso4217:EUR' },
      ];

      const result = await tokenPricesService.getMultipleTokenConversions(
        conversions,
      );

      expect(result).toStrictEqual({
        [KnownCaip19Id.SolLocalnet]: {
          'swift:0/iso4217:EUR': {
            rate: '1.23',
            conversionTime: expect.any(Number),
          },
        },
        [KnownCaip19Id.UsdcLocalnet]: {
          'swift:0/iso4217:EUR': {
            rate: '1.23',
            conversionTime: expect.any(Number),
          },
        },
      });
    });
  });
});
