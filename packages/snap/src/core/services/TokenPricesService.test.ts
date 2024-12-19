import type { PriceApiClient } from '../clients/price-api/price-api-client';
import { Caip19Id, TokenMetadata } from '../constants/solana';
import type { ILogger } from '../utils/logger';
import {
  DEFAULT_TOKEN_PRICES,
  type SolanaState,
  type StateValue,
} from './state';
import { TokenPricesService } from './TokenPricesService';

const snap = {
  request: jest.fn(),
};

(globalThis as any).snap = snap;

describe('TokenPricesService', () => {
  describe('refreshPrices', () => {
    let tokenPricesService: TokenPricesService;
    let mockPriceApiClient: PriceApiClient;
    let mockState: SolanaState;
    let mockLogger: ILogger;

    beforeEach(() => {
      mockPriceApiClient = {
        getSpotPrice: jest.fn(),
      } as unknown as PriceApiClient;

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
        mockState,
        mockLogger,
      );
    });

    afterEach(() => {
      snap.request.mockReset();
    });

    it('refreshes token rates already present in the state', async () => {
      // Mock an initial state with some token rates
      const mockStateValue = {
        mapInterfaceNameToId: {},
        tokenPrices: {
          ...DEFAULT_TOKEN_PRICES,
          [Caip19Id.SolMainnet]: {
            ...TokenMetadata[Caip19Id.SolMainnet],
            currency: 'SOL',
            price: 0,
          },
        },
        isFetchingTransactions: false,
        transactions: {},
      };
      jest.spyOn(mockState, 'get').mockResolvedValue(mockStateValue);

      // Mock no interface to get balances from
      jest.spyOn(snap, 'request').mockResolvedValue({ balances: {} });

      // Mock price API response
      const mockSpotPrice = { price: 1.23 };
      jest
        .spyOn(mockPriceApiClient, 'getSpotPrice')
        .mockResolvedValue(mockSpotPrice);

      await tokenPricesService.refreshPrices();

      expect(mockState.set).toHaveBeenCalledWith({
        ...mockStateValue,
        tokenPrices: {
          [Caip19Id.SolMainnet]: {
            ...mockStateValue.tokenPrices[Caip19Id.SolMainnet],
            price: 1.23,
          },
          [Caip19Id.SolDevnet]: {
            ...mockStateValue.tokenPrices[Caip19Id.SolDevnet],
            price: 1.23,
          },
          [Caip19Id.SolTestnet]: {
            ...mockStateValue.tokenPrices[Caip19Id.SolTestnet],
            price: 1.23,
          },
          [Caip19Id.SolLocalnet]: {
            ...mockStateValue.tokenPrices[Caip19Id.SolLocalnet],
            price: 1.23,
          },
          [Caip19Id.EurcDevnet]: {
            ...mockStateValue.tokenPrices[Caip19Id.EurcDevnet],
            price: 1.23,
          },
          [Caip19Id.EurcMainnet]: {
            ...mockStateValue.tokenPrices[Caip19Id.EurcMainnet],
            price: 1.23,
          },
          [Caip19Id.UsdcDevnet]: {
            ...mockStateValue.tokenPrices[Caip19Id.UsdcDevnet],
            price: 1.23,
          },
          [Caip19Id.UsdcMainnet]: {
            ...mockStateValue.tokenPrices[Caip19Id.UsdcMainnet],
            price: 1.23,
          },
        },
      });
    });

    it('fetches token rates from the UI context', async () => {
      // Mock an initial state with no token rates
      const mockStateValue = {
        mapInterfaceNameToId: {
          'send-form': 'mock-interface-id',
        },
        tokenPrices: {},
      } as unknown as StateValue;
      jest.spyOn(mockState, 'get').mockResolvedValue(mockStateValue);

      // Mock no interface to get balances from
      jest.spyOn(snap, 'request').mockResolvedValueOnce({
        preferences: { currency: 'usd' },
        balances: {
          [Caip19Id.SolMainnet]: { amount: '1', unit: 'SOL' },
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
          [Caip19Id.SolMainnet]: {
            ...TokenMetadata[Caip19Id.SolMainnet],
            price: 1.23,
          },
        },
      });
    });

    it('deduplicates tokens present in both state and UI context', async () => {
      const mockStateValue = {
        mapInterfaceNameToId: {
          'send-form': 'mock-interface-id',
        },
        tokenPrices: {
          ...DEFAULT_TOKEN_PRICES,
          [Caip19Id.SolMainnet]: {
            ...TokenMetadata[Caip19Id.SolMainnet],
            price: 1.0,
          },
        },
        isFetchingTransactions: false,
        transactions: {},
      };
      jest.spyOn(mockState, 'get').mockResolvedValue(mockStateValue);

      // Mock UI context with same token as state
      jest.spyOn(snap, 'request').mockResolvedValueOnce({
        balances: {
          'account-id-0': { amount: '1', unit: 'SOL' },
        },
      });

      const mockSpotPrice = { price: 1.23 };
      const getSpotPriceSpy = jest
        .spyOn(mockPriceApiClient, 'getSpotPrice')
        .mockResolvedValue(mockSpotPrice);

      await tokenPricesService.refreshPrices('mock-interface-id');

      // Should call getSpotPrice once for each token
      expect(getSpotPriceSpy).toHaveBeenCalledTimes(8);
      expect(mockState.set).toHaveBeenCalledWith({
        ...mockStateValue,
        tokenPrices: expect.objectContaining({
          [Caip19Id.SolMainnet]: expect.objectContaining({
            price: 1.23,
          }),
        }),
      });
    });

    it('handles missing send form interface gracefully', async () => {
      // Mock an initial state with some token rates
      const mockStateValue = {
        mapInterfaceNameToId: {},
        tokenPrices: {
          ...DEFAULT_TOKEN_PRICES,
          [Caip19Id.SolMainnet]: {
            ...TokenMetadata[Caip19Id.SolMainnet],
            price: 0,
          },
        },
        isFetchingTransactions: false,
        transactions: {},
      };
      jest.spyOn(mockState, 'get').mockResolvedValue(mockStateValue);

      // Mock no interface
      jest
        .spyOn(snap, 'request')
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
          [Caip19Id.SolMainnet]: expect.objectContaining({
            price: 1.23,
          }),
        }),
      });
    });

    it('handles price API errors gracefully and leaves existing rates intact', async () => {
      // Mock an initial state with some token rates
      const mockStateValue = {
        mapInterfaceNameToId: {},
        tokenPrices: {
          ...DEFAULT_TOKEN_PRICES,
          [Caip19Id.SolMainnet]: {
            ...TokenMetadata[Caip19Id.SolMainnet],
            price: 919565356,
          },
        },
        isFetchingTransactions: false,
        transactions: {},
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
