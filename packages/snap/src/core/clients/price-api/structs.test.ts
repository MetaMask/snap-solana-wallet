/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { assert } from '@metamask/superstruct';
import { cloneDeep } from 'lodash';

import { MOCK_SPOT_PRICES } from './mocks/spot-prices';
import { SpotPricesStruct } from './structs';

describe('structs', () => {
  describe('SpotPricesFromPriceApiWithIncludeMarketDataFalseStruct', () => {
    it('should validate the struct', () => {
      const spotPrices = MOCK_SPOT_PRICES;

      expect(() => assert(spotPrices, SpotPricesStruct)).not.toThrow();
    });

    it('should reject invalid spot prices', () => {
      const spotPricesWithInvalidPrice = cloneDeep(MOCK_SPOT_PRICES);
      spotPricesWithInvalidPrice[
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501'
      ]!.price = -4;

      expect(() =>
        assert(spotPricesWithInvalidPrice, SpotPricesStruct),
      ).toThrow('Expected a positive number but received a negative number -4');
    });
  });
});
