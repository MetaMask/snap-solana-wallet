import { KnownCaip19Id, Network } from '../../../../core/constants/solana';
import { trackError } from '../../../../core/utils/errors';
import { updateInterface } from '../../../../core/utils/interface';
import { keyring, state, walletService } from '../../../../snapContext';
import { SendCurrencyType } from '../../types';
import { eventHandlers } from './events';

const CONFIRM_BUTTON_NAME = 'transaction-confirmation-submit-button';

jest.mock('../../../../core/utils/errors', () => ({
  trackError: jest.fn().mockResolvedValue('tracked-error-id'),
}));

jest.mock('../../../../core/utils/interface', () => ({
  resolveInterface: jest.fn(),
  SEND_FORM_INTERFACE_NAME: 'send-form',
  updateInterface: jest.fn(),
}));

jest.mock('../../Send', () => ({
  Send: () => null,
}));

jest.mock('./TransactionConfirmation', () => ({
  TransactionConfirmationNames: {
    BackButton: 'transaction-confirmation-back-button',
    CancelButton: 'transaction-confirmation-cancel-button',
    ConfirmButton: 'transaction-confirmation-submit-button',
  },
}));

jest.mock('../../../../snapContext', () => ({
  keyring: {
    getAccountOrThrow: jest.fn(),
  },
  state: {
    deleteKey: jest.fn(),
  },
  walletService: {
    signAndSendTransaction: jest.fn(),
  },
}));

const setupTest = () => {
  jest.clearAllMocks();
  (globalThis as any).snap = {
    request: jest.fn().mockResolvedValue(undefined),
  };
  (keyring.getAccountOrThrow as jest.Mock).mockResolvedValue({
    id: 'account-id',
    address: 'BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP',
  });
  (updateInterface as jest.Mock).mockResolvedValue(undefined);
  (state.deleteKey as jest.Mock).mockResolvedValue(undefined);
};

describe('TransactionConfirmation events', () => {
  it('tracks submission errors and still renders the failure stage', async () => {
    setupTest();

    const error = new Error('Submission failed');

    (walletService.signAndSendTransaction as jest.Mock).mockRejectedValue(
      error,
    );

    await eventHandlers[CONFIRM_BUTTON_NAME]({
      id: 'interface-id',
      context: {
        scope: Network.Mainnet,
        fromAccountId: 'account-id',
        feeEstimatedInSol: '0.000005',
        transactionMessage: 'transaction-message',
        tokenCaipId: KnownCaip19Id.SolMainnet,
        currencyType: SendCurrencyType.TOKEN,
        tokenPrices: {},
        assets: [],
        balances: {},
        preferences: {
          locale: 'en',
          currency: 'usd',
        },
      } as any,
    });

    expect(trackError).toHaveBeenCalledWith(error);
    expect(updateInterface).toHaveBeenLastCalledWith(
      'interface-id',
      null,
      expect.objectContaining({
        stage: 'transaction-failure',
        transaction: {
          result: 'failure',
          signature: null,
        },
      }),
    );
  });
});
