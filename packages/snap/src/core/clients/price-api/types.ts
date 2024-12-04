export type PriceApiClientConfig = {
  baseUrl: string;
};

export type SpotPrice = {
  allTimeHigh?: number;
  allTimeLow?: number;
  circulatingSupply?: number;
  dilutedMarketCap?: number;
  high1d?: number;
  id?: string;
  low1d?: number;
  marketCap?: number;
  marketCapPercentChange1d?: number;
  price: number;
  priceChange1d?: number;
  pricePercentChange1d?: number;
  pricePercentChange1h?: number;
  pricePercentChange1y?: number;
  pricePercentChange7d?: number;
  pricePercentChange14d?: number;
  pricePercentChange30d?: number;
  pricePercentChange200d?: number;
  totalVolume?: number;
};
