import { InternalError } from '@metamask/snaps-sdk';

import * as snapContext from '../../../../snapContext';
import { refreshTransactions } from './refreshTransactions';

jest.mock('../../../../snapContext', () => ({
  keyring: {
    listAccounts: jest.fn(),
    emitEvent: jest.fn(),
  },
  transactionsService: {
    refreshTransactions: jest.fn(),
  },
}));

describe('refreshTransactions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls the keyring and the transactions service', async () => {
    await refreshTransactions();

    expect(snapContext.keyring.listAccounts).toHaveBeenCalled();
    expect(
      snapContext.transactionsService.refreshTransactions,
    ).toHaveBeenCalled();
  });

  it('throws a non-snap-crashing error when the keyring throws an error', async () => {
    (snapContext.keyring.listAccounts as jest.Mock).mockRejectedValue(
      new Error('Test error'),
    );

    await expect(refreshTransactions()).rejects.toThrow(
      'Internal JSON-RPC error.',
    );
    await expect(refreshTransactions()).rejects.toBeInstanceOf(InternalError);
  });

  it('throws a non-snap-crashing error when the transactions service throws an error', async () => {
    (
      snapContext.transactionsService.refreshTransactions as jest.Mock
    ).mockRejectedValue(new Error('Test error'));

    await expect(refreshTransactions()).rejects.toThrow(
      'Internal JSON-RPC error.',
    );
    await expect(refreshTransactions()).rejects.toBeInstanceOf(InternalError);
  });
});
