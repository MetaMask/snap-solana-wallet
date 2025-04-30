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
      getMultipleSpotPrices: jest.fn().mockResolvedValue({
        [BTC]: {
          ...MOCK_SPOT_PRICES[BTC],
          price: 100000,
        },
        [ETH]: {
          ...MOCK_SPOT_PRICES[ETH],
          price: 3000,
        },
        [SOL]: {
          ...MOCK_SPOT_PRICES[SOL],
          price: 200,
        },
        [USDC]: {
          ...MOCK_SPOT_PRICES[USDC],
          price: 0.99991,
        },
      }),
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
                rate: '5.76570004244899399996',
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
                rate: '1.03740143454969449639',
                conversionTime: expect.any(Number),
                expirationTime: expect.any(Number),
              },
              [BZR]: {
                rate: '5.98134549521982082858',
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
                rate: '33.33333333333333333333',
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
                rate: '15',
                conversionTime: expect.any(Number),
                expirationTime: expect.any(Number),
              },
            }),
            [SOL]: expect.objectContaining({
              [USDC]: {
                rate: '200.01800162014581312318',
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
                rate: '100000',
                conversionTime: expect.any(Number),
                expirationTime: expect.any(Number),
              },
            }),
            [ETH]: expect.objectContaining({
              [USD]: {
                rate: '3000',
                conversionTime: expect.any(Number),
                expirationTime: expect.any(Number),
              },
            }),
            [SOL]: expect.objectContaining({
              [USD]: {
                rate: '200',
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
                rate: '0.00001',
                conversionTime: expect.any(Number),
                expirationTime: expect.any(Number),
              },
              [ETH]: {
                rate: '0.00033333333333333333',
                conversionTime: expect.any(Number),
                expirationTime: expect.any(Number),
              },
              [SOL]: {
                rate: '0.005',
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

    describe('when includeMarketData is true', () => {
      const includeMarketData = true;

      it('returns market data in the correct currency', async () => {
        const result = await tokenPricesService.getMultipleTokenConversions(
          [
            { from: BTC, to: USD },
            { from: ETH, to: USD },
            { from: SOL, to: EUR },
            { from: SOL, to: USD },
            { from: SOL, to: BTC },
            { from: ETH, to: BTC },
          ],
          includeMarketData,
        );

        expect(result).toStrictEqual({
          'bip122:000000000019d6689c085ae165831e93/slip44:0': {
            'swift:0/iso4217:USD': {
              rate: '100000',
              conversionTime: expect.any(Number),
              expirationTime: expect.any(Number),
              marketData: {
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
          },
          'eip155:1/slip44:60': {
            'swift:0/iso4217:USD': {
              rate: '3000',
              conversionTime: expect.any(Number),
              expirationTime: expect.any(Number),
              marketData: {
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
            'bip122:000000000019d6689c085ae165831e93/slip44:0': {
              rate: '0.03',
              conversionTime: expect.any(Number),
              expirationTime: expect.any(Number),
              marketData: {
                marketCap: '2083265.2524477222',
                totalVolume: '146721.29201423573',
                circulatingSupply: '120659504.7581715',
                allTimeHigh: '0.04522273813243435',
                allTimeLow: '0.0000040138278676912',
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
          },
          'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501': {
            'swift:0/iso4217:EUR': {
              rate: '192.7893998785668999995',
              conversionTime: expect.any(Number),
              expirationTime: expect.any(Number),
              marketData: {
                marketCap: '58046480394.36662200758692138314',
                totalVolume: '3267284490.49121393197975318582',
                circulatingSupply: '512506275.4700137',
                allTimeHigh: '262.1029666127304599094',
                allTimeLow: '0.44751773816992952247',
                pricePercentChange: {
                  PT1H: -0.7015657267954617,
                  P1D: 1.6270441732346845,
                  P7D: -10.985589910714582,
                  P14D: 2.557473792001135,
                  P30D: -11.519171371325216,
                  P200D: -4.453777067234332,
                  P1Y: -35.331458644625535,
                },
              },
            },
            'swift:0/iso4217:USD': {
              rate: '200',
              conversionTime: expect.any(Number),
              expirationTime: expect.any(Number),
              marketData: {
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
              },
            },
            'bip122:000000000019d6689c085ae165831e93/slip44:0': {
              rate: '0.002',
              conversionTime: expect.any(Number),
              expirationTime: expect.any(Number),
              marketData: {
                marketCap: '602175.0203167665',
                totalVolume: '33894.85617517553',
                circulatingSupply: '512506275.4700137',
                allTimeHigh: '0.0027190599356377726',
                allTimeLow: '0.00000464255543563919',
                pricePercentChange: {
                  PT1H: -0.7015657267954617,
                  P1D: 1.6270441732346845,
                  P7D: -10.985589910714582,
                  P14D: 2.557473792001135,
                  P30D: -11.519171371325216,
                  P200D: -4.453777067234332,
                  P1Y: -35.331458644625535,
                },
              },
            },
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

        const result = await tokenPricesService.getMultipleTokenConversions(
          [{ from: BTC, to: USD }],
          includeMarketData,
        );

        expect(
          result[BTC]?.[USD]?.marketData?.pricePercentChange,
        ).toStrictEqual({
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

        const result = await tokenPricesService.getMultipleTokenConversions(
          [{ from: BTC, to: USD }],
          includeMarketData,
        );

        expect(
          result[BTC]?.[USD]?.marketData?.pricePercentChange,
        ).toBeUndefined();
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
        },
        updateTime: expect.any(Number),
        expirationTime: expect.any(Number),
      });
    });
  });
});
