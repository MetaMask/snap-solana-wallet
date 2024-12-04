import { jest } from '@jest/globals';
import type { SnapsProvider } from '@metamask/snaps-sdk';

import type { PriceApiClient } from '../clients/price-api/price-api-client';
import { SolanaCaip19Tokens, SolanaTokens } from '../constants/solana';
import type { ILogger } from '../utils/logger';
import type { SolanaState } from './state';
import { TokenRatesService } from './TokenRatesService';

describe('TokenRatesController', () => {
  describe('refreshTokenRates', () => {
    let tokenRatesController: TokenRatesService;
    let mockPriceApiClient: PriceApiClient;
    let mockSnap: SnapsProvider;
    let mockState: SolanaState;
    let mockLogger: ILogger;

    beforeEach(() => {
      mockPriceApiClient = {
        getSpotPrice: jest.fn(),
      } as unknown as PriceApiClient;

      mockSnap = {
        request: jest.fn(),
      } as unknown as SnapsProvider;

      mockState = {
        get: jest.fn(),
        set: jest.fn(),
      } as unknown as SolanaState;

      mockLogger = {
        info: jest.fn(),
        error: jest.fn(),
      } as unknown as ILogger;

      tokenRatesController = new TokenRatesService(
        mockPriceApiClient,
        mockSnap,
        mockState,
        mockLogger,
      );
    });

    it('refreshes token rates already present in the state', async () => {
      // Mock an initial state with some token rates
      const mockStateValue = {
        keyringAccounts: {},
        mapInterfaceNameToId: {},
        tokenRates: {
          SOL: {
            ...SolanaTokens.SOL,
            currency: 'SOL',
            conversionRate: 0,
            conversionDate: 0,
          },
        },
      };
      jest.spyOn(mockState, 'get').mockResolvedValue(mockStateValue);

      // Mock no interface to get balances from
      jest.spyOn(mockSnap, 'request').mockResolvedValue({ balances: {} });

      // Mock price API response
      const mockSpotPrice = { price: 1.23 };
      jest
        .spyOn(mockPriceApiClient, 'getSpotPrice')
        .mockResolvedValue(mockSpotPrice);

      await tokenRatesController.refreshTokenRates();

      expect(mockState.set).toHaveBeenCalledWith({
        ...mockStateValue,
        tokenRates: {
          SOL: {
            ...mockStateValue.tokenRates.SOL,
            conversionRate: 1.23,
            conversionDate: expect.any(Number),
            usdConversionRate: 9999,
          },
        },
      });
    });

    it('fetches token rates from the UI context', async () => {
      // Mock an initial state with no token rates
      const mockStateValue = {
        keyringAccounts: {},
        mapInterfaceNameToId: {
          'send-form': 'mock-interface-id',
        },
        tokenRates: {},
      };
      jest.spyOn(mockState, 'get').mockResolvedValue(mockStateValue);

      // Mock no interface to get balances from
      jest.spyOn(mockSnap, 'request').mockResolvedValueOnce({
        balances: {
          'account-id-0': { amount: '1', unit: 'SOL' },
          'account-id-1': { amount: '2', unit: 'SOL' },
        },
      });

      // Mock price API response
      const mockSpotPrice = { price: 1.23 };
      jest
        .spyOn(mockPriceApiClient, 'getSpotPrice')
        .mockResolvedValue(mockSpotPrice);

      await tokenRatesController.refreshTokenRates();

      expect(mockState.set).toHaveBeenCalledWith({
        ...mockStateValue,
        tokenRates: {
          SOL: {
            ...SolanaTokens.SOL,
            currency: 'SOL',
            conversionRate: 1.23,
            conversionDate: expect.any(Number),
            usdConversionRate: 9999,
          },
        },
      });
    });

    it.skip('should fetch rates for both state tokens and UI context tokens', async () => {
      // Mock state with existing token rate
      const mockStateValue = {
        keyringAccounts: {},
        mapInterfaceNameToId: {
          'send-form': 'mock-interface-id',
        },
        tokenRates: {
          SOL: {
            ...SolanaTokens.SOL,
            currency: 'SOL',
            conversionRate: 1.0,
            conversionDate: 0,
          },
        },
      };
      jest.spyOn(mockState, 'get').mockResolvedValue(mockStateValue);

      // Mock UI context with different token
      jest.spyOn(mockSnap, 'request').mockResolvedValueOnce({
        balances: {
          'account-id-0': { amount: '1', unit: 'USDC' },
        },
      });

      // Mock price API responses
      jest
        .spyOn(mockPriceApiClient, 'getSpotPrice')
        .mockResolvedValueOnce({ price: 1.23 }) // SOL
        .mockResolvedValueOnce({ price: 1.0 }); // USDC

      await tokenRatesController.refreshTokenRates();

      // Should update both tokens
      expect(mockState.set).toHaveBeenCalledWith({
        ...mockStateValue,
        tokenRates: {
          SOL: {
            ...SolanaTokens.SOL,
            currency: 'SOL',
            conversionRate: 1.23,
            conversionDate: expect.any(Number),
            usdConversionRate: 9999,
          },
          USDC: {
            ...SolanaTokens.SOL,
            currency: 'USDC',
            conversionRate: 1.0,
            conversionDate: expect.any(Number),
            usdConversionRate: 9999,
          },
        },
      });
    });

    it('should deduplicate tokens present in both state and UI context', async () => {
      const mockStateValue = {
        keyringAccounts: {},
        mapInterfaceNameToId: {
          'send-form': 'mock-interface-id',
        },
        tokenRates: {
          SOL: {
            ...SolanaTokens.SOL,
            currency: 'SOL',
            conversionRate: 1.0,
            conversionDate: 0,
          },
        },
      };
      jest.spyOn(mockState, 'get').mockResolvedValue(mockStateValue);

      // Mock UI context with same token as state
      jest.spyOn(mockSnap, 'request').mockResolvedValueOnce({
        balances: {
          'account-id-0': { amount: '1', unit: 'SOL' },
        },
      });

      const mockSpotPrice = { price: 1.23 };
      const getSpotPriceSpy = jest
        .spyOn(mockPriceApiClient, 'getSpotPrice')
        .mockResolvedValue(mockSpotPrice);

      await tokenRatesController.refreshTokenRates();

      // Should only call getSpotPrice once for SOL
      expect(getSpotPriceSpy).toHaveBeenCalledTimes(1);
      expect(mockState.set).toHaveBeenCalledWith({
        ...mockStateValue,
        tokenRates: expect.objectContaining({
          SOL: expect.objectContaining({ conversionRate: 1.23 }),
        }),
      });
    });

    it('should handle missing send form interface gracefully', async () => {
      // Mock an initial state with some token rates
      const mockStateValue = {
        keyringAccounts: {},
        mapInterfaceNameToId: {},
        tokenRates: {
          SOL: {
            symbol: 'SOL',
            address: 'So11111111111111111111111111111111111111112',
            caip19Id: SolanaCaip19Tokens.SOL,
            decimals: 9,
            currency: 'SOL',
            conversionRate: 0,
            conversionDate: 0,
          },
        },
      };
      jest.spyOn(mockState, 'get').mockResolvedValue(mockStateValue);

      // Mock no interface
      jest
        .spyOn(mockSnap, 'request')
        .mockRejectedValue(new Error('No interface with passed id'));

      // Mock price API response
      const mockSpotPrice = { price: 1.23 };
      jest
        .spyOn(mockPriceApiClient, 'getSpotPrice')
        .mockResolvedValue(mockSpotPrice);

      await tokenRatesController.refreshTokenRates();

      // Verify state was still updated with tokens already present in the state
      expect(mockState.set).toHaveBeenCalledWith({
        ...mockStateValue,
        tokenRates: expect.objectContaining({
          SOL: expect.objectContaining({
            conversionRate: 1.23,
            conversionDate: expect.any(Number),
          }),
        }),
      });
    });

    it('should handle price API errors gracefully and leave existing rates intact', async () => {
      // Mock an initial state with some token rates
      const mockStateValue = {
        keyringAccounts: {},
        mapInterfaceNameToId: {},
        tokenRates: {
          SOL: {
            symbol: 'SOL',
            address: 'So11111111111111111111111111111111111111112',
            caip19Id: SolanaCaip19Tokens.SOL,
            decimals: 9,
            currency: 'SOL',
            conversionRate: 919565356,
            conversionDate: 0,
          },
        },
      };
      jest.spyOn(mockState, 'get').mockResolvedValue(mockStateValue);

      // Mock price API failure
      jest
        .spyOn(mockPriceApiClient, 'getSpotPrice')
        .mockRejectedValue(new Error('API Error'));

      await tokenRatesController.refreshTokenRates();

      // Verify state wasn't updated with failed rates
      expect(mockState.set).toHaveBeenCalledWith(mockStateValue);
    });
  });
});
