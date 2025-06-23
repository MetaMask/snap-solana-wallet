import type { FungibleAssetMarketData } from '@metamask/snaps-sdk';
import { InternalError } from '@metamask/snaps-sdk';
import type { CaipAssetType } from '@metamask/utils';

import { assetsService } from '../../../snapContext';
import logger from '../../utils/logger';
import { onAssetsMarketData } from './onAssetsMarketData';

jest.mock('../../../snapContext', () => ({
  assetsService: {
    getAssetsMarketData: jest.fn(),
  },
}));

jest.mock('../../utils/logger', () => ({
  log: jest.fn(),
  error: jest.fn(),
}));

describe('onAssetsMarketData', () => {
  const mockAssetsService = assetsService as jest.Mocked<typeof assetsService>;

  const BTC =
    'bip122:000000000019d6689c085ae165831e93/slip44:0' as CaipAssetType;
  const ETH = 'eip155:1/slip44:60' as CaipAssetType;
  const SOL =
    'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501' as CaipAssetType;
  const USD = 'swift:0/iso4217:USD' as CaipAssetType;
  const EUR = 'swift:0/iso4217:EUR' as CaipAssetType;

  const PT1H = 'PT1H';
  const P1D = 'P1D';
  const P7D = 'P7D';
  const P30D = 'P30D';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('successful scenarios', () => {
    it('should return market data for crypto assets in USD', async () => {
      const params = {
        assets: [
          { asset: BTC, unit: USD },
          { asset: ETH, unit: USD },
          { asset: SOL, unit: USD },
        ],
      };

      const mockMarketData: Record<CaipAssetType, FungibleAssetMarketData> = {
        [BTC]: {
          fungible: true,
          marketCap: '1000000000000',
          totalVolume: '50000000000',
          circulatingSupply: '19500000',
          allTimeHigh: '120000',
          allTimeLow: '67.81',
          pricePercentChange: {
            [PT1H]: 0.5,
            [P1D]: 2.1,
            [P7D]: -1.2,
            [P30D]: 15.3,
          },
        },
        [ETH]: {
          fungible: true,
          marketCap: '400000000000',
          totalVolume: '20000000000',
          circulatingSupply: '120000000',
          allTimeHigh: '5000',
          allTimeLow: '0.43',
          pricePercentChange: {
            [PT1H]: 1.2,
            [P1D]: 3.5,
            [P7D]: 5.1,
          },
        },
        [SOL]: {
          fungible: true,
          marketCap: '80000000000',
          totalVolume: '3000000000',
          circulatingSupply: '400000000',
          allTimeHigh: '260',
          allTimeLow: '0.5',
          pricePercentChange: {
            [PT1H]: -0.8,
            [P1D]: 1.5,
            [P7D]: -2.3,
          },
        },
      };

      mockAssetsService.getAssetsMarketData.mockResolvedValue(mockMarketData);

      const result = await onAssetsMarketData(params);

      expect(logger.log).toHaveBeenCalledWith(
        '[💰 onAssetsMarketData]',
        params,
      );
      expect(mockAssetsService.getAssetsMarketData).toHaveBeenCalledWith(
        params.assets,
      );
      expect(result).toStrictEqual({ marketData: mockMarketData });
    });

    it('should return market data for crypto assets in different fiat currencies', async () => {
      const params = {
        assets: [
          { asset: BTC, unit: EUR },
          { asset: ETH, unit: USD },
        ],
      };

      const mockMarketData: Record<CaipAssetType, FungibleAssetMarketData> = {
        [BTC]: {
          fungible: true,
          marketCap: '850000000000',
          totalVolume: '42500000000',
          circulatingSupply: '19500000',
          allTimeHigh: '102000',
          allTimeLow: '57.64',
          pricePercentChange: {
            [PT1H]: 0.3,
            [P1D]: 1.8,
          },
        },
        [ETH]: {
          fungible: true,
          marketCap: '400000000000',
          totalVolume: '20000000000',
          circulatingSupply: '120000000',
          allTimeHigh: '5000',
          allTimeLow: '0.43',
          pricePercentChange: {
            [PT1H]: 1.2,
            [P1D]: 3.5,
          },
        },
      };

      mockAssetsService.getAssetsMarketData.mockResolvedValue(mockMarketData);

      const result = await onAssetsMarketData(params);

      expect(logger.log).toHaveBeenCalledWith(
        '[💰 onAssetsMarketData]',
        params,
      );
      expect(mockAssetsService.getAssetsMarketData).toHaveBeenCalledWith(
        params.assets,
      );
      expect(result).toStrictEqual({ marketData: mockMarketData });
    });

    it('should return market data with minimal fields when some data is missing', async () => {
      const params = {
        assets: [{ asset: BTC, unit: USD }],
      };

      const mockMarketData: Record<CaipAssetType, FungibleAssetMarketData> = {
        [BTC]: {
          fungible: true,
          marketCap: '1000000000000',
        },
      };

      mockAssetsService.getAssetsMarketData.mockResolvedValue(mockMarketData);

      const result = await onAssetsMarketData(params);

      expect(logger.log).toHaveBeenCalledWith(
        '[💰 onAssetsMarketData]',
        params,
      );
      expect(mockAssetsService.getAssetsMarketData).toHaveBeenCalledWith(
        params.assets,
      );
      expect(result).toStrictEqual({ marketData: mockMarketData });
    });

    it('should return empty market data when no assets are provided', async () => {
      const params = {
        assets: [],
      };

      const mockMarketData: Record<CaipAssetType, FungibleAssetMarketData> = {};

      mockAssetsService.getAssetsMarketData.mockResolvedValue(mockMarketData);

      const result = await onAssetsMarketData(params);

      expect(logger.log).toHaveBeenCalledWith(
        '[💰 onAssetsMarketData]',
        params,
      );
      expect(mockAssetsService.getAssetsMarketData).toHaveBeenCalledWith(
        params.assets,
      );
      expect(result).toStrictEqual({ marketData: mockMarketData });
    });

    it('should return market data with only price percent changes when other fields are null', async () => {
      const params = {
        assets: [{ asset: BTC, unit: USD }],
      };

      const mockMarketData: Record<CaipAssetType, FungibleAssetMarketData> = {
        [BTC]: {
          fungible: true,
          pricePercentChange: {
            [PT1H]: 0.5,
            [P1D]: 2.1,
            [P7D]: -1.2,
          },
        },
      };

      mockAssetsService.getAssetsMarketData.mockResolvedValue(mockMarketData);

      const result = await onAssetsMarketData(params);

      expect(logger.log).toHaveBeenCalledWith(
        '[💰 onAssetsMarketData]',
        params,
      );
      expect(mockAssetsService.getAssetsMarketData).toHaveBeenCalledWith(
        params.assets,
      );
      expect(result).toStrictEqual({ marketData: mockMarketData });
    });
  });

  describe('error scenarios', () => {
    it('should throw InternalError when assetsService.getAssetsMarketData throws an error', async () => {
      const params = {
        assets: [{ asset: BTC, unit: USD }],
      };

      const errorMessage = 'Failed to fetch market data';
      const mockError = new Error(errorMessage);
      mockAssetsService.getAssetsMarketData.mockRejectedValue(mockError);

      await expect(onAssetsMarketData(params)).rejects.toThrow(InternalError);

      expect(logger.log).toHaveBeenCalledWith(
        '[💰 onAssetsMarketData]',
        params,
      );
      expect(logger.error).toHaveBeenCalledWith(
        '[💰 onAssetsMarketData]',
        mockError,
      );
      expect(mockAssetsService.getAssetsMarketData).toHaveBeenCalledWith(
        params.assets,
      );
    });

    it('should throw InternalError when assetsService.getAssetsMarketData throws a network error', async () => {
      const params = {
        assets: [{ asset: ETH, unit: USD }],
      };

      const networkError = new Error('Network timeout');
      mockAssetsService.getAssetsMarketData.mockRejectedValue(networkError);

      await expect(onAssetsMarketData(params)).rejects.toThrow(InternalError);

      expect(logger.log).toHaveBeenCalledWith(
        '[💰 onAssetsMarketData]',
        params,
      );
      expect(logger.error).toHaveBeenCalledWith(
        '[💰 onAssetsMarketData]',
        networkError,
      );
      expect(mockAssetsService.getAssetsMarketData).toHaveBeenCalledWith(
        params.assets,
      );
    });

    it('should throw InternalError when assetsService.getAssetsMarketData throws a validation error', async () => {
      const params = {
        assets: [{ asset: 'invalid-asset-type' as CaipAssetType, unit: USD }],
      };

      const validationError = new Error('Invalid asset type');
      mockAssetsService.getAssetsMarketData.mockRejectedValue(validationError);

      await expect(onAssetsMarketData(params)).rejects.toThrow(InternalError);

      expect(logger.log).toHaveBeenCalledWith(
        '[💰 onAssetsMarketData]',
        params,
      );
      expect(logger.error).toHaveBeenCalledWith(
        '[💰 onAssetsMarketData]',
        validationError,
      );
      expect(mockAssetsService.getAssetsMarketData).toHaveBeenCalledWith(
        params.assets,
      );
    });

    it('should handle and re-throw InternalError when assetsService throws InternalError', async () => {
      const params = {
        assets: [{ asset: BTC, unit: USD }],
      };

      const internalError = new InternalError('Service unavailable');
      mockAssetsService.getAssetsMarketData.mockRejectedValue(internalError);

      await expect(onAssetsMarketData(params)).rejects.toThrow(InternalError);

      expect(logger.log).toHaveBeenCalledWith(
        '[💰 onAssetsMarketData]',
        params,
      );
      expect(logger.error).toHaveBeenCalledWith(
        '[💰 onAssetsMarketData]',
        internalError,
      );
      expect(mockAssetsService.getAssetsMarketData).toHaveBeenCalledWith(
        params.assets,
      );
    });
  });

  describe('edge cases', () => {
    it('should handle assets with special characters in asset types', async () => {
      const specialAsset =
        'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1/slip44:501' as CaipAssetType;
      const params = {
        assets: [{ asset: specialAsset, unit: USD }],
      };

      const mockMarketData: Record<CaipAssetType, FungibleAssetMarketData> = {
        [specialAsset]: {
          fungible: true,
          marketCap: '50000000',
          totalVolume: '2000000',
          circulatingSupply: '1000000',
        },
      };

      mockAssetsService.getAssetsMarketData.mockResolvedValue(mockMarketData);

      const result = await onAssetsMarketData(params);

      expect(logger.log).toHaveBeenCalledWith(
        '[💰 onAssetsMarketData]',
        params,
      );
      expect(mockAssetsService.getAssetsMarketData).toHaveBeenCalledWith(
        params.assets,
      );
      expect(result).toStrictEqual({ marketData: mockMarketData });
    });

    it('should handle very large numbers in market data', async () => {
      const params = {
        assets: [{ asset: BTC, unit: USD }],
      };

      const mockMarketData: Record<CaipAssetType, FungibleAssetMarketData> = {
        [BTC]: {
          fungible: true,
          marketCap: '999999999999999999999999999999',
          totalVolume: '123456789012345678901234567890',
          circulatingSupply: '21000000',
          allTimeHigh: '999999999999999999999999999999',
          allTimeLow: '0.000000000000000001',
          pricePercentChange: {
            [PT1H]: 999.99,
            [P1D]: -999.99,
          },
        },
      };

      mockAssetsService.getAssetsMarketData.mockResolvedValue(mockMarketData);

      const result = await onAssetsMarketData(params);

      expect(logger.log).toHaveBeenCalledWith(
        '[💰 onAssetsMarketData]',
        params,
      );
      expect(mockAssetsService.getAssetsMarketData).toHaveBeenCalledWith(
        params.assets,
      );
      expect(result).toStrictEqual({ marketData: mockMarketData });
    });

    it('should handle zero values in market data', async () => {
      const params = {
        assets: [{ asset: ETH, unit: USD }],
      };

      const mockMarketData: Record<CaipAssetType, FungibleAssetMarketData> = {
        [ETH]: {
          fungible: true,
          marketCap: '0',
          totalVolume: '0',
          circulatingSupply: '0',
          allTimeHigh: '0',
          allTimeLow: '0',
          pricePercentChange: {
            [PT1H]: 0,
            [P1D]: 0,
            [P7D]: 0,
          },
        },
      };

      mockAssetsService.getAssetsMarketData.mockResolvedValue(mockMarketData);

      const result = await onAssetsMarketData(params);

      expect(logger.log).toHaveBeenCalledWith(
        '[💰 onAssetsMarketData]',
        params,
      );
      expect(mockAssetsService.getAssetsMarketData).toHaveBeenCalledWith(
        params.assets,
      );
      expect(result).toStrictEqual({ marketData: mockMarketData });
    });
  });

  describe('logging behavior', () => {
    it('should log the input parameters correctly', async () => {
      const params = {
        assets: [
          { asset: BTC, unit: USD },
          { asset: ETH, unit: EUR },
        ],
      };

      const mockMarketData: Record<CaipAssetType, FungibleAssetMarketData> = {
        [BTC]: { fungible: true },
        [ETH]: { fungible: true },
      };

      mockAssetsService.getAssetsMarketData.mockResolvedValue(mockMarketData);

      await onAssetsMarketData(params);

      expect(logger.log).toHaveBeenCalledWith(
        '[💰 onAssetsMarketData]',
        params,
      );
    });

    it('should log errors correctly when service fails', async () => {
      const params = {
        assets: [{ asset: BTC, unit: USD }],
      };

      const error = new Error('Service error');
      mockAssetsService.getAssetsMarketData.mockRejectedValue(error);

      try {
        await onAssetsMarketData(params);
      } catch (thrownError) {
        // Expected to throw
      }

      expect(logger.log).toHaveBeenCalledWith(
        '[💰 onAssetsMarketData]',
        params,
      );
      expect(logger.error).toHaveBeenCalledWith(
        '[💰 onAssetsMarketData]',
        error,
      );
    });
  });
});
