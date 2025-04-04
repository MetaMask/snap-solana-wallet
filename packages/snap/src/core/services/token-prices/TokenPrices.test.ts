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

    describe('when includeMarketData is true', () => {
      const includeMarketData = true;

      it('returns market data in the correct currency', async () => {
        const result = await tokenPricesService.getMultipleTokenConversions(
          [{ from: ETH, to: BTC }],
          includeMarketData,
        );

        expect(result).toBe('coucou');
      });
    });
  });

  describe('getMultipleTokenConversions2', () => {
    let tokenPricesService: TokenPricesService;
    let mockPriceApiClient: PriceApiClient;

    beforeEach(() => {
      mockPriceApiClient = {
        getMultipleSpotPrices: jest.fn(),
      } as unknown as PriceApiClient;

      tokenPricesService = new TokenPricesService(mockPriceApiClient);
    });

    it('returns empty object when no conversions provided', async () => {
      const result = await tokenPricesService.getMultipleTokenConversions2([]);
      expect(result).toStrictEqual({});
    });

    it('should return the correct token prices', async () => {
      // We will have 43 requests to the price API, because we group calls by `to` (=vsCurrency) asset
      jest
        .spyOn(mockPriceApiClient, 'getMultipleSpotPrices')
        // 1. BTC + ETH + SOL, vsCurrency: USD
        .mockResolvedValueOnce({
          'bip122:000000000019d6689c085ae165831e93/slip44:0': {
            id: 'bitcoin',
            price: 85236,
            marketCap: 1692094220883,
            allTimeHigh: 108786,
            allTimeLow: 67.81,
            totalVolume: 29616242354,
            high1d: 85413,
            low1d: 82282,
            circulatingSupply: 19845068,
            dilutedMarketCap: 1692094220883,
            marketCapPercentChange1d: 3.00842,
            priceChange1d: 2592.86,
            pricePercentChange1h: 0.17317175176236918,
            pricePercentChange1d: 3.137397199766487,
            pricePercentChange7d: -2.9486271222886575,
            pricePercentChange14d: 4.107339295722114,
            pricePercentChange30d: -6.721297626598127,
            pricePercentChange200d: 42.93125268023596,
            pricePercentChange1y: 24.166038686850534,
          },
          'eip155:1/slip44:60': {
            id: 'ethereum',
            price: 1918.07,
            marketCap: 231608381248,
            allTimeHigh: 4878.26,
            allTimeLow: 0.432979,
            totalVolume: 16271407283,
            high1d: 1923.93,
            low1d: 1817.59,
            circulatingSupply: 120659504.7581715,
            dilutedMarketCap: 231608381248,
            marketCapPercentChange1d: 5.18571,
            priceChange1d: 94.35,
            pricePercentChange1h: 0.20849487380572984,
            pricePercentChange1d: 5.173513676324868,
            pricePercentChange7d: -7.26600164996379,
            pricePercentChange14d: 1.6214986436167649,
            pricePercentChange30d: -21.981462600292843,
            pricePercentChange200d: -20.5135084387872,
            pricePercentChange1y: -44.37673909186064,
          },
          'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501': {
            id: 'solana',
            price: 127.59,
            marketCap: 65418704123,
            allTimeHigh: 293.31,
            allTimeLow: 0.500801,
            totalVolume: 3728896877,
            high1d: 129.75,
            low1d: 124.12,
            circulatingSupply: 512505193.1722131,
            dilutedMarketCap: 76272580523,
            marketCapPercentChange1d: 2.65875,
            priceChange1d: 3.39,
            pricePercentChange1h: -0.5219372388367555,
            pricePercentChange1d: 2.732570028475622,
            pricePercentChange7d: -11.679417828114772,
            pricePercentChange14d: 3.4730433149735784,
            pricePercentChange30d: -26.326266150617943,
            pricePercentChange200d: -6.834233513037525,
            pricePercentChange1y: -32.843204484589215,
          },
        })
        // 2. SOL, vsCurrency: EUR
        .mockResolvedValueOnce({
          'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501': {
            id: 'solana',
            price: 118.22489340007958,
            marketCap: 60616970932.77704,
            allTimeHigh: 271.78104462087424,
            allTimeLow: 0.46404220424526416,
            totalVolume: 3455195828.6951537,
            high1d: 120.2263493899234,
            low1d: 115.00959141639531,
            circulatingSupply: 512505193.1722131,
            dilutedMarketCap: 70674172753.98277,
            marketCapPercentChange1d: 2.65875,
            priceChange1d: 3.39,
            pricePercentChange1h: -0.5219372388367555,
            pricePercentChange1d: 2.732570028475622,
            pricePercentChange7d: -11.679417828114772,
            pricePercentChange14d: 3.4730433149735784,
            pricePercentChange30d: -26.326266150617943,
            pricePercentChange200d: -6.834233513037525,
            pricePercentChange1y: -32.843204484589215,
          },
        })
        // 3. SOL + ETH, vsCurrency: BTC
        .mockResolvedValueOnce({
          'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501': {
            id: 'solana',
            price: 0.0014975547040864652,
            marketCap: 767835.1602370036,
            allTimeHigh: 0.0034426504448279733,
            allTimeLow: 0.00000587802252026966,
            totalVolume: 43766.96495967301,
            high1d: 0.0015229071467608656,
            low1d: 0.00145682647441972,
            circulatingSupply: 512505193.1722131,
            dilutedMarketCap: 895229.7339527577,
            marketCapPercentChange1d: 2.65875,
            priceChange1d: 3.39,
            pricePercentChange1h: -0.5219372388367555,
            pricePercentChange1d: 2.732570028475622,
            pricePercentChange7d: -11.679417828114772,
            pricePercentChange14d: 3.4730433149735784,
            pricePercentChange30d: -26.326266150617943,
            pricePercentChange200d: -6.834233513037525,
            pricePercentChange1y: -32.843204484589215,
          },
          'eip155:1/slip44:60': {
            id: 'ethereum',
            price: 0.02251285172244789,
            marketCap: 2718443.6150465854,
            allTimeHigh: 0.05725731805593573,
            allTimeLow: 0.00000508197929477744,
            totalVolume: 190981.44461763007,
            high1d: 0.02258163196044418,
            low1d: 0.02133349364840911,
            circulatingSupply: 120659504.7581715,
            dilutedMarketCap: 2718443.6150465854,
            marketCapPercentChange1d: 5.18571,
            priceChange1d: 94.35,
            pricePercentChange1h: 0.20849487380572984,
            pricePercentChange1d: 5.173513676324868,
            pricePercentChange7d: -7.26600164996379,
            pricePercentChange14d: 1.6214986436167649,
            pricePercentChange30d: -21.981462600292843,
            pricePercentChange200d: -20.5135084387872,
            pricePercentChange1y: -44.37673909186064,
          },
        });

      const result = await tokenPricesService.getMultipleTokenConversions2([
        { from: BTC, to: USD },
        { from: ETH, to: USD },
        { from: SOL, to: EUR },
        { from: SOL, to: USD },
        { from: SOL, to: BTC },
        { from: ETH, to: BTC },
      ]);

      expect(result).toStrictEqual({
        'bip122:000000000019d6689c085ae165831e93/slip44:0': {
          'swift:0/iso4217:USD': {
            rate: '85236',
            conversionTime: expect.any(Number),
            expirationTime: undefined,
            marketData: {
              marketCap: 1692094220883,
              totalVolume: 29616242354,
              circulatingSupply: 19845068,
              allTimeHigh: 108786,
              allTimeLow: 67.81,
            },
          },
        },
        'eip155:1/slip44:60': {
          'swift:0/iso4217:USD': {
            rate: '1918.07',
            conversionTime: expect.any(Number),
            expirationTime: undefined,
            marketData: {
              marketCap: 231608381248,
              totalVolume: 16271407283,
              circulatingSupply: 120659504.7581715,
              allTimeHigh: 4878.26,
              allTimeLow: 0.432979,
            },
          },
          'bip122:000000000019d6689c085ae165831e93/slip44:0': {
            rate: '0.02251285172244789',
            conversionTime: expect.any(Number),
            expirationTime: undefined,
            marketData: {
              marketCap: 2718443.6150465854,
              totalVolume: 190981.44461763007,
              circulatingSupply: 120659504.7581715,
              allTimeHigh: 0.05725731805593573,
              allTimeLow: 0.00000508197929477744,
            },
          },
        },
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501': {
          'swift:0/iso4217:USD': {
            rate: '127.59',
            conversionTime: expect.any(Number),
            expirationTime: undefined,
            marketData: {
              marketCap: 65418704123,
              totalVolume: 3728896877,
              circulatingSupply: 512505193.1722131,
              allTimeHigh: 293.31,
              allTimeLow: 0.500801,
            },
          },
          'swift:0/iso4217:EUR': {
            rate: '118.22489340007958',
            conversionTime: expect.any(Number),
            expirationTime: undefined,
            marketData: {
              marketCap: 60616970932.77704,
              totalVolume: 3455195828.6951537,
              circulatingSupply: 512505193.1722131,
              allTimeHigh: 271.78104462087424,
              allTimeLow: 0.46404220424526416,
            },
          },
          'bip122:000000000019d6689c085ae165831e93/slip44:0': {
            rate: '0.0014975547040864652',
            conversionTime: expect.any(Number),
            expirationTime: undefined,
            marketData: {
              marketCap: 767835.1602370036,
              totalVolume: 43766.96495967301,
              circulatingSupply: 512505193.1722131,
              allTimeHigh: 0.0034426504448279733,
              allTimeLow: 0.00000587802252026966,
            },
          },
        },
      });
    });
  });
});
