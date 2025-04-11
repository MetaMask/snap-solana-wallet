import type { OnAssetHistoricalPriceHandler } from '@metamask/snaps-sdk';
import { assert } from '@metamask/superstruct';
import { CaipAssetTypeStruct } from '@metamask/utils';

import { tokenPricesService } from '../../../snapContext';
import logger from '../../utils/logger';

/**
 * Implements the `onAssetHistoricalPrice` handler.
 *
 * @see https://github.com/MetaMask/SIPs/blob/main/SIPS/sip-29.md#get-assets-historical-price
 * @param params - The parameters for the `onAssetHistoricalPrice` handler.
 * @returns The historical price of the asset pair.
 */
export const onAssetHistoricalPrice: OnAssetHistoricalPriceHandler = async (
  params,
) => {
  try {
    logger.log('[📈 onAssetHistoricalPrice]', params);

    const { from, to } = params;
    assert(from, CaipAssetTypeStruct);
    assert(to, CaipAssetTypeStruct);

    const historicalPrice = await tokenPricesService.getHistoricalPrice(
      from,
      to,
    );

    return {
      historicalPrice,
    };
  } catch (error: any) {
    logger.error('[📈 onAssetHistoricalPrice]', error);
    return null;
  }
};
