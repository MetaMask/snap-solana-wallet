import { jest } from '@jest/globals';
import type { SnapsProvider } from '@metamask/snaps-sdk';

import type { PriceApiClient } from '../clients/price-api/price-api-client';
import { SolanaCaip19Tokens, SolanaTokens } from '../constants/solana';
import type { ILogger } from '../utils/logger';
import type { SolanaState, StateValue } from './state';
import { TokenPricesService } from './TokenPricesService';

describe('TokenPricesService', () => {
  describe('refreshPrices', () => {
    let tokenPricesService: TokenPricesService;
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

      tokenPricesService = new TokenPricesService(
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
        tokenPrices: {
          [SolanaCaip19Tokens.SOL]: {
            ...SolanaTokens[SolanaCaip19Tokens.SOL],
            currency: 'SOL',
            price: 0,
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

      await tokenPricesService.refreshPrices();

      expect(mockState.set).toHaveBeenCalledWith({
        ...mockStateValue,
        tokenPrices: {
          [SolanaCaip19Tokens.SOL]: {
            ...mockStateValue.tokenPrices[SolanaCaip19Tokens.SOL],
            price: 1.23,
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
        tokenPrices: {},
      } as unknown as StateValue;
      jest.spyOn(mockState, 'get').mockResolvedValue(mockStateValue);

      // Mock no interface to get balances from
      jest.spyOn(mockSnap, 'request').mockResolvedValueOnce({
        balances: {
          [SolanaCaip19Tokens.SOL]: { amount: '1', unit: 'SOL' },
        },
      });

      // Mock price API response
      const mockSpotPrice = { price: 1.23 };
      jest
        .spyOn(mockPriceApiClient, 'getSpotPrice')
        .mockResolvedValue(mockSpotPrice);

      await tokenPricesService.refreshPrices('mock-interface-id');

      expect(mockState.set).toHaveBeenCalledWith({
        ...mockStateValue,
        tokenPrices: {
          [SolanaCaip19Tokens.SOL]: {
            ...SolanaTokens[SolanaCaip19Tokens.SOL],
            price: 1.23,
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
        tokenPrices: {
          [SolanaCaip19Tokens.SOL]: {
            ...SolanaTokens[SolanaCaip19Tokens.SOL],
            price: 1.0,
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

      await tokenPricesService.refreshPrices('mock-interface-id');

      // Should only call getSpotPrice once for SOL
      expect(getSpotPriceSpy).toHaveBeenCalledTimes(1);
      expect(mockState.set).toHaveBeenCalledWith({
        ...mockStateValue,
        tokenPrices: expect.objectContaining({
          [SolanaCaip19Tokens.SOL]: expect.objectContaining({
            price: 1.23,
          }),
        }),
      });
    });

    it('should handle missing send form interface gracefully', async () => {
      // Mock an initial state with some token rates
      const mockStateValue = {
        keyringAccounts: {},
        mapInterfaceNameToId: {},
        tokenPrices: {
          [SolanaCaip19Tokens.SOL]: {
            ...SolanaTokens[SolanaCaip19Tokens.SOL],
            price: 0,
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

      await tokenPricesService.refreshPrices();

      // Verify state was still updated with tokens already present in the state
      expect(mockState.set).toHaveBeenCalledWith({
        ...mockStateValue,
        tokenPrices: expect.objectContaining({
          [SolanaCaip19Tokens.SOL]: expect.objectContaining({
            price: 1.23,
          }),
        }),
      });
    });

    it('should handle price API errors gracefully and leave existing rates intact', async () => {
      // Mock an initial state with some token rates
      const mockStateValue = {
        keyringAccounts: {},
        mapInterfaceNameToId: {},
        tokenPrices: {
          [SolanaCaip19Tokens.SOL]: {
            ...SolanaTokens[SolanaCaip19Tokens.SOL],
            price: 919565356,
          },
        },
      };
      jest.spyOn(mockState, 'get').mockResolvedValue(mockStateValue);

      // Mock price API failure
      jest
        .spyOn(mockPriceApiClient, 'getSpotPrice')
        .mockRejectedValue(new Error('API Error'));

      await tokenPricesService.refreshPrices();

      // Verify state wasn't updated with failed rates
      expect(mockState.set).toHaveBeenCalledWith(mockStateValue);
    });
  });
});
