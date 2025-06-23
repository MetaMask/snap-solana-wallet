import { InternalError } from '@metamask/snaps-sdk';
import type { CaipAssetType } from '@metamask/utils';

import { assetsService } from '../../../snapContext';
import type { FungibleAssetMarketData } from '../../services/assets/AssetsService';
import logger from '../../utils/logger';
import { onAssetsMarketData } from './onAssetsMarketData';

// Mock the dependencies
jest.mock('../../../snapContext', () => ({
  assetsService: {
    getAssetsMarketData: jest.fn(),
  },
}));

jest.mock('../../utils/logger', () => ({
  log: jest.fn(),
  error: jest.fn(),
}));

const mockAssetsService = assetsService as jest.Mocked<typeof assetsService>;
const mockLogger = logger as jest.Mocked<typeof logger>;

describe('onAssetsMarketData', () => {
  const mockSolAsset: CaipAssetType = 'solana:mainnet/slip44:501' as CaipAssetType;
  const mockUsdcAsset: CaipAssetType = 'solana:mainnet/erc20:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' as CaipAssetType;
  const mockUsdUnit: CaipAssetType = 'iso4217:USD' as CaipAssetType;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('successful operations', () => {
    it('should return market data for single asset', async () => {
      const params = {
        assets: [
          {
            asset: mockSolAsset,
            unit: mockUsdUnit,
          },
        ],
      };

      const expectedMarketData: Record<CaipAssetType, FungibleAssetMarketData> = {
        [mockSolAsset]: {
          fungible: true,
          marketCap: '50000000000',
          totalVolume: '2000000000',
          circulatingSupply: '500000000',
          allTimeHigh: '260.00',
          allTimeLow: '8.00',
          pricePercentChange: {
            'P1D': -2.5,
            'P7D': 15.2,
            'P30D': -8.1,
          },
        },
      };

      mockAssetsService.getAssetsMarketData.mockResolvedValue(expectedMarketData);

      const result = await onAssetsMarketData(params);

      expect(mockLogger.log).toHaveBeenCalledWith('[💰 onAssetsMarketData]', params);
      expect(mockAssetsService.getAssetsMarketData).toHaveBeenCalledWith(params.assets);
      expect(result).toEqual({ marketData: expectedMarketData });
    });

    it('should return market data for multiple assets', async () => {
      const params = {
        assets: [
          {
            asset: mockSolAsset,
            unit: mockUsdUnit,
          },
          {
            asset: mockUsdcAsset,
            unit: mockUsdUnit,
          },
        ],
      };

      const expectedMarketData: Record<CaipAssetType, FungibleAssetMarketData> = {
        [mockSolAsset]: {
          fungible: true,
          marketCap: '50000000000',
          totalVolume: '2000000000',
          circulatingSupply: '500000000',
          allTimeHigh: '260.00',
          allTimeLow: '8.00',
          pricePercentChange: {
            'P1D': -2.5,
            'P7D': 15.2,
          },
        },
        [mockUsdcAsset]: {
          fungible: true,
          marketCap: '32000000000',
          totalVolume: '5000000000',
          circulatingSupply: '32000000000',
          allTimeHigh: '1.05',
          allTimeLow: '0.95',
          pricePercentChange: {
            'P1D': 0.1,
            'P7D': -0.2,
            'P30D': 0.5,
          },
        },
      };

      mockAssetsService.getAssetsMarketData.mockResolvedValue(expectedMarketData);

      const result = await onAssetsMarketData(params);

      expect(mockAssetsService.getAssetsMarketData).toHaveBeenCalledWith(params.assets);
      expect(result).toEqual({ marketData: expectedMarketData });
    });

    it('should handle assets with minimal market data', async () => {
      const params = {
        assets: [
          {
            asset: mockSolAsset,
            unit: mockUsdUnit,
          },
        ],
      };

      const expectedMarketData: Record<CaipAssetType, FungibleAssetMarketData> = {
        [mockSolAsset]: {
          fungible: true,
        },
      };

      mockAssetsService.getAssetsMarketData.mockResolvedValue(expectedMarketData);

      const result = await onAssetsMarketData(params);

      expect(result).toEqual({ marketData: expectedMarketData });
    });

    it('should handle empty assets array', async () => {
      const params = {
        assets: [],
      };

      const expectedMarketData: Record<CaipAssetType, FungibleAssetMarketData> = {};

      mockAssetsService.getAssetsMarketData.mockResolvedValue(expectedMarketData);

      const result = await onAssetsMarketData(params);

      expect(mockAssetsService.getAssetsMarketData).toHaveBeenCalledWith([]);
      expect(result).toEqual({ marketData: expectedMarketData });
    });

    it('should handle assets with different units', async () => {
      const mockEurUnit: CaipAssetType = 'iso4217:EUR' as CaipAssetType;
      
      const params = {
        assets: [
          {
            asset: mockSolAsset,
            unit: mockUsdUnit,
          },
          {
            asset: mockSolAsset,
            unit: mockEurUnit,
          },
        ],
      };

      const expectedMarketData: Record<CaipAssetType, FungibleAssetMarketData> = {
        [mockSolAsset]: {
          fungible: true,
          marketCap: '46000000000', // Different values in EUR
          totalVolume: '1800000000',
          circulatingSupply: '500000000',
        },
      };

      mockAssetsService.getAssetsMarketData.mockResolvedValue(expectedMarketData);

      const result = await onAssetsMarketData(params);

      expect(mockAssetsService.getAssetsMarketData).toHaveBeenCalledWith(params.assets);
      expect(result).toEqual({ marketData: expectedMarketData });
    });

    it('should handle assets with complete market data including all price changes', async () => {
      const params = {
        assets: [
          {
            asset: mockSolAsset,
            unit: mockUsdUnit,
          },
        ],
      };

      const expectedMarketData: Record<CaipAssetType, FungibleAssetMarketData> = {
        [mockSolAsset]: {
          fungible: true,
          marketCap: '50000000000',
          totalVolume: '2000000000',
          circulatingSupply: '500000000',
          allTimeHigh: '260.00',
          allTimeLow: '8.00',
          pricePercentChange: {
            'PT1H': 0.5,
            'P1D': -2.5,
            'P7D': 15.2,
            'P14D': 8.7,
            'P30D': -8.1,
            'P200D': 125.4,
            'P1Y': 89.2,
          },
        },
      };

      mockAssetsService.getAssetsMarketData.mockResolvedValue(expectedMarketData);

      const result = await onAssetsMarketData(params);

      expect(result.marketData[mockSolAsset]).toHaveProperty('pricePercentChange');
      expect(result.marketData[mockSolAsset].pricePercentChange).toHaveProperty('PT1H', 0.5);
      expect(result.marketData[mockSolAsset].pricePercentChange).toHaveProperty('P1Y', 89.2);
    });
  });

  describe('error handling', () => {
    it('should handle service errors and throw InternalError', async () => {
      const params = {
        assets: [
          {
            asset: mockSolAsset,
            unit: mockUsdUnit,
          },
        ],
      };

      const serviceError = new Error('Service unavailable');
      mockAssetsService.getAssetsMarketData.mockRejectedValue(serviceError);

      await expect(onAssetsMarketData(params)).rejects.toThrow(InternalError);

      expect(mockLogger.error).toHaveBeenCalledWith('[💰 onAssetsMarketData]', serviceError);
    });

    it('should handle network errors', async () => {
      const params = {
        assets: [
          {
            asset: mockSolAsset,
            unit: mockUsdUnit,
          },
        ],
      };

      const networkError = new Error('Network timeout');
      mockAssetsService.getAssetsMarketData.mockRejectedValue(networkError);

      await expect(onAssetsMarketData(params)).rejects.toThrow(InternalError);

      expect(mockLogger.error).toHaveBeenCalledWith('[💰 onAssetsMarketData]', networkError);
    });

    it('should handle invalid asset format gracefully through service', async () => {
      const params = {
        assets: [
          {
            asset: 'invalid:asset:format' as CaipAssetType,
            unit: mockUsdUnit,
          },
        ],
      };

      const validationError = new Error('Invalid asset format');
      mockAssetsService.getAssetsMarketData.mockRejectedValue(validationError);

      await expect(onAssetsMarketData(params)).rejects.toThrow(InternalError);

      expect(mockLogger.error).toHaveBeenCalledWith('[💰 onAssetsMarketData]', validationError);
    });

    it('should preserve error context when wrapping in InternalError', async () => {
      const params = {
        assets: [
          {
            asset: mockSolAsset,
            unit: mockUsdUnit,
          },
        ],
      };

      const originalError = new Error('Price API rate limit exceeded');
      mockAssetsService.getAssetsMarketData.mockRejectedValue(originalError);

      try {
        await onAssetsMarketData(params);
        fail('Expected InternalError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(InternalError);
        expect(mockLogger.error).toHaveBeenCalledWith('[💰 onAssetsMarketData]', originalError);
      }
    });
  });

  describe('logging', () => {
    it('should log the input parameters', async () => {
      const params = {
        assets: [
          {
            asset: mockSolAsset,
            unit: mockUsdUnit,
          },
        ],
      };

      mockAssetsService.getAssetsMarketData.mockResolvedValue({});

      await onAssetsMarketData(params);

      expect(mockLogger.log).toHaveBeenCalledWith('[💰 onAssetsMarketData]', params);
    });

    it('should log errors when they occur', async () => {
      const params = {
        assets: [
          {
            asset: mockSolAsset,
            unit: mockUsdUnit,
          },
        ],
      };

      const error = new Error('Test error');
      mockAssetsService.getAssetsMarketData.mockRejectedValue(error);

      try {
        await onAssetsMarketData(params);
      } catch {
        // Expected to throw
      }

      expect(mockLogger.error).toHaveBeenCalledWith('[💰 onAssetsMarketData]', error);
    });
  });

  describe('integration with AssetsService', () => {
    it('should pass the correct parameters to AssetsService.getAssetsMarketData', async () => {
      const complexParams = {
        assets: [
          {
            asset: mockSolAsset,
            unit: mockUsdUnit,
          },
          {
            asset: mockUsdcAsset,
            unit: 'iso4217:EUR' as CaipAssetType,
          },
          {
            asset: 'solana:devnet/slip44:501' as CaipAssetType,
            unit: 'iso4217:GBP' as CaipAssetType,
          },
        ],
      };

      mockAssetsService.getAssetsMarketData.mockResolvedValue({});

      await onAssetsMarketData(complexParams);

      expect(mockAssetsService.getAssetsMarketData).toHaveBeenCalledTimes(1);
      expect(mockAssetsService.getAssetsMarketData).toHaveBeenCalledWith(complexParams.assets);
    });

    it('should return the exact response from AssetsService', async () => {
      const params = {
        assets: [
          {
            asset: mockSolAsset,
            unit: mockUsdUnit,
          },
        ],
      };

      const serviceResponse: Record<CaipAssetType, FungibleAssetMarketData> = {
        [mockSolAsset]: {
          fungible: true,
          marketCap: '50000000000',
          totalVolume: '2000000000',
        },
      };

      mockAssetsService.getAssetsMarketData.mockResolvedValue(serviceResponse);

      const result = await onAssetsMarketData(params);

      expect(result.marketData).toBe(serviceResponse);
      expect(result.marketData).toEqual(serviceResponse);
    });
  });
});