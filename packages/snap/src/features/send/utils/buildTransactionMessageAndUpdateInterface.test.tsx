/* eslint-disable camelcase */

import { KnownCaip19Id, Network } from '../../../core/constants/solana';
import { MOCK_EXECUTION_SCENARIO_SEND_SOL } from '../../../core/services/signer/mocks/scenarios/sendSol';
import {
  MOCK_SOLANA_KEYRING_ACCOUNT_0,
  MOCK_SOLANA_KEYRING_ACCOUNT_1,
} from '../../../core/test/mocks/solana-keyring-accounts';
import {
  getInterfaceContextIfExists,
  updateInterfaceIfExists,
} from '../../../core/utils/interface';
import {
  keyring,
  sendSolBuilder,
  sendSplTokenBuilder,
} from '../../../snapContext';
import { DEFAULT_SEND_CONTEXT } from '../render';
import { SendCurrencyType, type SendContext } from '../types';
import { sendFieldsAreValid } from '../validation/form';
import { buildTransactionMessageAndUpdateInterface_INTERNAL } from './buildTransactionMessageAndUpdateInterface';

// Mock dependencies
jest.mock('../../../core/utils/interface');
jest.mock('../validation/form');
jest.mock('../../../snapContext');
jest.mock('lodash', () => ({
  ...jest.requireActual('lodash'),
  debounce: (fn: any) => fn, // Make debounce synchronous for testing
}));

describe('buildTransactionMessageAndUpdateInterface', () => {
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

    jest
      .mocked(sendSolBuilder)
      .buildTransactionMessage.mockResolvedValue(
        MOCK_EXECUTION_SCENARIO_SEND_SOL.transactionMessage,
      );
    jest.mocked(sendSolBuilder).getComputeUnitLimit.mockReturnValue(450);
    jest
      .mocked(sendSolBuilder)
      .getComputeUnitPriceMicroLamportsPerComputeUnit.mockReturnValue(10000n);

    (getInterfaceContextIfExists as jest.Mock).mockResolvedValue(mockContext);
  });

  describe('buildTransactionMessageAndUpdateInterface_INTERNAL', () => {
    it('does not build transaction if fields are invalid', async () => {
      (sendFieldsAreValid as jest.Mock).mockReturnValue(false);

      await buildTransactionMessageAndUpdateInterface_INTERNAL(
        mockId,
        mockContext,
      );

      expect(updateInterfaceIfExists).not.toHaveBeenCalled();
      expect(keyring.getAccountOrThrow).not.toHaveBeenCalled();
    });

    it('builds SOL transfer transaction when tokenCaipId is native token', async () => {
      await buildTransactionMessageAndUpdateInterface_INTERNAL(
        mockId,
        mockContext,
      );

      expect(sendSolBuilder.buildTransactionMessage).toHaveBeenCalledWith({
        from: { address: MOCK_SOLANA_KEYRING_ACCOUNT_0.address },
        to: MOCK_SOLANA_KEYRING_ACCOUNT_1.address,
        amount: '1.0',
        network: Network.Testnet,
      });
      expect(updateInterfaceIfExists).toHaveBeenCalledTimes(2);
    });

    it('builds SPL token transaction when tokenCaipId is not native token', async () => {
      const splContext = {
        ...mockContext,
        tokenCaipId: KnownCaip19Id.UsdcLocalnet,
      } as unknown as SendContext;

      await buildTransactionMessageAndUpdateInterface_INTERNAL(
        mockId,
        splContext,
      );

      expect(sendSplTokenBuilder.buildTransactionMessage).toHaveBeenCalled();
      expect(updateInterfaceIfExists).toHaveBeenCalledTimes(2);
    });

    it('handles transaction build errors', async () => {
      (sendSolBuilder.buildTransactionMessage as jest.Mock).mockRejectedValue(
        new Error('Build failed'),
      );

      await buildTransactionMessageAndUpdateInterface_INTERNAL(
        mockId,
        mockContext,
      );

      expect(updateInterfaceIfExists).toHaveBeenCalledWith(
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
      await buildTransactionMessageAndUpdateInterface_INTERNAL(
        mockId,
        mockContext,
      );

      expect(updateInterfaceIfExists).toHaveBeenLastCalledWith(
        mockId,
        expect.anything(),
        expect.objectContaining({
          feeEstimatedInSol: '0.000005004', // Base fee of 5000 + priority fee of 4
          transactionMessage:
            MOCK_EXECUTION_SCENARIO_SEND_SOL.transactionMessageBase64Encoded,
          buildingTransaction: false,
        }),
      );
    });

    it('gracefully exits when interface context no longer exists after build', async () => {
      // getInterfaceContextIfExists is called after build - returns null (interface closed)
      (getInterfaceContextIfExists as jest.Mock).mockResolvedValueOnce(null);

      await buildTransactionMessageAndUpdateInterface_INTERNAL(
        mockId,
        mockContext,
      );

      // Should only call updateInterfaceIfExists once (initial update), not the second time
      expect(updateInterfaceIfExists).toHaveBeenCalledTimes(1);
    });

    it('gracefully exits when interface context no longer exists after error', async () => {
      (sendSolBuilder.buildTransactionMessage as jest.Mock).mockRejectedValue(
        new Error('Build failed'),
      );
      (getInterfaceContextIfExists as jest.Mock).mockResolvedValue(null);

      await buildTransactionMessageAndUpdateInterface_INTERNAL(
        mockId,
        mockContext,
      );

      // Should only call updateInterfaceIfExists once (initial update), not for error display
      expect(updateInterfaceIfExists).toHaveBeenCalledTimes(1);
    });
  });
});
