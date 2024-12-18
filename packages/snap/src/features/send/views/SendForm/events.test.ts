import BigNumber from 'bignumber.js';

import {
  LAMPORTS_PER_SOL,
  SolanaCaip19Tokens,
  SolanaCaip2Networks,
} from '../../../../core/constants/solana';
import { DEFAULT_TOKEN_PRICES } from '../../../../core/services/state';
import { MOCK_SOLANA_KEYRING_ACCOUNT_0 } from '../../../../core/test/mocks/solana-keyring-accounts';
import { updateInterface } from '../../../../core/utils/interface';
import { keyring, transferSolHelper } from '../../../../snap-context';
import type { SendContext } from '../../types';
import { SendCurrency, SendFormNames } from '../../types';
import { eventHandlers } from './events';

jest.mock('../../../../core/utils/interface');

describe('onMaxAmountButtonClick', () => {
  const mockId = 'test-id';
  const mockToAddress = 'destination-address';
  const mockAccount = MOCK_SOLANA_KEYRING_ACCOUNT_0;
  const mockBalanceInSol = '1.5'; // 1.5 SOL
  const mockCostInLamports = '5000'; // 0.000005 SOL
  const mockSolPrice = '20'; // $20 per SOL

  const expectedFeeInSol = BigNumber(mockCostInLamports)
    .dividedBy(LAMPORTS_PER_SOL)
    .toString();

  const baseContext: SendContext = {
    fromAccountId: mockAccount.id,
    toAddress: mockToAddress,
    balances: {
      [mockAccount.id]: { amount: mockBalanceInSol, unit: 'SOL' },
    },
    scope: SolanaCaip2Networks.Testnet,
    tokenPrices: {
      [SolanaCaip19Tokens.SOL]: {
        ...DEFAULT_TOKEN_PRICES[SolanaCaip19Tokens.SOL],
        price: Number(mockSolPrice),
      },
    },
    validation: {},
    amount: '',
    accounts: [],
    feeInSol: '',
    currencySymbol: SendCurrency.SOL,
    transaction: null,
    stage: 'transaction-confirmation',
    preferences: {
      locale: 'en',
      currency: 'USD',
    },
  };

  beforeEach(() => {
    jest.spyOn(keyring, 'getAccountOrThrow').mockResolvedValue(mockAccount);
    jest
      .spyOn(transferSolHelper, 'calculateCostInLamports')
      .mockResolvedValue(mockCostInLamports);

    (updateInterface as jest.Mock).mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('calculates max amount in SOL correctly', async () => {
    const context = {
      ...baseContext,
      currencySymbol: SendCurrency.SOL,
    };

    await eventHandlers[SendFormNames.MaxAmountButton]({ id: mockId, context });

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
        feeInSol: expectedFeeInSol,
      }),
    );
  });

  it('calculates max amount in FIAT correctly', async () => {
    const context = {
      ...baseContext,
      currencySymbol: SendCurrency.FIAT,
    };

    await eventHandlers[SendFormNames.MaxAmountButton]({ id: mockId, context });

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
        feeInSol: expectedFeeInSol,
      }),
    );
  });

  it('handles error in calculating transfer cost', async () => {
    jest
      .spyOn(transferSolHelper, 'calculateCostInLamports')
      .mockRejectedValue(new Error('Test error'));

    const context = {
      ...baseContext,
      currencySymbol: SendCurrency.SOL,
    };

    await eventHandlers[SendFormNames.MaxAmountButton]({ id: mockId, context });

    // Should use 0 as cost when calculation fails
    const expectedAmount = BigNumber(mockBalanceInSol)
      .multipliedBy(LAMPORTS_PER_SOL)
      .minus(0)
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

  it('throws error when balance after cost is negative', async () => {
    const lowBalanceContext = {
      ...baseContext,
      balances: {
        [mockAccount.id]: { amount: '0.000001', unit: 'SOL' }, // Very small balance
      },
      currencySymbol: SendCurrency.SOL,
    };

    // Set a high cost that exceeds the balance
    jest
      .spyOn(transferSolHelper, 'calculateCostInLamports')
      .mockResolvedValue('2000000'); // 0.002 SOL

    await expect(
      eventHandlers[SendFormNames.MaxAmountButton]({
        id: mockId,
        context: lowBalanceContext,
      }),
    ).rejects.toThrow('Insufficient funds');

    expect(updateInterface).not.toHaveBeenCalled();
  });
});
