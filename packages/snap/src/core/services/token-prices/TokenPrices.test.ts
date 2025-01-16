import type { PriceApiClient } from '../../clients/price-api/PriceApiClient';
import { Caip19Id } from '../../constants/solana';
import type { ILogger } from '../../utils/logger';
import { TokenPrices } from './TokenPrices';

describe('TokenPricesService', () => {
  describe('getMultipleTokenPrices', () => {
    let tokenPricesService: TokenPrices;
    let mockPriceApiClient: PriceApiClient;
    let mockLogger: ILogger;
    const currency = 'usd';

    beforeEach(() => {
      mockPriceApiClient = {
        getSpotPrice: jest.fn().mockResolvedValue({ price: 1.23 }),
      } as unknown as PriceApiClient;

      mockLogger = {
        info: jest.fn(),
        error: jest.fn(),
      } as unknown as ILogger;

      tokenPricesService = new TokenPrices(mockPriceApiClient, mockLogger);
    });

    it('returns the correct token prices', async () => {
      const caip19Ids = [
        Caip19Id.SolMainnet,
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:11111111111111111111111111111111',
      ];
      const expectedPrices = {
        [Caip19Id.SolMainnet]: { price: 1.23 },
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:11111111111111111111111111111111':
          { price: 1.23 },
      };

      const prices = await tokenPricesService.getMultipleTokenPrices(
        caip19Ids,
        currency,
      );

      expect(prices).toStrictEqual(expectedPrices);
    });

    it('returns the correct token prices when using a different currency', async () => {
      const caip19Ids = [
        Caip19Id.SolMainnet,
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:11111111111111111111111111111111',
      ];
      const expectedPrices = {
        [Caip19Id.SolMainnet]: { price: 1.23 },
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:11111111111111111111111111111111':
          { price: 1.23 },
      };

      const prices = await tokenPricesService.getMultipleTokenPrices(
        caip19Ids,
        'eur',
      );

      expect(prices).toStrictEqual(expectedPrices);
    });

    it('returns an empty object if no caip19Ids are provided', async () => {
      const caip19Ids: string[] = [];
      const prices = await tokenPricesService.getMultipleTokenPrices(
        caip19Ids,
        currency,
      );
      expect(prices).toStrictEqual({});
    });

    it('returns an empty object if the price api fails', async () => {
      jest
        .mocked(mockPriceApiClient.getSpotPrice)
        .mockRejectedValue(new Error('Error fetching spot price'));

      const prices = await tokenPricesService.getMultipleTokenPrices(
        [Caip19Id.SolMainnet],
        currency,
      );
      expect(prices).toStrictEqual({});
    });
  });
});
