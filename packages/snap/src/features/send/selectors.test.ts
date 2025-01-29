import SolanaLogo from '../../../images/coin.svg';
import { Caip19Id, Network, Networks } from '../../core/constants/solana';
import { DEFAULT_SEND_CONTEXT } from '../../core/handlers/onRpcRequest/renderSend';
import {
  getNativeTokenPrice,
  getSelectedTokenMetadata,
  getSelectedTokenPrice,
  getTokenAmount,
} from './selectors';
import type { SendContext } from './types';
import { SendCurrencyType } from './types';

describe('Send selectors', () => {
  const mockTokenCaipId = Caip19Id.UsdcLocalnet;
  const mockContext: SendContext = {
    ...DEFAULT_SEND_CONTEXT,
    amount: '100',
    tokenPrices: {
      [mockTokenCaipId]: { price: 2 },
      [Networks[Network.Mainnet].nativeToken.caip19Id]: { price: 50 },
    },
    tokenCaipId: mockTokenCaipId,
    currencyType: SendCurrencyType.TOKEN,
    tokenMetadata: {
      [mockTokenCaipId]: {
        symbol: 'USDC',
        imageSvg: 'test-image.svg',
        name: 'USD Coin',
        fungible: true,
        iconUrl: 'test-image.svg',
        units: [{ symbol: 'USDC', name: 'USD Coin', decimals: 6 }],
      },
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
    it('should return token metadata with required fields', () => {
      const result = getSelectedTokenMetadata(mockContext);
      expect(result).toStrictEqual({
        ...mockContext.tokenMetadata[mockTokenCaipId],
        tokenSymbol: 'USDC',
        tokenImage: 'test-image.svg',
      });
    });

    it('should return default values when token metadata is missing', () => {
      const noMetadataContext = {
        ...mockContext,
        tokenMetadata: {},
      };
      const result = getSelectedTokenMetadata(noMetadataContext);
      expect(result).toStrictEqual({
        tokenSymbol: '',
        tokenImage: SolanaLogo,
      });
    });
  });

  describe('getSelectedTokenPrice', () => {
    it('should return the price for the selected token', () => {
      const result = getSelectedTokenPrice(mockContext);
      expect(result).toBe(2);
    });

    it('should return undefined when price is not available', () => {
      const noPriceContext = {
        ...mockContext,
        tokenPrices: {},
      };
      const result = getSelectedTokenPrice(noPriceContext);
      expect(result).toBeUndefined();
    });
  });

  describe('getNativeTokenPrice', () => {
    it('should return the price for the native token', () => {
      const result = getNativeTokenPrice(mockContext);
      expect(result).toBe(50);
    });

    it('should return undefined when native token price is not available', () => {
      const noPriceContext = {
        ...mockContext,
        tokenPrices: {},
      };
      const result = getNativeTokenPrice(noPriceContext);
      expect(result).toBeUndefined();
    });
  });
});
