import BigNumber from 'bignumber.js';

import {
  Caip19Id,
  LAMPORTS_PER_SOL,
  Network,
  SOL_TRANSFER_FEE_LAMPORTS,
} from '../../../../core/constants/solana';
import { MOCK_SOLANA_KEYRING_ACCOUNT_0 } from '../../../../core/test/mocks/solana-keyring-accounts';
import { updateInterface } from '../../../../core/utils/interface';
import { keyring } from '../../../../snapContext';
import type { SendContext } from '../../types';
import { SendCurrencyType, SendFormNames } from '../../types';
import { eventHandlers } from './events';

jest.mock('../../../../core/utils/interface');

describe('SendForm events', () => {
  const mockId = 'test-id';
  const mockAccount = MOCK_SOLANA_KEYRING_ACCOUNT_0;
  const mockToAddress = 'destination-address';
  const mockBalanceInSol = '1.5'; // 1.5 SOL
  const mockSolPrice = '20'; // $20 per SOL
  const mockCostInLamports = SOL_TRANSFER_FEE_LAMPORTS; // 0.000005 SOL
  const baseContext: SendContext = {
    fromAccountId: mockAccount.id,
    toAddress: mockToAddress,
    balances: {
      [mockAccount.id]: {
        [Caip19Id.SolLocalnet]: {
          amount: mockBalanceInSol,
          unit: 'SOL',
        },
      },
    },
    scope: Network.Localnet,
    tokenPrices: {
      [Caip19Id.SolLocalnet]: {
        price: Number(mockSolPrice),
      },
    },
    validation: {},
    amount: '',
    accounts: [],
    feeEstimatedInSol: '',
    currencyType: SendCurrencyType.TOKEN,
    transaction: null,
    stage: 'send-form',
    preferences: {
      locale: 'en',
      currency: 'USD',
    },
    feePaidInSol: '0',
    tokenCaipId: Caip19Id.SolLocalnet,
    assets: [Caip19Id.SolLocalnet],
    tokenMetadata: {},
    buildingTransaction: false,
    transactionMessage: null,
    error: null,
  };

  describe('onSwapCurrencyButtonClick', () => {
    it('swaps the currency type', async () => {
      const context: SendContext = {
        ...baseContext,
        currencyType: SendCurrencyType.TOKEN,
      };

      await eventHandlers[SendFormNames.SwapCurrencyButton]({
        id: mockId,
        context,
      });

      expect(context.currencyType).toBe(SendCurrencyType.FIAT);
    });

    it('does not update the amount if it is empty', async () => {
      const context: SendContext = {
        ...baseContext,
        currencyType: SendCurrencyType.TOKEN,
        amount: '',
      };

      await eventHandlers[SendFormNames.SwapCurrencyButton]({
        id: mockId,
        context,
      });

      expect(context.amount).toBe('');
    });

    it('updates the amount if it is not empty', async () => {
      const context: SendContext = {
        ...baseContext,
        currencyType: SendCurrencyType.TOKEN,
        amount: '1',
      };

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
      const context: SendContext = {
        ...baseContext,
        currencyType: SendCurrencyType.TOKEN,
      };

      await eventHandlers[SendFormNames.MaxAmountButton]({
        id: mockId,
        context,
      });

      // Expected SOL amount: (1.5 SOL * LAMPORTS_PER_SOL - 5000) / LAMPORTS_PER_SOL
      const expectedAmount = BigNumber(mockBalanceInSol)
        .multipliedBy(LAMPORTS_PER_SOL)
        .minus(mockCostInLamports)
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

    it('calculates max amount in FIAT correctly', async () => {
      const context = {
        ...baseContext,
        currencyType: SendCurrencyType.FIAT,
      };

      await eventHandlers[SendFormNames.MaxAmountButton]({
        id: mockId,
        context,
      });

      // Expected FIAT amount: ((1.5 SOL * LAMPORTS_PER_SOL - 5000) / LAMPORTS_PER_SOL) * $20
      const expectedAmount = BigNumber(mockBalanceInSol)
        .multipliedBy(LAMPORTS_PER_SOL)
        .minus(mockCostInLamports)
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
