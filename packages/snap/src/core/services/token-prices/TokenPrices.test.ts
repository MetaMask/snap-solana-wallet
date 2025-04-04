import { MOCK_SPOT_PRICES } from '../../clients/price-api/mocks/spot-prices';
import type { PriceApiClient } from '../../clients/price-api/PriceApiClient';
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

  describe('getMultipleTokenConversions', () => {
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
      } as unknown as PriceApiClient;

      tokenPricesService = new TokenPricesService(mockPriceApiClient);
    });

    it('returns empty object when no conversions provided', async () => {
      const result = await tokenPricesService.getMultipleTokenConversions([]);
      expect(result).toStrictEqual({});
    });

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
            [USD]: { rate: '1', conversionTime: expect.any(Number) },
            [BZR]: {
              rate: '5.76570004244899399996',
              conversionTime: expect.any(Number),
            },
          }),
          [EUR]: expect.objectContaining({
            [EUR]: { rate: '1', conversionTime: expect.any(Number) },
            [USD]: {
              rate: '1.03740143454969449639',
              conversionTime: expect.any(Number),
            },
            [BZR]: {
              rate: '5.98134549521982082858',
              conversionTime: expect.any(Number),
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
            [BTC]: { rate: '1', conversionTime: expect.any(Number) },
            [ETH]: {
              rate: '33.33333333333333333333',
              conversionTime: expect.any(Number),
            },
          }),
          [ETH]: expect.objectContaining({
            [ETH]: { rate: '1', conversionTime: expect.any(Number) },
            [SOL]: {
              rate: '15',
              conversionTime: expect.any(Number),
            },
          }),
          [SOL]: expect.objectContaining({
            [USDC]: {
              rate: '200.01800162014581312318',
              conversionTime: expect.any(Number),
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
            [USD]: { rate: '100000', conversionTime: expect.any(Number) },
          }),
          [ETH]: expect.objectContaining({
            [USD]: { rate: '3000', conversionTime: expect.any(Number) },
          }),
          [SOL]: expect.objectContaining({
            [USD]: { rate: '200', conversionTime: expect.any(Number) },
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
            [BTC]: { rate: '0.00001', conversionTime: expect.any(Number) },
            [ETH]: {
              rate: '0.00033333333333333333',
              conversionTime: expect.any(Number),
            },
            [SOL]: { rate: '0.005', conversionTime: expect.any(Number) },
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

    /**
     * TODO: Enable this when snaps SDK is updated
     */
    describe.skip('when includeMarketData is true', () => {
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
              expirationTime: undefined,
              marketData: {
                marketCap: '1540421085883.0198',
                totalVolume: '23748436299.895576',
                circulatingSupply: 19844921,
                allTimeHigh: '100847.44951017378',
                allTimeLow: '62.86163248290115',
              },
            },
          },
          'eip155:1/slip44:60': {
            'swift:0/iso4217:USD': {
              rate: '3000',
              conversionTime: expect.any(Number),
              expirationTime: undefined,
              marketData: {
                marketCap: '208326525244.77222',
                totalVolume: '14672129201.423573',
                circulatingSupply: 120659504.7581715,
                allTimeHigh: '4522.273813243435',
                allTimeLow: '0.4013827867691204',
              },
            },
            'bip122:000000000019d6689c085ae165831e93/slip44:0': {
              rate: '0.03',
              conversionTime: expect.any(Number),
              expirationTime: undefined,
              marketData: {
                marketCap: '2083265.2524477222',
                totalVolume: '146721.29201423573',
                circulatingSupply: 120659504.7581715,
                allTimeHigh: '0.04522273813243435',
                allTimeLow: '0.0000040138278676912',
              },
            },
          },
          'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501': {
            'swift:0/iso4217:EUR': {
              rate: '192.7893998785668999995',
              conversionTime: expect.any(Number),
              expirationTime: undefined,
              marketData: {
                marketCap: '58046480394.36662200758692138314',
                totalVolume: '3267284490.49121393197975318582',
                circulatingSupply: 512506275.4700137,
                allTimeHigh: '262.1029666127304599094',
                allTimeLow: '0.44751773816992952247',
              },
            },
            'swift:0/iso4217:USD': {
              rate: '200',
              conversionTime: expect.any(Number),
              expirationTime: undefined,
              marketData: {
                marketCap: '60217502031.67665',
                totalVolume: '3389485617.517553',
                circulatingSupply: 512506275.4700137,
                allTimeHigh: '271.90599356377726',
                allTimeLow: '0.46425554356391946',
              },
            },
            'bip122:000000000019d6689c085ae165831e93/slip44:0': {
              rate: '0.002',
              conversionTime: expect.any(Number),
              expirationTime: undefined,
              marketData: {
                marketCap: '602175.0203167665',
                totalVolume: '33894.85617517553',
                circulatingSupply: 512506275.4700137,
                allTimeHigh: '0.0027190599356377726',
                allTimeLow: '0.00000464255543563919',
              },
            },
          },
        });
      });
    });
  });
});
