import { assert } from 'superstruct';

import { SpotPricesFromPriceApiWithIncludeMarketDataFalseStruct } from './structs';

describe('structs', () => {
  describe('SpotPricesFromPriceApiWithIncludeMarketDataFalseStruct', () => {
    it('should validate the struct', () => {
      const spotPrices = {
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501': {
          usd: 202.53,
        },
        'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1/slip44:501': null,
      };

      expect(() =>
        assert(
          spotPrices,
          SpotPricesFromPriceApiWithIncludeMarketDataFalseStruct,
        ),
      ).not.toThrow();
    });

    it('should reject invalid spot prices', () => {
      const spotPrices = {
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501': {
          usd: -4,
        },
      };

      expect(() =>
        assert(
          spotPrices,
          SpotPricesFromPriceApiWithIncludeMarketDataFalseStruct,
        ),
      ).toThrow('Expected a positive number but received a negative number -4');
    });
  });
});
