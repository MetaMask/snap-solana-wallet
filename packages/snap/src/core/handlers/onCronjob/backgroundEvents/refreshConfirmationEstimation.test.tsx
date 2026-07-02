import { SolMethod } from '@metamask/keyring-api';

import { transactionScanService, state } from '../../../../snapContext';
import { Network } from '../../../constants/solana';
import { serialize } from '../../../serialization/serialize';
import { trackError } from '../../../utils/errors';
import { getInterfaceContext, updateInterface } from '../../../utils/interface';
import { refreshConfirmationEstimation } from './refreshConfirmationEstimation';

jest.mock('../../../utils/errors', () => ({
  trackError: jest.fn().mockResolvedValue('tracked-error-id'),
}));

jest.mock('../../../serialization/serialize', () => ({
  serialize: jest.fn((value) => value),
}));

jest.mock('../../../utils/interface', () => ({
  CONFIRM_SIGN_AND_SEND_TRANSACTION_INTERFACE_NAME: 'confirmation-interface',
  getInterfaceContext: jest.fn(),
  updateInterface: jest.fn(),
}));

jest.mock(
  '../../../../features/confirmation/views/ConfirmTransactionRequest/ConfirmTransactionRequest',
  () => ({
    ConfirmTransactionRequest: () => null,
  }),
);

jest.mock('../../../../snapContext', () => ({
  state: {
    getKey: jest.fn(),
  },
  transactionScanService: {
    scanTransaction: jest.fn(),
  },
}));

const setupTest = () => {
  const interfaceContext = {
    account: {
      address: 'BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP',
    },
    transaction: 'mock-transaction',
    scope: Network.Mainnet,
    method: SolMethod.SignAndSendTransaction,
    origin: 'https://metamask.io',
    preferences: {
      simulateOnChainActions: true,
    },
    scanFetchStatus: 'fetched',
  };

  (state.getKey as jest.Mock).mockResolvedValue({
    'confirmation-interface': 'interface-id',
  });
  (getInterfaceContext as jest.Mock).mockResolvedValue(interfaceContext);
  (updateInterface as jest.Mock).mockResolvedValue(undefined);
  (serialize as jest.Mock).mockImplementation((value) => value);
};

describe('refreshConfirmationEstimation', () => {
  it('tracks refresh failures and restores the fetched state', async () => {
    setupTest();

    const error = new Error('Scan failed');

    (transactionScanService.scanTransaction as jest.Mock).mockRejectedValue(
      error,
    );

    await refreshConfirmationEstimation({ request: {} as any });

    expect(trackError).toHaveBeenCalledWith(error);
    expect(updateInterface).toHaveBeenLastCalledWith(
      'interface-id',
      null,
      expect.objectContaining({
        scanFetchStatus: 'fetched',
      }),
    );
  });
});
