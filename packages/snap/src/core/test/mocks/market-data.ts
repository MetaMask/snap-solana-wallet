import type { FungibleAssetMarketData } from '@metamask/snaps-sdk';
import type { CaipAssetType } from '@metamask/utils';

// Common asset types for testing
export const TEST_ASSET_TYPES = {
  BTC: 'bip122:000000000019d6689c085ae165831e93/slip44:0' as CaipAssetType,
  ETH: 'eip155:1/slip44:60' as CaipAssetType,
  SOL: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501' as CaipAssetType,
  USDC: 'eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as CaipAssetType,
  USD: 'swift:0/iso4217:USD' as CaipAssetType,
  EUR: 'swift:0/iso4217:EUR' as CaipAssetType,
  GBP: 'swift:0/iso4217:GBP' as CaipAssetType,
  SPECIAL_SOL:
    'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1/slip44:501' as CaipAssetType,
} as const;

// ISO 8601 duration constants
export const ISO_DURATIONS = {
  PT1H: 'PT1H',
  P1D: 'P1D',
  P7D: 'P7D',
  P14D: 'P14D',
  P30D: 'P30D',
  P200D: 'P200D',
  P1Y: 'P1Y',
} as const;

// Mock market data for different scenarios
export const MOCK_MARKET_DATA: Record<CaipAssetType, FungibleAssetMarketData> =
  {
    [TEST_ASSET_TYPES.BTC]: {
      fungible: true,
      marketCap: '1000000000000',
      totalVolume: '50000000000',
      circulatingSupply: '19500000',
      allTimeHigh: '120000',
      allTimeLow: '67.81',
      pricePercentChange: {
        [ISO_DURATIONS.PT1H]: 0.5,
        [ISO_DURATIONS.P1D]: 2.1,
        [ISO_DURATIONS.P7D]: -1.2,
        [ISO_DURATIONS.P30D]: 15.3,
        [ISO_DURATIONS.P200D]: 45.1,
        [ISO_DURATIONS.P1Y]: 21.4,
      },
    },
    [TEST_ASSET_TYPES.ETH]: {
      fungible: true,
      marketCap: '400000000000',
      totalVolume: '20000000000',
      circulatingSupply: '120000000',
      allTimeHigh: '5000',
      allTimeLow: '0.43',
      pricePercentChange: {
        [ISO_DURATIONS.PT1H]: 1.2,
        [ISO_DURATIONS.P1D]: 3.5,
        [ISO_DURATIONS.P7D]: 5.1,
        [ISO_DURATIONS.P30D]: 8.7,
      },
    },
    [TEST_ASSET_TYPES.SOL]: {
      fungible: true,
      marketCap: '80000000000',
      totalVolume: '3000000000',
      circulatingSupply: '400000000',
      allTimeHigh: '260',
      allTimeLow: '0.5',
      pricePercentChange: {
        [ISO_DURATIONS.PT1H]: -0.8,
        [ISO_DURATIONS.P1D]: 1.5,
        [ISO_DURATIONS.P7D]: -2.3,
      },
    },
    [TEST_ASSET_TYPES.USDC]: {
      fungible: true,
      marketCap: '25000000000',
      totalVolume: '1500000000',
      circulatingSupply: '25000000000',
      allTimeHigh: '1.05',
      allTimeLow: '0.95',
      pricePercentChange: {
        [ISO_DURATIONS.PT1H]: 0.01,
        [ISO_DURATIONS.P1D]: 0.02,
        [ISO_DURATIONS.P7D]: 0.05,
      },
    },
    [TEST_ASSET_TYPES.SPECIAL_SOL]: {
      fungible: true,
      marketCap: '50000000',
      totalVolume: '2000000',
      circulatingSupply: '1000000',
    },
  };

// Mock market data for different currencies
export const MOCK_MARKET_DATA_EUR: Record<
  CaipAssetType,
  FungibleAssetMarketData
> = {
  [TEST_ASSET_TYPES.BTC]: {
    fungible: true,
    marketCap: '850000000000',
    totalVolume: '42500000000',
    circulatingSupply: '19500000',
    allTimeHigh: '102000',
    allTimeLow: '57.64',
    pricePercentChange: {
      [ISO_DURATIONS.PT1H]: 0.3,
      [ISO_DURATIONS.P1D]: 1.8,
    },
  },
  [TEST_ASSET_TYPES.ETH]: {
    fungible: true,
    marketCap: '340000000000',
    totalVolume: '17000000000',
    circulatingSupply: '120000000',
    allTimeHigh: '4250',
    allTimeLow: '0.37',
    pricePercentChange: {
      [ISO_DURATIONS.PT1H]: 1.0,
      [ISO_DURATIONS.P1D]: 3.0,
    },
  },
};

// Mock market data with minimal fields
export const MOCK_MARKET_DATA_MINIMAL: Record<
  CaipAssetType,
  FungibleAssetMarketData
> = {
  [TEST_ASSET_TYPES.BTC]: {
    fungible: true,
    marketCap: '1000000000000',
    // Missing other fields
  },
  [TEST_ASSET_TYPES.ETH]: {
    fungible: true,
    // Only fungible field
  },
};

// Mock market data with only price percent changes
export const MOCK_MARKET_DATA_PRICE_CHANGES_ONLY: Record<
  CaipAssetType,
  FungibleAssetMarketData
> = {
  [TEST_ASSET_TYPES.BTC]: {
    fungible: true,
    pricePercentChange: {
      [ISO_DURATIONS.PT1H]: 0.5,
      [ISO_DURATIONS.P1D]: 2.1,
      [ISO_DURATIONS.P7D]: -1.2,
    },
  },
};

// Mock market data with zero values
export const MOCK_MARKET_DATA_ZERO_VALUES: Record<
  CaipAssetType,
  FungibleAssetMarketData
> = {
  [TEST_ASSET_TYPES.ETH]: {
    fungible: true,
    marketCap: '0',
    totalVolume: '0',
    circulatingSupply: '0',
    allTimeHigh: '0',
    allTimeLow: '0',
    pricePercentChange: {
      [ISO_DURATIONS.PT1H]: 0,
      [ISO_DURATIONS.P1D]: 0,
      [ISO_DURATIONS.P7D]: 0,
    },
  },
};

// Mock market data with very large numbers
export const MOCK_MARKET_DATA_LARGE_NUMBERS: Record<
  CaipAssetType,
  FungibleAssetMarketData
> = {
  [TEST_ASSET_TYPES.BTC]: {
    fungible: true,
    marketCap: '999999999999999999999999999999',
    totalVolume: '123456789012345678901234567890',
    circulatingSupply: '21000000',
    allTimeHigh: '999999999999999999999999999999',
    allTimeLow: '0.000000000000000001',
    pricePercentChange: {
      [ISO_DURATIONS.PT1H]: 999.99,
      [ISO_DURATIONS.P1D]: -999.99,
    },
  },
};

// Mock asset request parameters
export const MOCK_ASSET_REQUESTS = {
  SINGLE_BTC_USD: [{ asset: TEST_ASSET_TYPES.BTC, unit: TEST_ASSET_TYPES.USD }],
  MULTIPLE_CRYPTO_USD: [
    { asset: TEST_ASSET_TYPES.BTC, unit: TEST_ASSET_TYPES.USD },
    { asset: TEST_ASSET_TYPES.ETH, unit: TEST_ASSET_TYPES.USD },
    { asset: TEST_ASSET_TYPES.SOL, unit: TEST_ASSET_TYPES.USD },
  ],
  MIXED_CURRENCIES: [
    { asset: TEST_ASSET_TYPES.BTC, unit: TEST_ASSET_TYPES.EUR },
    { asset: TEST_ASSET_TYPES.ETH, unit: TEST_ASSET_TYPES.USD },
  ],
  EMPTY: [],
  SPECIAL_CHARACTERS: [
    { asset: TEST_ASSET_TYPES.SPECIAL_SOL, unit: TEST_ASSET_TYPES.USD },
  ],
} as const;

// Helper function to create mock market data for specific assets
export const createMockMarketData = (
  assets: CaipAssetType[],
  dataSource: Record<CaipAssetType, FungibleAssetMarketData> = MOCK_MARKET_DATA,
): Record<CaipAssetType, FungibleAssetMarketData> => {
  const result: Record<CaipAssetType, FungibleAssetMarketData> = {};

  for (const asset of assets) {
    if (dataSource[asset]) {
      result[asset] = dataSource[asset];
    }
  }

  return result;
};

// Helper function to create mock asset requests
export const createMockAssetRequest = (
  assets: { asset: CaipAssetType; unit: CaipAssetType }[],
) => ({
  assets,
});

// Mock error scenarios
export const MOCK_ERRORS = {
  NETWORK_TIMEOUT: new Error('Network timeout'),
  INVALID_ASSET_TYPE: new Error('Invalid asset type'),
  SERVICE_UNAVAILABLE: new Error('Service unavailable'),
  RATE_LIMIT_EXCEEDED: new Error('Rate limit exceeded'),
} as const;
