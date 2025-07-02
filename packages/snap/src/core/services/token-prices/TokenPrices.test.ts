/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { MOCK_HISTORICAL_PRICES } from '../../clients/price-api/mocks/historical-prices';
import { MOCK_SPOT_PRICES } from '../../clients/price-api/mocks/spot-prices';
import type { PriceApiClient } from '../../clients/price-api/PriceApiClient';
import type { SpotPrice } from '../../clients/price-api/types';
import { MOCK_EXCHANGE_RATES } from '../../test/mocks/price-api/exchange-rates';
import { TokenPricesService } from './TokenPrices';

describe('TokenPricesService', () => {
  /* Crypto */
  const BTC = 'bip122:000000000019d6689c085ae165831e93/slip44:0';
  const ETH = 'eip155:1/slip44:60';
  const SOL = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501';
  const USDC = 'eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';

  /* Fiat */
  const EUR = 'swift:0/iso4217:EUR';
  const USD = 'swift:0/iso4217:USD';
  const BZR = 'swift:0/iso4217:BRL';

  const UNKNOWN_CRYPTO_1 = 'unknown:1/slip44:1';
  const UNKNOWN_CRYPTO_2 = 'unknown:2/slip44:2';
  const UNKNOWN_FIAT_1 = 'swift:0/iso4217:AAA';
  const UNKNOWN_FIAT_2 = 'swift:0/iso4217:ZZZ';

  let tokenPricesService: TokenPricesService;
  let mockPriceApiClient: PriceApiClient;

  beforeEach(() => {
    mockPriceApiClient = {
      getFiatExchangeRates: jest.fn().mockResolvedValue(MOCK_EXCHANGE_RATES),
      getMultipleSpotPrices: jest.fn().mockResolvedValue(MOCK_SPOT_PRICES),
      getHistoricalPrices: jest.fn().mockResolvedValue(MOCK_HISTORICAL_PRICES),
    } as unknown as PriceApiClient;

    tokenPricesService = new TokenPricesService(mockPriceApiClient);
  });

  describe('getMultipleTokenConversions', () => {
    it('returns empty object when no conversions provided', async () => {
      const result = await tokenPricesService.getMultipleTokenConversions([]);
      expect(result).toStrictEqual({});
    });

    describe('when includeMarketData is false', () => {
      it('handles fiat to fiat conversions', async () => {
        const result = await tokenPricesService.getMultipleTokenConversions([
          /* Same currency */
          { from: USD, to: USD },
          { from: EUR, to: EUR },
          /* Different currency */
          { from: EUR, to: USD },
          { from: USD, to: BZR },
          { from: EUR, to: BZR },
        ]);

        expect(result).toStrictEqual(
          expect.objectContaining({
            [USD]: expect.objectContaining({
              [USD]: {
                rate: '1',
                conversionTime: expect.any(Number),
                expirationTime: expect.any(Number),
              },
              [BZR]: {
                rate: '5.44630000241062899996',
                conversionTime: expect.any(Number),
                expirationTime: expect.any(Number),
              },
            }),
            [EUR]: expect.objectContaining({
              [EUR]: {
                rate: '1',
                conversionTime: expect.any(Number),
                expirationTime: expect.any(Number),
              },
              [USD]: {
                rate: '1.17696630204744878672',
                conversionTime: expect.any(Number),
                expirationTime: expect.any(Number),
              },
              [BZR]: {
                rate: '6.41011157367824942681',
                conversionTime: expect.any(Number),
                expirationTime: expect.any(Number),
              },
            }),
          }),
        );
      });

      it('handles crypto to crypto conversions', async () => {
        const result = await tokenPricesService.getMultipleTokenConversions([
          /* Same currency */
          { from: BTC, to: BTC },
          { from: ETH, to: ETH },
          /* Different currency */
          { from: BTC, to: ETH },
          { from: ETH, to: SOL },
          { from: SOL, to: USDC },
        ]);

        expect(result).toStrictEqual(
          expect.objectContaining({
            [BTC]: expect.objectContaining({
              [BTC]: {
                rate: '1',
                conversionTime: expect.any(Number),
                expirationTime: expect.any(Number),
              },
              [ETH]: {
                rate: '44.96458169857359389595',
                conversionTime: expect.any(Number),
                expirationTime: expect.any(Number),
              },
            }),
            [ETH]: expect.objectContaining({
              [ETH]: {
                rate: '1',
                conversionTime: expect.any(Number),
                expirationTime: expect.any(Number),
              },
              [SOL]: {
                rate: '14.69103829451243642206',
                conversionTime: expect.any(Number),
                expirationTime: expect.any(Number),
              },
            }),
            [SOL]: expect.objectContaining({
              [USDC]: {
                rate: '126.65075990455942506931',
                conversionTime: expect.any(Number),
                expirationTime: expect.any(Number),
              },
            }),
          }),
        );
      });

      it('handles crypto to fiat conversions', async () => {
        const result = await tokenPricesService.getMultipleTokenConversions([
          { from: BTC, to: USD },
          { from: ETH, to: USD },
          { from: SOL, to: USD },
        ]);

        expect(result).toStrictEqual(
          expect.objectContaining({
            [BTC]: expect.objectContaining({
              [USD]: {
                rate: '77556.84849999227',
                conversionTime: expect.any(Number),
                expirationTime: expect.any(Number),
              },
            }),
            [ETH]: expect.objectContaining({
              [USD]: {
                rate: '1724.8431002851428',
                conversionTime: expect.any(Number),
                expirationTime: expect.any(Number),
              },
            }),
            [SOL]: expect.objectContaining({
              [USD]: {
                rate: '117.40784182214172',
                conversionTime: expect.any(Number),
                expirationTime: expect.any(Number),
              },
            }),
          }),
        );
      });

      it('handles fiat to crypto conversions', async () => {
        const result = await tokenPricesService.getMultipleTokenConversions([
          { from: USD, to: BTC },
          { from: USD, to: ETH },
          { from: USD, to: SOL },
        ]);

        expect(result).toStrictEqual(
          expect.objectContaining({
            [USD]: expect.objectContaining({
              [BTC]: {
                rate: '0.00001289376785339724',
                conversionTime: expect.any(Number),
                expirationTime: expect.any(Number),
              },
              [ETH]: {
                rate: '0.00057976287804652191',
                conversionTime: expect.any(Number),
                expirationTime: expect.any(Number),
              },
              [SOL]: {
                rate: '0.00851731864311819686',
                conversionTime: expect.any(Number),
                expirationTime: expect.any(Number),
              },
            }),
          }),
        );
      });

      it('handles missing data correctly', async () => {
        const result = await tokenPricesService.getMultipleTokenConversions([
          { from: UNKNOWN_CRYPTO_1, to: UNKNOWN_CRYPTO_2 },
          { from: UNKNOWN_CRYPTO_1, to: UNKNOWN_FIAT_1 },
          { from: UNKNOWN_FIAT_1, to: UNKNOWN_CRYPTO_2 },
          { from: UNKNOWN_FIAT_1, to: UNKNOWN_FIAT_2 },
        ]);

        expect(result).toStrictEqual({
          [UNKNOWN_CRYPTO_1]: {
            [UNKNOWN_CRYPTO_2]: null,
            [UNKNOWN_FIAT_1]: null,
          },
          [UNKNOWN_FIAT_1]: {
            [UNKNOWN_CRYPTO_2]: null,
            [UNKNOWN_FIAT_2]: null,
          },
        });
      });
    });
  });

  describe('getMultipleTokensMarketData', () => {
    it('returns empty object when no assets provided', async () => {
      const result = await tokenPricesService.getMultipleTokensMarketData([]);
      expect(result).toStrictEqual({});
    });

    it('returns market data in the correct nested structure with asset-to-unit conversions and correct values', async () => {
      const result = await tokenPricesService.getMultipleTokensMarketData([
        { asset: BTC, unit: USD },
        { asset: ETH, unit: USD },
        { asset: SOL, unit: USD },
        { asset: SOL, unit: BTC },
      ]);

      // BTC/USD - actual values from consistent mocks
      expect(result[BTC]![USD]).toStrictEqual({
        fungible: true,
        marketCap: '1540421085883.0198',
        totalVolume: '23748436299.895576',
        circulatingSupply: '19844921',
        allTimeHigh: '100847.44951017378',
        allTimeLow: '62.86163248290115',
        pricePercentChange: {
          PT1H: -0.4456714429821922,
          P1D: 1.3725526422881404,
          P7D: -4.2914380354332256,
          P14D: 1.3530761284206316,
          P30D: -2.6647248645353425,
          P200D: 44.69565022141291,
          P1Y: 20.367003699380124,
        },
      });

      // ETH/USD - actual values from consistent mocks
      expect(result[ETH]![USD]).toStrictEqual({
        fungible: true,
        marketCap: '208326525244.77222',
        totalVolume: '14672129201.423573',
        circulatingSupply: '120659504.7581715',
        allTimeHigh: '4522.273813243435',
        allTimeLow: '0.4013827867691204',
        pricePercentChange: {
          PT1H: -0.16193070976498064,
          P1D: 1.9964598342126199,
          P7D: -10.123102834312476,
          P14D: -1.7452971064771636,
          P30D: -16.78602306244949,
          P200D: -21.026646670919543,
          P1Y: -47.45246230239663,
        },
      });

      // SOL/USD - actual values from consistent mocks
      expect(result[SOL]![USD]).toStrictEqual({
        fungible: true,
        marketCap: '60217502031.67665',
        totalVolume: '3389485617.517553',
        circulatingSupply: '512506275.4700137',
        allTimeHigh: '271.90599356377726',
        allTimeLow: '0.46425554356391946',
        pricePercentChange: {
          PT1H: -0.7015657267954617,
          P1D: 1.6270441732346845,
          P7D: -10.985589910714582,
          P14D: 2.557473792001135,
          P30D: -11.519171371325216,
          P200D: -4.453777067234332,
          P1Y: -35.331458644625535,
        },
      });

      // SOL/BTC - actual converted values from consistent mocks
      expect(result[SOL]![BTC]).toStrictEqual({
        fungible: true,
        marketCap: '776430.49190791515732749827',
        totalVolume: '43703.24069470010538206139',
        circulatingSupply: '512506275.4700137',
        allTimeHigh: '0.00350589275895866708',
        allTimeLow: '0.00000598600320336592',
        pricePercentChange: {
          PT1H: -0.7015657267954617,
          P1D: 1.6270441732346845,
          P7D: -10.985589910714582,
          P14D: 2.557473792001135,
          P30D: -11.519171371325216,
          P200D: -4.453777067234332,
          P1Y: -35.331458644625535,
        },
      });
    });

    it('only includes price percent change if Price API returns it', async () => {
      jest
        .spyOn(mockPriceApiClient, 'getMultipleSpotPrices')
        .mockResolvedValue({
          [BTC]: {
            ...MOCK_SPOT_PRICES[BTC],
            pricePercentChange1h: -0.4456714429821922,
            pricePercentChange1d: null,
            pricePercentChange7d: null,
            pricePercentChange14d: null,
            pricePercentChange30d: null,
            pricePercentChange200d: null,
            pricePercentChange1y: null,
          } as SpotPrice,
        });

      const result = await tokenPricesService.getMultipleTokensMarketData([
        { asset: BTC, unit: USD },
      ]);

      expect(result[BTC]?.[USD]?.pricePercentChange).toStrictEqual({
        PT1H: -0.4456714429821922,
      });
    });

    it('does not include price percent change field if Price API does not return any values', async () => {
      jest
        .spyOn(mockPriceApiClient, 'getMultipleSpotPrices')
        .mockResolvedValue({
          [BTC]: {
            ...MOCK_SPOT_PRICES[BTC],
            pricePercentChange1h: null,
            pricePercentChange1d: null,
            pricePercentChange7d: null,
            pricePercentChange14d: null,
            pricePercentChange30d: null,
            pricePercentChange200d: null,
            pricePercentChange1y: null,
          } as SpotPrice,
        });

      const result = await tokenPricesService.getMultipleTokensMarketData([
        { asset: BTC, unit: USD },
      ]);

      expect(result[BTC]?.[USD]?.pricePercentChange).toBeUndefined();
    });

    it('handles missing asset data correctly by skipping those assets', async () => {
      const result = await tokenPricesService.getMultipleTokensMarketData([
        { asset: UNKNOWN_CRYPTO_1, unit: USD },
        { asset: BTC, unit: USD },
        { asset: UNKNOWN_CRYPTO_2, unit: EUR },
      ]);

      // Should only include BTC since UNKNOWN_CRYPTO_1 and UNKNOWN_CRYPTO_2 don't have price data
      expect(result).toStrictEqual({
        [BTC]: {
          [USD]: {
            fungible: true,
            marketCap: '1540421085883.0198',
            totalVolume: '23748436299.895576',
            circulatingSupply: '19844921',
            allTimeHigh: '100847.44951017378',
            allTimeLow: '62.86163248290115',
            pricePercentChange: {
              PT1H: -0.4456714429821922,
              P1D: 1.3725526422881404,
              P7D: -4.2914380354332256,
              P14D: 1.3530761284206316,
              P30D: -2.6647248645353425,
              P200D: 44.69565022141291,
              P1Y: 20.367003699380124,
            },
          },
        },
      });
    });

    it('handles missing unit data correctly by skipping those conversions', async () => {
      const result = await tokenPricesService.getMultipleTokensMarketData([
        { asset: BTC, unit: UNKNOWN_FIAT_1 },
        { asset: BTC, unit: USD },
        { asset: ETH, unit: UNKNOWN_FIAT_2 },
      ]);

      // Should only include BTC->USD since UNKNOWN_FIAT_1 and UNKNOWN_FIAT_2 don't have exchange rates
      expect(result).toStrictEqual({
        [BTC]: {
          [USD]: {
            fungible: true,
            marketCap: '1540421085883.0198',
            totalVolume: '23748436299.895576',
            circulatingSupply: '19844921',
            allTimeHigh: '100847.44951017378',
            allTimeLow: '62.86163248290115',
            pricePercentChange: {
              PT1H: -0.4456714429821922,
              P1D: 1.3725526422881404,
              P7D: -4.2914380354332256,
              P14D: 1.3530761284206316,
              P30D: -2.6647248645353425,
              P200D: 44.69565022141291,
              P1Y: 20.367003699380124,
            },
          },
        },
      });
    });

    it('handles zero unit rates correctly by skipping those conversions', async () => {
      jest
        .spyOn(mockPriceApiClient, 'getMultipleSpotPrices')
        .mockResolvedValue({
          [BTC]: {
            ...MOCK_SPOT_PRICES[BTC]!,
            price: 0, // Zero price for unit
          },
          [ETH]: MOCK_SPOT_PRICES[ETH]!,
        });

      const result = await tokenPricesService.getMultipleTokensMarketData([
        { asset: ETH, unit: BTC }, // BTC has zero price, so this should be skipped
        { asset: ETH, unit: USD },
      ]);

      // Should only include ETH->USD since BTC has zero price
      expect(result).toStrictEqual({
        [ETH]: {
          [USD]: {
            fungible: true,
            marketCap: '208326525244.77222',
            totalVolume: '14672129201.423573',
            circulatingSupply: '120659504.7581715',
            allTimeHigh: '4522.273813243435',
            allTimeLow: '0.4013827867691204',
            pricePercentChange: {
              PT1H: -0.16193070976498064,
              P1D: 1.9964598342126199,
              P7D: -10.123102834312476,
              P14D: -1.7452971064771636,
              P30D: -16.78602306244949,
              P200D: -21.026646670919543,
              P1Y: -47.45246230239663,
            },
          },
        },
      });
    });
  });

  describe('getHistoricalPrice', () => {
    it('returns historical prices for a token', async () => {
      const result = await tokenPricesService.getHistoricalPrice(BTC, USD);
      // We use the same prices for all time periods for simplicity
      const expectedPrices = MOCK_HISTORICAL_PRICES.prices.map((price) => [
        price[0],
        price[1]!.toString(),
      ]);

      expect(result).toStrictEqual({
        intervals: {
          P1D: expectedPrices,
          P7D: expectedPrices,
          P1M: expectedPrices,
          P3M: expectedPrices,
          P1Y: expectedPrices,
          P1000Y: expectedPrices,
        },
        updateTime: expect.any(Number),
        expirationTime: expect.any(Number),
      });
    });
  });
});
