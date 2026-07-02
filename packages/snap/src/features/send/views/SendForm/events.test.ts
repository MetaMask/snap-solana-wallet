import { lamports } from '@solana/kit';
import BigNumber from 'bignumber.js';
import type { Preferences } from 'src/core/types/snap';

import {
  KnownCaip19Id,
  LAMPORTS_PER_SOL,
  Network,
} from '../../../../core/constants/solana';
import { MOCK_SOLANA_KEYRING_ACCOUNT_0 } from '../../../../core/test/mocks/solana-keyring-accounts';
import { solToLamports } from '../../../../core/utils/conversion';
import { updateInterface } from '../../../../core/utils/interface';
import { keyring } from '../../../../snapContext';
import type { SendContext } from '../../types';
import { SendCurrencyType, SendFormNames } from '../../types';
import { amountInput } from '../../validation/form';
import { eventHandlers } from './events';

jest.mock('../../../../core/utils/interface');

const mockId = 'test-id';
const mockAccount = MOCK_SOLANA_KEYRING_ACCOUNT_0;
const mockToAddress = 'destination-address';
const mockBalanceInSol = '1.5'; // 1.5 SOL
const mockSolPrice = '20'; // $20 per SOL
const mockBaseFeeInLamports = lamports(5000n); // 0.000005 SOL
const mockPriorityFeeInLamports = lamports(4n); //  Integer(450 * 10000n / MICRO_LAMPORTS_PER_LAMPORTS)
const mockMinimumBalanceForRentExemptionSol = '0.002';
const mockMinimumBalanceForRentExemptionLamports = solToLamports(
  mockMinimumBalanceForRentExemptionSol,
);

const setupTest = (overrides: Partial<SendContext> = {}): SendContext => {
  const baseContext: SendContext = {
    fromAccountId: mockAccount.id,
    toAddress: mockToAddress,
    fromDomain: null,
    toDomain: null,
    balances: {
      [mockAccount.id]: {
        [KnownCaip19Id.SolLocalnet]: {
          amount: mockBalanceInSol,
          unit: 'SOL',
        },
      },
    },
    destinationAddressOrDomain: mockToAddress,
    domainResolutionStatus: null,
    scope: Network.Localnet,
    tokenPricesFetchStatus: 'initial',
    tokenPrices: {
      [KnownCaip19Id.SolLocalnet]: {
        id: 'solana',
        price: Number(mockSolPrice),
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
    validation: {},
    amount: '',
    accounts: [],
    feeEstimatedInSol: '0',
    currencyType: SendCurrencyType.TOKEN,
    transaction: null,
    stage: 'send-form',
    preferences: {
      locale: 'en',
      currency: 'USD',
      hideBalances: false,
      useSecurityAlerts: false,
      useExternalPricingData: false,
      simulateOnChainActions: false,
      useTokenDetection: false,
      batchCheckBalances: false,
      displayNftMedia: false,
      useNftDetection: false,
    },
    feePaidInSol: '0',
    tokenCaipId: KnownCaip19Id.SolLocalnet,
    assets: [KnownCaip19Id.SolLocalnet],
    selectedTokenMetadata: null,
    buildingTransaction: false,
    transactionMessage: null,
    error: null,
    minimumBalanceForRentExemptionSol: mockMinimumBalanceForRentExemptionSol,
    loading: true,
  };

  return {
    ...baseContext,
    ...overrides,
    accounts: overrides.accounts ?? baseContext.accounts,
    assets: overrides.assets ?? baseContext.assets,
    balances: overrides.balances ?? baseContext.balances,
    preferences: {
      ...baseContext.preferences,
      ...overrides.preferences,
    },
    tokenPrices: overrides.tokenPrices ?? baseContext.tokenPrices,
    validation: overrides.validation ?? baseContext.validation,
  };
};

describe('SendForm events', () => {
  describe('onSwapCurrencyButtonClick', () => {
    it('swaps the currency type', async () => {
      const context = setupTest({
        currencyType: SendCurrencyType.TOKEN,
      });

      await eventHandlers[SendFormNames.SwapCurrencyButton]({
        id: mockId,
        context,
      });

      expect(context.currencyType).toBe(SendCurrencyType.FIAT);
    });

    it('does not update the amount if it is empty', async () => {
      const context = setupTest({
        currencyType: SendCurrencyType.TOKEN,
        amount: '',
      });

      await eventHandlers[SendFormNames.SwapCurrencyButton]({
        id: mockId,
        context,
      });

      expect(context.amount).toBe('');
    });

    it('updates the amount if it is not empty', async () => {
      const context = setupTest({
        currencyType: SendCurrencyType.TOKEN,
        amount: '1',
      });

      await eventHandlers[SendFormNames.SwapCurrencyButton]({
        id: mockId,
        context,
      });

      expect(context.amount).toBe(mockSolPrice);
    });
  });

  describe('onMaxAmountButtonClick', () => {
    beforeEach(() => {
      jest.spyOn(keyring, 'getAccountOrThrow').mockResolvedValue(mockAccount);

      (updateInterface as jest.Mock).mockResolvedValue(undefined);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('calculates max amount in SOL correctly', async () => {
      const context = setupTest({
        currencyType: SendCurrencyType.TOKEN,
      });

      await eventHandlers[SendFormNames.MaxAmountButton]({
        id: mockId,
        context,
      });

      // Expected SOL amount: (1.5 SOL * LAMPORTS_PER_SOL - 5000 - 4 - 2000 - 1) / LAMPORTS_PER_SOL
      const expectedAmount = BigNumber(mockBalanceInSol)
        .multipliedBy(LAMPORTS_PER_SOL)
        .minus(mockBaseFeeInLamports.toString())
        .minus(mockPriorityFeeInLamports.toString())
        .minus(mockMinimumBalanceForRentExemptionLamports)
        .minus(1)
        .dividedBy(LAMPORTS_PER_SOL)
        .toString();

      expect(updateInterface).toHaveBeenCalledWith(
        mockId,
        expect.anything(),
        expect.objectContaining({
          amount: expectedAmount,
        }),
      );
    });

    it('calculates max amount in SOL correctly including rounding', async () => {
      const context = setupTest({
        currencyType: SendCurrencyType.TOKEN,
        balances: {
          [mockAccount.id]: {
            [KnownCaip19Id.SolLocalnet]: {
              amount: '1.00999',
              unit: 'SOL',
            },
          },
        },
        minimumBalanceForRentExemptionSol: '0.00089088',
      });

      await eventHandlers[SendFormNames.MaxAmountButton]({
        id: mockId,
        context,
      });

      const expectedAmount = '1.009094115';
      expect(updateInterface).toHaveBeenCalledWith(
        mockId,
        expect.anything(),
        expect.objectContaining({
          amount: expectedAmount,
        }),
      );

      // This is a hack to test that the transaction would actually be sendable after
      expect(
        amountInput({ ...context, feeEstimatedInSol: '0.000005' })(
          expectedAmount,
        ),
      ).toBeNull();
    });

    it('calculates max amount in FIAT correctly', async () => {
      const context = setupTest({
        currencyType: SendCurrencyType.FIAT,
      });

      await eventHandlers[SendFormNames.MaxAmountButton]({
        id: mockId,
        context,
      });

      // Expected FIAT amount: ((1.5 SOL * LAMPORTS_PER_SOL - 5000 - 4 - 2000 - 1) / LAMPORTS_PER_SOL) * $20
      const expectedAmount = BigNumber(mockBalanceInSol)
        .multipliedBy(LAMPORTS_PER_SOL)
        .minus(mockBaseFeeInLamports.toString())
        .minus(mockPriorityFeeInLamports.toString())
        .minus(mockMinimumBalanceForRentExemptionLamports)
        .minus(1)
        .dividedBy(LAMPORTS_PER_SOL)
        .multipliedBy(mockSolPrice)
        .toString();

      expect(updateInterface).toHaveBeenCalledWith(
        mockId,
        expect.anything(),
        expect.objectContaining({
          amount: expectedAmount,
        }),
      );
    });
  });
});

describe('SendForm event tracking', () => {
  const setupTrackingTest = async () => {
    const trackError = jest.fn().mockResolvedValue('tracked-error-id');
    const updateInterfaceMock = jest.fn().mockResolvedValue(undefined);
    const configProvider = {
      get: jest.fn().mockReturnValue({
        staticApi: {
          baseUrl: 'https://static.example.com',
        },
      }),
    };
    const nameResolutionService = {
      resolveAddress: jest.fn().mockResolvedValue(null),
    };
    const priceApiClient = {
      getMultipleSpotPrices: jest.fn(),
    };

    jest.doMock('../../../../core/utils/errors', () => ({
      trackError,
    }));
    jest.doMock('../../../../core/utils/interface', () => ({
      resolveInterface: jest.fn(),
      SEND_FORM_INTERFACE_NAME: 'send-form',
      updateInterface: updateInterfaceMock,
    }));
    jest.doMock('../../Send', () => ({
      Send: () => null,
    }));
    jest.doMock('../../../../snapContext', () => ({
      configProvider,
      keyring: {
        getAccountOrThrow: jest
          .fn()
          .mockResolvedValue(MOCK_SOLANA_KEYRING_ACCOUNT_0),
      },
      nameResolutionService,
      priceApiClient,
      sendSolBuilder: {},
      sendSplTokenBuilder: {},
      state: {
        deleteKey: jest.fn().mockResolvedValue(undefined),
      },
    }));

    (globalThis as any).snap = {
      request: jest.fn().mockResolvedValue(undefined),
    };

    let isolatedEventHandlers: typeof eventHandlers | undefined;
    jest.isolateModules(() => {
      ({ eventHandlers: isolatedEventHandlers } =
        jest.requireActual('./events'));
    });

    if (!isolatedEventHandlers) {
      throw new Error('Failed to load eventHandlers');
    }

    return {
      eventHandlers: isolatedEventHandlers,
      trackError,
      priceApiClient,
      updateInterfaceMock,
    };
  };

  it('tracks token price failures before confirmation', async () => {
    const {
      eventHandlers: isolatedEventHandlers,
      trackError,
      priceApiClient,
      updateInterfaceMock,
    } = await setupTrackingTest();

    const error = new Error('Spot prices failed');
    const context = setupTest({
      accounts: [MOCK_SOLANA_KEYRING_ACCOUNT_0],
      scope: Network.Mainnet,
      tokenCaipId: KnownCaip19Id.SolMainnet,
      assets: [KnownCaip19Id.SolMainnet],
      balances: {
        [MOCK_SOLANA_KEYRING_ACCOUNT_0.id]: {
          [KnownCaip19Id.SolMainnet]: {
            amount: '2',
            unit: 'SOL',
          },
        },
      },
      amount: '1',
      toAddress: 'FDUGdV6bjhvw5gbirXCvqbTSWK9999kcrZcrHoCQzXJK',
      feeEstimatedInSol: '0.000005',
      tokenPrices: {},
      preferences: {
        currency: 'usd',
        useExternalPricingData: true,
      } as Preferences,
      selectedTokenMetadata: null,
    });

    priceApiClient.getMultipleSpotPrices.mockRejectedValue(error);

    await isolatedEventHandlers[SendFormNames.SendButton]({
      id: 'interface-id',
      context,
    });

    expect(trackError).toHaveBeenNthCalledWith(1, error);
  });
});
