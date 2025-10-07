import type { JsonRpcRequest } from '@metamask/utils';

import type { AccountsService, KeyringAccountMonitor } from '../../services';
import { mockLogger } from '../../services/mocks/logger';
import { MOCK_SOLANA_KEYRING_ACCOUNT_0 } from '../../test/mocks/solana-keyring-accounts';
import { AccountSelectedHandler } from './AccountSelectedHandler';
import { AccountNotFoundError, InvalidRequestError } from './errors';
import { AccountSelectedHandlerMethod } from './types';

describe('AccountSelectedHandler', () => {
  let handler: AccountSelectedHandler;
  let mockAccountsService: jest.Mocked<AccountsService>;
  let mockKeyringAccountMonitor: jest.Mocked<KeyringAccountMonitor>;

  const account = MOCK_SOLANA_KEYRING_ACCOUNT_0;

  beforeEach(() => {
    mockAccountsService = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<AccountsService>;

    mockKeyringAccountMonitor = {
      monitorKeyringAccount: jest.fn(),
      stopMonitorKeyringAccount: jest.fn(),
    } as unknown as jest.Mocked<KeyringAccountMonitor>;

    handler = new AccountSelectedHandler(
      mockAccountsService,
      mockKeyringAccountMonitor,
      mockLogger,
    );

    jest.clearAllMocks();
  });

  describe('handleOnAccountSelected', () => {
    const validRequest: JsonRpcRequest = {
      jsonrpc: '2.0',
      id: 1,
      method: AccountSelectedHandlerMethod.OnAccountSelected,
      params: {
        account: account.id,
      },
    };

    it('throws InvalidRequestError when request is invalid and does not monitor the account', async () => {
      const invalidRequest: JsonRpcRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: AccountSelectedHandlerMethod.OnAccountSelected,
      };

      await expect(
        handler.handleOnAccountSelected(invalidRequest),
      ).rejects.toThrow(InvalidRequestError);

      expect(mockAccountsService.findById).not.toHaveBeenCalled();
      expect(
        mockKeyringAccountMonitor.monitorKeyringAccount,
      ).not.toHaveBeenCalled();
    });

    it('throws AccountNotFoundError when account not found and does not monitor the account', async () => {
      mockAccountsService.findById.mockResolvedValue(null);

      await expect(
        handler.handleOnAccountSelected(validRequest),
      ).rejects.toThrow(AccountNotFoundError);

      expect(mockAccountsService.findById).toHaveBeenCalledWith(account.id);
      expect(
        mockKeyringAccountMonitor.monitorKeyringAccount,
      ).not.toHaveBeenCalled();
    });

    it('monitors the account', async () => {
      mockAccountsService.findById.mockResolvedValue(account);
      mockKeyringAccountMonitor.monitorKeyringAccount.mockResolvedValue();

      await handler.handleOnAccountSelected(validRequest);

      expect(mockAccountsService.findById).toHaveBeenCalledWith(account.id);
      expect(
        mockKeyringAccountMonitor.monitorKeyringAccount,
      ).toHaveBeenCalledWith(account);
    });
  });

  describe('handleOnAccountUnselected', () => {
    const validRequest: JsonRpcRequest = {
      jsonrpc: '2.0',
      id: 1,
      method: AccountSelectedHandlerMethod.OnAccountUnselected,
      params: {
        account: account.id,
      },
    };

    it('throws InvalidRequestError when request is invalid and does not stop monitoring the account', async () => {
      const invalidRequest: JsonRpcRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: AccountSelectedHandlerMethod.OnAccountUnselected,
      };

      await expect(
        handler.handleOnAccountUnselected(invalidRequest),
      ).rejects.toThrow(InvalidRequestError);

      expect(mockAccountsService.findById).not.toHaveBeenCalled();
      expect(
        mockKeyringAccountMonitor.stopMonitorKeyringAccount,
      ).not.toHaveBeenCalled();
    });

    it('throws AccountNotFoundError when account not found and does not stop monitoring the account', async () => {
      mockAccountsService.findById.mockResolvedValue(null);

      await expect(
        handler.handleOnAccountUnselected(validRequest),
      ).rejects.toThrow(AccountNotFoundError);

      expect(mockAccountsService.findById).toHaveBeenCalledWith(account.id);
      expect(
        mockKeyringAccountMonitor.stopMonitorKeyringAccount,
      ).not.toHaveBeenCalled();
    });

    it('stops monitoring the account', async () => {
      mockAccountsService.findById.mockResolvedValue(account);
      mockKeyringAccountMonitor.stopMonitorKeyringAccount.mockResolvedValue();

      await handler.handleOnAccountUnselected(validRequest);

      expect(mockAccountsService.findById).toHaveBeenCalledWith(account.id);
      expect(
        mockKeyringAccountMonitor.stopMonitorKeyringAccount,
      ).toHaveBeenCalledWith(account);
    });
  });
});
