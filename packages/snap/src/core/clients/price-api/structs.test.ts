import { assert } from '@metamask/superstruct';

import { SpotPricesFromPriceApiWithoutMarketDataStruct } from './structs';

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
        assert(spotPrices, SpotPricesFromPriceApiWithoutMarketDataStruct),
      ).not.toThrow();
    });

    it('should reject invalid spot prices', () => {
      const spotPrices = {
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501': {
          usd: -4,
        },
      };

      expect(() =>
        assert(spotPrices, SpotPricesFromPriceApiWithoutMarketDataStruct),
      ).toThrow(
        'At path: solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501.usd -- Expected a number greater than or equal to 0 but received `-4`',
      );
    });
  });
});
