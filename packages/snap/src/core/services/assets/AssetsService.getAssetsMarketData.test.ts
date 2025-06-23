import type { CaipAssetType } from '@metamask/utils';
import BigNumber from 'bignumber.js';

import type { SpotPrice } from '../../clients/price-api/types';
import { InMemoryCache } from '../../caching/InMemoryCache';
import { Network } from '../../constants/solana';
import type { Serializable } from '../../serialization/types';
import logger from '../../utils/logger';
import type { ConfigProvider } from '../config';
import type { SolanaConnection } from '../connection';
import { InMemoryState } from '../state/InMemoryState';
import type { IStateManager } from '../state/IStateManager';
import { DEFAULT_UNENCRYPTED_STATE, type UnencryptedStateValue } from '../state/State';
import type { TokenMetadataService } from '../token-metadata/TokenMetadata';
import type { TokenPricesService } from '../token-prices/TokenPrices';
import { AssetsService, type FungibleAssetMarketData } from './AssetsService';

// Mock TokenPricesService to avoid circular dependencies
const mockTokenPricesService = {
  getMultipleTokenConversions: jest.fn(),
} as jest.Mocked<TokenPricesService>;

// Mock the require calls in the AssetsService
jest.mock('../../../snapContext', () => ({
  priceApiClient: {},
}));

jest.mock('../token-prices/TokenPrices', () => ({
  TokenPricesService: jest.fn().mockImplementation(() => mockTokenPricesService),
}));

describe('AssetsService.getAssetsMarketData', () => {
  let assetsService: AssetsService;
  let mockConnection: SolanaConnection;
  let mockConfigProvider: ConfigProvider;
  let mockTokenMetadataService: TokenMetadataService;
  let mockState: IStateManager<UnencryptedStateValue>;
  let mockCache: any;

  const mockSolAsset: CaipAssetType = 'solana:mainnet/slip44:501' as CaipAssetType;
  const mockUsdcAsset: CaipAssetType = 'solana:mainnet/erc20:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' as CaipAssetType;
  const mockUsdUnit: CaipAssetType = 'iso4217:USD' as CaipAssetType;
  const mockEurUnit: CaipAssetType = 'iso4217:EUR' as CaipAssetType;

  beforeEach(() => {
    jest.clearAllMocks();

    mockConnection = {} as SolanaConnection;
    mockConfigProvider = {
      get: jest.fn().mockReturnValue({
        activeNetworks: [Network.Mainnet],
      }),
    } as unknown as ConfigProvider;

    mockTokenMetadataService = {
      getTokensMetadata: jest.fn(),
    } as unknown as TokenMetadataService;

    mockState = new InMemoryState(DEFAULT_UNENCRYPTED_STATE);
    mockCache = new InMemoryCache();

    assetsService = new AssetsService({
      connection: mockConnection,
      logger,
      configProvider: mockConfigProvider,
      state: mockState,
      tokenMetadataService: mockTokenMetadataService,
      cache: mockCache,
    });
  });

  describe('successful operations', () => {
    it('should return empty object for empty assets array', async () => {
      const result = await assetsService.getAssetsMarketData([]);

      expect(result).toEqual({});
      expect(mockTokenPricesService.getMultipleTokenConversions).not.toHaveBeenCalled();
    });

    it('should return market data for single asset', async () => {
      const assets = [
        {
          asset: mockSolAsset,
          unit: mockUsdUnit,
        },
      ];

      const mockConversionData = {
        [mockSolAsset]: {
          [mockUsdUnit]: {
            rate: '150.00',
            conversionTime: Date.now(),
            expirationTime: Date.now() + 3600000,
            marketData: {
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
          },
        },
      };

      mockTokenPricesService.getMultipleTokenConversions.mockResolvedValue(mockConversionData);

      const result = await assetsService.getAssetsMarketData(assets);

      expect(mockTokenPricesService.getMultipleTokenConversions).toHaveBeenCalledWith(
        [{ from: mockSolAsset, to: mockUsdUnit }],
        true,
      );

      expect(result).toEqual({
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
      });
    });

    it('should return market data for multiple assets', async () => {
      const assets = [
        {
          asset: mockSolAsset,
          unit: mockUsdUnit,
        },
        {
          asset: mockUsdcAsset,
          unit: mockUsdUnit,
        },
      ];

      const mockConversionData = {
        [mockSolAsset]: {
          [mockUsdUnit]: {
            rate: '150.00',
            conversionTime: Date.now(),
            expirationTime: Date.now() + 3600000,
            marketData: {
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
          },
        },
        [mockUsdcAsset]: {
          [mockUsdUnit]: {
            rate: '1.00',
            conversionTime: Date.now(),
            expirationTime: Date.now() + 3600000,
            marketData: {
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
          },
        },
      };

      mockTokenPricesService.getMultipleTokenConversions.mockResolvedValue(mockConversionData);

      const result = await assetsService.getAssetsMarketData(assets);

      expect(result).toHaveProperty(mockSolAsset);
      expect(result).toHaveProperty(mockUsdcAsset);
      expect(result[mockSolAsset]).toHaveProperty('fungible', true);
      expect(result[mockUsdcAsset]).toHaveProperty('fungible', true);
    });

    it('should handle assets with different units', async () => {
      const assets = [
        {
          asset: mockSolAsset,
          unit: mockUsdUnit,
        },
        {
          asset: mockSolAsset,
          unit: mockEurUnit,
        },
      ];

      const mockConversionData = {
        [mockSolAsset]: {
          [mockUsdUnit]: {
            rate: '150.00',
            conversionTime: Date.now(),
            expirationTime: Date.now() + 3600000,
            marketData: {
              marketCap: '50000000000',
              totalVolume: '2000000000',
              circulatingSupply: '500000000',
            },
          },
          [mockEurUnit]: {
            rate: '138.00',
            conversionTime: Date.now(),
            expirationTime: Date.now() + 3600000,
            marketData: {
              marketCap: '46000000000',
              totalVolume: '1800000000',
              circulatingSupply: '500000000',
            },
          },
        },
      };

      mockTokenPricesService.getMultipleTokenConversions.mockResolvedValue(mockConversionData);

      const result = await assetsService.getAssetsMarketData(assets);

      expect(mockTokenPricesService.getMultipleTokenConversions).toHaveBeenCalledWith(
        [
          { from: mockSolAsset, to: mockUsdUnit },
          { from: mockSolAsset, to: mockEurUnit },
        ],
        true,
      );

      // Note: The result would only contain one entry per asset, not per asset-unit pair
      // This is because the result is indexed by asset, not by asset-unit combination
      expect(result).toHaveProperty(mockSolAsset);
      expect(result[mockSolAsset]).toHaveProperty('fungible', true);
    });

    it('should handle assets with minimal market data', async () => {
      const assets = [
        {
          asset: mockSolAsset,
          unit: mockUsdUnit,
        },
      ];

      const mockConversionData = {
        [mockSolAsset]: {
          [mockUsdUnit]: {
            rate: '150.00',
            conversionTime: Date.now(),
            expirationTime: Date.now() + 3600000,
            marketData: {
              marketCap: '',
              totalVolume: '',
              circulatingSupply: '500000000',
              allTimeHigh: '',
              allTimeLow: '',
            },
          },
        },
      };

      mockTokenPricesService.getMultipleTokenConversions.mockResolvedValue(mockConversionData);

      const result = await assetsService.getAssetsMarketData(assets);

      expect(result).toEqual({
        [mockSolAsset]: {
          fungible: true,
          circulatingSupply: '500000000',
        },
      });
    });

    it('should handle assets with no market data', async () => {
      const assets = [
        {
          asset: mockSolAsset,
          unit: mockUsdUnit,
        },
      ];

      const mockConversionData = {
        [mockSolAsset]: {
          [mockUsdUnit]: {
            rate: '150.00',
            conversionTime: Date.now(),
            expirationTime: Date.now() + 3600000,
          },
        },
      };

      mockTokenPricesService.getMultipleTokenConversions.mockResolvedValue(mockConversionData);

      const result = await assetsService.getAssetsMarketData(assets);

      expect(result).toEqual({
        [mockSolAsset]: {
          fungible: true,
        },
      });
    });

    it('should handle assets with null conversion data', async () => {
      const assets = [
        {
          asset: mockSolAsset,
          unit: mockUsdUnit,
        },
      ];

      const mockConversionData = {
        [mockSolAsset]: {
          [mockUsdUnit]: null,
        },
      };

      mockTokenPricesService.getMultipleTokenConversions.mockResolvedValue(mockConversionData);

      const result = await assetsService.getAssetsMarketData(assets);

      expect(result).toEqual({
        [mockSolAsset]: {
          fungible: true,
        },
      });
    });

    it('should filter out invalid pricePercentChange values', async () => {
      const assets = [
        {
          asset: mockSolAsset,
          unit: mockUsdUnit,
        },
      ];

      const mockConversionData = {
        [mockSolAsset]: {
          [mockUsdUnit]: {
            rate: '150.00',
            conversionTime: Date.now(),
            expirationTime: Date.now() + 3600000,
            marketData: {
              marketCap: '50000000000',
              pricePercentChange: {
                'P1D': -2.5,
                'P7D': null, // Should be filtered out
                'P30D': undefined, // Should be filtered out
                'P1Y': 'invalid', // Should be filtered out
                'PT1H': 0.5,
              },
            },
          },
        },
      };

      mockTokenPricesService.getMultipleTokenConversions.mockResolvedValue(mockConversionData);

      const result = await assetsService.getAssetsMarketData(assets);

      expect(result[mockSolAsset].pricePercentChange).toEqual({
        'P1D': -2.5,
        'PT1H': 0.5,
      });
    });

    it('should omit pricePercentChange if no valid values', async () => {
      const assets = [
        {
          asset: mockSolAsset,
          unit: mockUsdUnit,
        },
      ];

      const mockConversionData = {
        [mockSolAsset]: {
          [mockUsdUnit]: {
            rate: '150.00',
            conversionTime: Date.now(),
            expirationTime: Date.now() + 3600000,
            marketData: {
              marketCap: '50000000000',
              pricePercentChange: {
                'P1D': null,
                'P7D': undefined,
                'P30D': 'invalid',
              },
            },
          },
        },
      };

      mockTokenPricesService.getMultipleTokenConversions.mockResolvedValue(mockConversionData);

      const result = await assetsService.getAssetsMarketData(assets);

      expect(result[mockSolAsset]).not.toHaveProperty('pricePercentChange');
    });
  });

  describe('error handling', () => {
    it('should propagate TokenPricesService errors', async () => {
      const assets = [
        {
          asset: mockSolAsset,
          unit: mockUsdUnit,
        },
      ];

      const error = new Error('Price API error');
      mockTokenPricesService.getMultipleTokenConversions.mockRejectedValue(error);

      await expect(assetsService.getAssetsMarketData(assets)).rejects.toThrow('Price API error');
    });

    it('should handle network timeout errors', async () => {
      const assets = [
        {
          asset: mockSolAsset,
          unit: mockUsdUnit,
        },
      ];

      const error = new Error('Network timeout');
      mockTokenPricesService.getMultipleTokenConversions.mockRejectedValue(error);

      await expect(assetsService.getAssetsMarketData(assets)).rejects.toThrow('Network timeout');
    });

    it('should handle rate limiting errors', async () => {
      const assets = [
        {
          asset: mockSolAsset,
          unit: mockUsdUnit,
        },
      ];

      const error = new Error('Rate limit exceeded');
      mockTokenPricesService.getMultipleTokenConversions.mockRejectedValue(error);

      await expect(assetsService.getAssetsMarketData(assets)).rejects.toThrow('Rate limit exceeded');
    });
  });

  describe('edge cases', () => {
    it('should handle malformed market data gracefully', async () => {
      const assets = [
        {
          asset: mockSolAsset,
          unit: mockUsdUnit,
        },
      ];

      const mockConversionData = {
        [mockSolAsset]: {
          [mockUsdUnit]: {
            rate: '150.00',
            conversionTime: Date.now(),
            expirationTime: Date.now() + 3600000,
            marketData: {
              marketCap: 123, // Number instead of string
              totalVolume: null,
              circulatingSupply: undefined,
              allTimeHigh: false, // Boolean instead of string
              allTimeLow: '',
              pricePercentChange: 'not an object', // Invalid type
            },
          },
        },
      };

      mockTokenPricesService.getMultipleTokenConversions.mockResolvedValue(mockConversionData);

      const result = await assetsService.getAssetsMarketData(assets);

      // Should still return a basic fungible asset structure
      expect(result).toEqual({
        [mockSolAsset]: {
          fungible: true,
        },
      });
    });

    it('should handle missing asset data in conversion result', async () => {
      const assets = [
        {
          asset: mockSolAsset,
          unit: mockUsdUnit,
        },
        {
          asset: mockUsdcAsset,
          unit: mockUsdUnit,
        },
      ];

      const mockConversionData = {
        [mockSolAsset]: {
          [mockUsdUnit]: {
            rate: '150.00',
            conversionTime: Date.now(),
            expirationTime: Date.now() + 3600000,
            marketData: {
              marketCap: '50000000000',
            },
          },
        },
        // Missing mockUsdcAsset data
      };

      mockTokenPricesService.getMultipleTokenConversions.mockResolvedValue(mockConversionData);

      const result = await assetsService.getAssetsMarketData(assets);

      expect(result).toEqual({
        [mockSolAsset]: {
          fungible: true,
          marketCap: '50000000000',
        },
        [mockUsdcAsset]: {
          fungible: true,
        },
      });
    });

    it('should handle empty conversion result', async () => {
      const assets = [
        {
          asset: mockSolAsset,
          unit: mockUsdUnit,
        },
      ];

      mockTokenPricesService.getMultipleTokenConversions.mockResolvedValue({});

      const result = await assetsService.getAssetsMarketData(assets);

      expect(result).toEqual({
        [mockSolAsset]: {
          fungible: true,
        },
      });
    });
  });

  describe('parameter validation', () => {
    it('should call TokenPricesService with correct parameters', async () => {
      const assets = [
        {
          asset: mockSolAsset,
          unit: mockUsdUnit,
        },
        {
          asset: mockUsdcAsset,
          unit: mockEurUnit,
        },
      ];

      mockTokenPricesService.getMultipleTokenConversions.mockResolvedValue({});

      await assetsService.getAssetsMarketData(assets);

      expect(mockTokenPricesService.getMultipleTokenConversions).toHaveBeenCalledWith(
        [
          { from: mockSolAsset, to: mockUsdUnit },
          { from: mockUsdcAsset, to: mockEurUnit },
        ],
        true, // includeMarketData should always be true
      );
    });

    it('should handle duplicate asset-unit pairs', async () => {
      const assets = [
        {
          asset: mockSolAsset,
          unit: mockUsdUnit,
        },
        {
          asset: mockSolAsset,
          unit: mockUsdUnit,
        },
      ];

      mockTokenPricesService.getMultipleTokenConversions.mockResolvedValue({});

      await assetsService.getAssetsMarketData(assets);

      expect(mockTokenPricesService.getMultipleTokenConversions).toHaveBeenCalledWith(
        [
          { from: mockSolAsset, to: mockUsdUnit },
          { from: mockSolAsset, to: mockUsdUnit },
        ],
        true,
      );
    });
  });
});