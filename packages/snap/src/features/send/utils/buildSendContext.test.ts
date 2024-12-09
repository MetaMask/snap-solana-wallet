import {
  SolanaCaip19Tokens,
  SolanaCaip2Networks,
} from '../../../core/constants/solana';
import { getPreferences } from '../../../core/utils/interface';
import logger from '../../../core/utils/logger';
import { keyring, state } from '../../../snap-context';
import { buildSendContext } from './buildSendContext';

// Mock dependencies
jest.mock('../../../snap-context', () => ({
  keyring: {
    listAccounts: jest.fn(),
    getAccountBalances: jest.fn(),
  },
  state: {
    get: jest.fn(),
  },
}));

jest.mock('../../../core/utils/interface', () => ({
  getPreferences: jest.fn(),
}));

jest.mock('../../../core/utils/logger', () => ({
  error: jest.fn(),
}));

describe('buildSendContext', () => {
  const mockAccounts = [
    { id: 'account1', address: 'address1' },
    { id: 'account2', address: 'address2' },
  ];

  const mockBalance = {
    balance: '1000000000',
    decimals: 9,
  };

  const mockStateValue = {
    tokenPrices: {
      [SolanaCaip19Tokens.SOL]: {
        price: 100,
        symbol: SolanaCaip19Tokens.SOL,
        caip19Id: SolanaCaip19Tokens.SOL,
        address: '',
        decimals: 9,
      },
    },
  };

  const mockPreferences = {
    locale: 'en-US',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('builds send context successfully', async () => {
    // Setup mocks
    (keyring.listAccounts as jest.Mock).mockResolvedValue(mockAccounts);
    (keyring.getAccountBalances as jest.Mock).mockResolvedValue({
      [`${SolanaCaip2Networks.Mainnet}/${SolanaCaip19Tokens.SOL}`]: mockBalance,
    });
    (state.get as jest.Mock).mockResolvedValue(mockStateValue);
    (getPreferences as jest.Mock).mockResolvedValue(mockPreferences);

    // Execute
    const result = await buildSendContext(
      SolanaCaip2Networks.Mainnet,
      'account1',
    );

    // Assert
    expect(result).toStrictEqual(
      expect.objectContaining({
        scope: SolanaCaip2Networks.Mainnet,
        fromAccountId: 'account1',
        accounts: mockAccounts,
        tokenPrices: mockStateValue.tokenPrices,
        locale: mockPreferences.locale,
      }),
    );

    expect(keyring.listAccounts).toHaveBeenCalled();
    expect(keyring.getAccountBalances).toHaveBeenCalledTimes(2);
    expect(state.get).toHaveBeenCalled();
    expect(getPreferences).toHaveBeenCalled();
  });

  it('handles listAccounts failure gracefully', async () => {
    // Setup mocks
    (keyring.listAccounts as jest.Mock).mockRejectedValue(
      new Error('List accounts failed'),
    );
    (state.get as jest.Mock).mockResolvedValue(mockStateValue);
    (getPreferences as jest.Mock).mockResolvedValue(mockPreferences);

    const result = await buildSendContext(
      SolanaCaip2Networks.Mainnet,
      'account1',
    );

    expect(result).toMatchObject({
      accounts: [],
      balances: {},
      scope: SolanaCaip2Networks.Mainnet,
      locale: mockPreferences.locale,
      tokenPrices: mockStateValue.tokenPrices,
    });
  });

  it('handles getPreferences failure gracefully', async () => {
    // Setup mocks
    (keyring.listAccounts as jest.Mock).mockResolvedValue(mockAccounts);
    (state.get as jest.Mock).mockResolvedValue(mockStateValue);
    (getPreferences as jest.Mock).mockRejectedValue(
      new Error('Preferences failed'),
    );

    const result = await buildSendContext(
      SolanaCaip2Networks.Mainnet,
      'account1',
    );

    expect(result).toMatchObject({
      accounts: [],
      locale: 'en',
      scope: SolanaCaip2Networks.Mainnet,
    });
    expect(logger.error).toHaveBeenCalledWith(
      'Failed to get send context',
      expect.any(Error),
    );
  });

  it('handles getAccountBalances failure gracefully', async () => {
    // Setup mocks
    (keyring.listAccounts as jest.Mock).mockResolvedValue(mockAccounts);
    (keyring.getAccountBalances as jest.Mock).mockRejectedValue(
      new Error('Balance fetch failed'),
    );
    (state.get as jest.Mock).mockResolvedValue(mockStateValue);
    (getPreferences as jest.Mock).mockResolvedValue(mockPreferences);

    const result = await buildSendContext(
      SolanaCaip2Networks.Mainnet,
      'account1',
    );

    expect(result).toMatchObject({
      accounts: mockAccounts,
      balances: expect.objectContaining({
        account1: {
          amount: '0',
          unit: `${SolanaCaip2Networks.Mainnet}/${SolanaCaip19Tokens.SOL}`,
        },
        account2: {
          amount: '0',
          unit: `${SolanaCaip2Networks.Mainnet}/${SolanaCaip19Tokens.SOL}`,
        },
      }),
      scope: SolanaCaip2Networks.Mainnet,
      locale: mockPreferences.locale,
    });
  });
});
