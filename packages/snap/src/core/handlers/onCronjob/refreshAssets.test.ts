import * as snapContext from '../../../snapContext';
import {
  MOCK_SOLANA_KEYRING_ACCOUNT_0,
  MOCK_SOLANA_KEYRING_ACCOUNTS,
} from '../../test/mocks/solana-keyring-accounts';
import { CronjobMethod } from './CronjobMethod';
import { refreshAssets } from './refreshAssets';

jest.mock('../../../snapContext', () => ({
  keyring: {
    getAccountOrThrow: jest.fn(),
    listAccounts: jest.fn(),
  },
  assetsService: {
    refreshAssets: jest.fn(),
  },
}));

describe('refreshAssets', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('only refreshes assets for the given account when accountId is provided', async () => {
    jest
      .mocked(snapContext.keyring.getAccountOrThrow as jest.Mock)
      .mockResolvedValueOnce(MOCK_SOLANA_KEYRING_ACCOUNT_0);

    await refreshAssets({
      request: {
        id: '1',
        method: CronjobMethod.RefreshAssets,
        jsonrpc: '2.0',
        params: {
          accountId: MOCK_SOLANA_KEYRING_ACCOUNT_0.id,
        },
      },
    });

    expect(snapContext.assetsService.refreshAssets).toHaveBeenCalledWith([
      MOCK_SOLANA_KEYRING_ACCOUNT_0,
    ]);
  });

  it('refreshes assets for all accounts when no accountId is provided', async () => {
    jest
      .mocked(snapContext.keyring.listAccounts as jest.Mock)
      .mockResolvedValueOnce(MOCK_SOLANA_KEYRING_ACCOUNTS);

    await refreshAssets({
      request: {
        id: '1',
        method: CronjobMethod.RefreshAssets,
        jsonrpc: '2.0',
        params: {},
      },
    });

    expect(snapContext.assetsService.refreshAssets).toHaveBeenCalledWith(
      MOCK_SOLANA_KEYRING_ACCOUNTS,
    );
  });
});
