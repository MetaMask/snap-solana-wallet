import BigNumber from 'bignumber.js';

import {
  Caip19Id,
  LAMPORTS_PER_SOL,
  Network,
  SOL_TRANSFER_FEE_LAMPORTS,
  TokenMetadata,
} from '../../../../core/constants/solana';
import { MOCK_SOLANA_KEYRING_ACCOUNT_0 } from '../../../../core/test/mocks/solana-keyring-accounts';
import { updateInterface } from '../../../../core/utils/interface';
import { keyring } from '../../../../snap-context';
import type { SendContext } from '../../types';
import { SendCurrency, SendFormNames } from '../../types';
import { eventHandlers } from './events';

jest.mock('../../../../core/utils/interface');

describe('onMaxAmountButtonClick', () => {
  const mockId = 'test-id';
  const mockToAddress = 'destination-address';
  const mockAccount = MOCK_SOLANA_KEYRING_ACCOUNT_0;
  const mockBalanceInSol = '1.5'; // 1.5 SOL
  const mockCostInLamports = SOL_TRANSFER_FEE_LAMPORTS; // 0.000005 SOL
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
    scope: Network.Testnet,
    tokenPrices: {
      [Caip19Id.SolMainnet]: {
        ...TokenMetadata[Caip19Id.SolMainnet],
        price: Number(mockSolPrice),
      },
    },
    validation: {},
    amount: '',
    accounts: [],
    feeEstimatedInSol: '',
    currencySymbol: SendCurrency.SOL,
    transaction: null,
    stage: 'transaction-confirmation',
    preferences: {
      locale: 'en',
      currency: 'USD',
    },
    feePaidInSol: '0',
  };

  beforeEach(() => {
    jest.spyOn(keyring, 'getAccountOrThrow').mockResolvedValue(mockAccount);

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
        feeEstimatedInSol: expectedFeeInSol,
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
        feeEstimatedInSol: expectedFeeInSol,
      }),
    );
  });
});
