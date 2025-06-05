import { KnownCaip19Id, Network, Networks } from '../../core/domain';
import QUESTION_MARK_SVG from '../../core/img/question-mark.svg';
import { DEFAULT_SEND_CONTEXT } from './render';
import {
  getNativeTokenPrice,
  getSelectedTokenMetadata,
  getSelectedTokenPrice,
  getTokenAmount,
} from './selectors';
import type { SendContext } from './types';
import { SendCurrencyType } from './types';

describe('Send selectors', () => {
  const mockTokenCaipId = KnownCaip19Id.UsdcLocalnet;
  const mockContext: SendContext = {
    ...DEFAULT_SEND_CONTEXT,
    amount: '100',
    tokenPrices: {
      [mockTokenCaipId]: {
        id: 'usd-coin',
        price: 2,
        marketCap: 55664178509.26305,
        allTimeHigh: 1.084554895901498,
        allTimeLow: 0.8135524365156085,
        totalVolume: 9422406824.740463,
        high1d: 0.9269644346770277,
        low1d: 0.926739180967879,
        circulatingSupply: 60049607340.55973,
        dilutedMarketCap: 55715589401.733986,
        marketCapPercentChange1d: -0.01464,
        priceChange1d: -0.000001640813751647,
        pricePercentChange1h: 0.003262897712363837,
        pricePercentChange1d: -0.00016408418291423345,
        pricePercentChange7d: 0.009232558804102214,
        pricePercentChange14d: 0.012592906902478116,
        pricePercentChange30d: 0.008125567116924248,
        pricePercentChange200d: -0.012339503258443628,
        pricePercentChange1y: -0.0001641868647780945,
        bondingCurveProgressPercent: null,
        liquidity: null,
        totalSupply: null,
        holderCount: null,
        isMutable: null,
      },
      [Networks[Network.Mainnet].nativeToken.caip19Id]: {
        id: 'solana',
        price: 50,
        marketCap: 60616788101.97389,
        allTimeHigh: 271.88956967253705,
        allTimeLow: 0.4642275012156975,
        totalVolume: 3363833590.4901085,
        high1d: 120.27435704548662,
        low1d: 114.61984006685489,
        circulatingSupply: 512506456.9100605,
        dilutedMarketCap: 70673814622.89714,
        marketCapPercentChange1d: 2.65784,
        priceChange1d: 3.76,
        pricePercentChange1h: -0.1991040003642417,
        pricePercentChange1d: 3.0304256401948635,
        pricePercentChange7d: -10.23628144764743,
        pricePercentChange14d: 3.420785507329618,
        pricePercentChange30d: -10.774354508031294,
        pricePercentChange200d: -3.649484892677309,
        pricePercentChange1y: -34.78708964545803,
        bondingCurveProgressPercent: null,
        liquidity: null,
        totalSupply: null,
        holderCount: null,
        isMutable: null,
      },
    },
    tokenCaipId: mockTokenCaipId,
    currencyType: SendCurrencyType.TOKEN,
    selectedTokenMetadata: {
      symbol: 'USDC',
      imageSvg: 'test-image.svg',
      name: 'USD Coin',
      asset: mockTokenCaipId,
    },
    scope: Network.Mainnet,
  };

  describe('getTokenAmount', () => {
    it('returns amount directly when currency type is TOKEN', () => {
      const result = getTokenAmount(mockContext);
      expect(result).toBe('100');
    });

    it('converts USD amount to token amount when currency type is USD', () => {
      const usdContext = {
        ...mockContext,
        currencyType: SendCurrencyType.FIAT,
        amount: '200',
      };
      const result = getTokenAmount(usdContext);
      expect(result).toBe('100'); // 200 USD / 2 USD per token = 100 tokens
    });

    it('throws an error when token price is missing and currency type is fiat', () => {
      const noPriceContext = {
        ...mockContext,
        currencyType: SendCurrencyType.FIAT,
        tokenPrices: {},
      };
      expect(() => getTokenAmount(noPriceContext)).toThrow(
        'Token price is undefined, cannot convert to fiat amount.',
      );
    });
  });

  describe('getSelectedTokenMetadata', () => {
    it('returns token metadata with required fields', () => {
      const result = getSelectedTokenMetadata(mockContext);
      expect(result).toStrictEqual({
        ...mockContext.selectedTokenMetadata,
        tokenSymbol: 'USDC',
        tokenImage: 'test-image.svg',
      });
    });

    it('returns default values when token metadata is missing', () => {
      const noMetadataContext = {
        ...mockContext,
        selectedTokenMetadata: null,
      };
      const result = getSelectedTokenMetadata(noMetadataContext);
      expect(result).toStrictEqual({
        tokenSymbol: 'UNKNOWN',
        tokenImage: QUESTION_MARK_SVG,
      });
    });
  });

  describe('getSelectedTokenPrice', () => {
    it('returns the price for the selected token', () => {
      const result = getSelectedTokenPrice(mockContext);
      expect(result).toBe(2);
    });

    it('returns undefined when price is not available', () => {
      const noPriceContext = {
        ...mockContext,
        tokenPrices: {},
      };
      const result = getSelectedTokenPrice(noPriceContext);
      expect(result).toBeUndefined();
    });
  });

  describe('getNativeTokenPrice', () => {
    it('returns the price for the native token', () => {
      const result = getNativeTokenPrice(mockContext);
      expect(result).toBe(50);
    });

    it('returns undefined when native token price is not available', () => {
      const noPriceContext = {
        ...mockContext,
        tokenPrices: {},
      };
      const result = getNativeTokenPrice(noPriceContext);
      expect(result).toBeUndefined();
    });
  });
});
