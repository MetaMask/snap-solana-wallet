import { assert } from '@metamask/superstruct';
import type { JsonRpcRequest } from '@metamask/utils';

import type { AccountsService, KeyringAccountMonitor } from '../../services';
import { createPrefixedLogger, type ILogger } from '../../utils/logger';
import { AccountNotFoundError, InvalidRequestError } from './errors';
import {
  OnAccountSelectedRequestStruct,
  OnAccountUnselectedRequestStruct,
} from './validation';

export class AccountSelectedHandler {
  #accountsService: AccountsService;

  #keyringAccountMonitor: KeyringAccountMonitor;

  #logger: ILogger;

  constructor(
    accountsService: AccountsService,
    keyringAccountMonitor: KeyringAccountMonitor,
    logger: ILogger,
  ) {
    this.#accountsService = accountsService;
    this.#keyringAccountMonitor = keyringAccountMonitor;
    this.#logger = createPrefixedLogger(logger, '[🎯 AccountSelectedHandler]');
  }

  async handleOnAccountSelected(request: JsonRpcRequest) {
    this.#logger.info('Handle onAccountSelected', request);

    // Validate the request
    try {
      assert(request, OnAccountSelectedRequestStruct);
    } catch (error) {
      throw new InvalidRequestError({ cause: error });
    }

    const {
      params: { account: accountId },
    } = request;

    // Find the account
    const account = await this.#accountsService.findById(accountId);
    if (!account) {
      throw new AccountNotFoundError();
    }

    // Monitor the account
    await this.#keyringAccountMonitor.monitorKeyringAccount(account);
  }

  async handleOnAccountUnselected(request: JsonRpcRequest) {
    this.#logger.info('Handle onAccountUnselected', request);

    // Validate the request
    try {
      assert(request, OnAccountUnselectedRequestStruct);
    } catch (error) {
      throw new InvalidRequestError({ cause: error });
    }

    const {
      params: { account: accountId },
    } = request;

    // Find the account
    const account = await this.#accountsService.findById(accountId);
    if (!account) {
      throw new AccountNotFoundError();
    }

    // Stop monitoring the account
    await this.#keyringAccountMonitor.stopMonitorKeyringAccount(account);
  }
}
