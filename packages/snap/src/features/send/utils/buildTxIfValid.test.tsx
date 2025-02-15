import { address } from '@solana/web3.js';

import { KnownCaip19Id, Network } from '../../../core/constants/solana';
import { DEFAULT_SEND_CONTEXT } from '../../../core/handlers/onRpcRequest/renderSend';
import {
  MOCK_SOLANA_KEYRING_ACCOUNT_0,
  MOCK_SOLANA_KEYRING_ACCOUNT_1,
} from '../../../core/test/mocks/solana-keyring-accounts';
import { updateInterface } from '../../../core/utils/interface';
import { sendFieldsAreValid } from '../../../core/validation/form';
import {
  keyring,
  sendSolBuilder,
  sendSplTokenBuilder,
  transactionHelper,
} from '../../../snapContext';
import { SendCurrencyType, type SendContext } from '../types';
import { buildTxIfValid } from './buildTxIfValid';

// Mock dependencies
jest.mock('../../../core/utils/interface');
jest.mock('../../../core/validation/form');
jest.mock('../../../snapContext');
jest.mock('lodash', () => ({
  debounce: (fn: any) => fn, // Make debounce synchronous for testing
}));

describe('buildTxIfValid', () => {
  const mockId = 'test-id';
  const mockContext = {
    ...DEFAULT_SEND_CONTEXT,
    fromAccountId: MOCK_SOLANA_KEYRING_ACCOUNT_0.id,
    tokenCaipId: KnownCaip19Id.SolTestnet,
    scope: Network.Testnet,
    toAddress: MOCK_SOLANA_KEYRING_ACCOUNT_1.address,
    amount: '1.0',
    preferences: {
      locale: 'en',
      currency: 'USD',
    },
    balances: {
      [MOCK_SOLANA_KEYRING_ACCOUNT_0.id]: {
        [KnownCaip19Id.SolTestnet]: {
          amount: '100',
        },
      },
    },
    currencyType: SendCurrencyType.TOKEN,
  } as unknown as SendContext;

  beforeEach(() => {
    jest.clearAllMocks();
    // Setup default mock implementations
    (sendFieldsAreValid as jest.Mock).mockReturnValue(true);
    (keyring.getAccountOrThrow as jest.Mock).mockResolvedValue({
      address: MOCK_SOLANA_KEYRING_ACCOUNT_0.address,
    });

    (sendSolBuilder.buildTransactionMessage as jest.Mock).mockResolvedValue({
      someTransactionData: 'data',
    });

    (
      transactionHelper.getFeeFromTransactionInLamports as jest.Mock
    ).mockResolvedValue(5000);

    (transactionHelper.base64EncodeTransaction as jest.Mock).mockResolvedValue(
      'base64-encoded',
    );
  });

  it('does not build transaction if fields are invalid', async () => {
    (sendFieldsAreValid as jest.Mock).mockReturnValue(false);

    await buildTxIfValid(mockId, mockContext);

    expect(updateInterface).not.toHaveBeenCalled();
    expect(keyring.getAccountOrThrow).not.toHaveBeenCalled();
  });

  it('builds SOL transfer transaction when tokenCaipId is native token', async () => {
    await buildTxIfValid(mockId, mockContext);

    expect(sendSolBuilder.buildTransactionMessage).toHaveBeenCalledWith(
      address(MOCK_SOLANA_KEYRING_ACCOUNT_0.address),
      address(MOCK_SOLANA_KEYRING_ACCOUNT_1.address),
      '1.0',
      Network.Testnet,
    );
    expect(updateInterface).toHaveBeenCalledTimes(2);
  });

  it('builds SPL token transaction when tokenCaipId is not native token', async () => {
    const splContext = {
      ...mockContext,
      tokenCaipId: KnownCaip19Id.UsdcLocalnet,
    } as unknown as SendContext;

    await buildTxIfValid(mockId, splContext);

    expect(sendSplTokenBuilder.buildTransactionMessage).toHaveBeenCalled();
    expect(updateInterface).toHaveBeenCalledTimes(2);
  });

  it('handles transaction build errors', async () => {
    (sendSolBuilder.buildTransactionMessage as jest.Mock).mockRejectedValue(
      new Error('Build failed'),
    );

    await buildTxIfValid(mockId, mockContext);

    expect(updateInterface).toHaveBeenCalledWith(
      mockId,
      expect.anything(),
      expect.objectContaining({
        error: {
          title: 'send.simulationTitleError',
          message: 'send.simulationMessageError',
        },
        buildingTransaction: false,
      }),
    );
  });

  it('updates interface with fee estimation', async () => {
    await buildTxIfValid(mockId, mockContext);

    expect(updateInterface).toHaveBeenLastCalledWith(
      mockId,
      expect.anything(),
      expect.objectContaining({
        feeEstimatedInSol: '0.000005',
        transactionMessage: 'base64-encoded',
        buildingTransaction: false,
      }),
    );
  });
});
