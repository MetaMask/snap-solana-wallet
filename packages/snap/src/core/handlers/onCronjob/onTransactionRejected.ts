import { InternalError, type OnCronjobHandler } from '@metamask/snaps-sdk';
import { assert, literal, object, string } from '@metamask/superstruct';

import { analyticsService, keyring } from '../../../snapContext';
import logger from '../../utils/logger';
import { NetworkStruct, UuidStruct } from '../../validation/structs';
import { CronjobMethod } from './CronjobMethod';

export const OnTransactionRejectedRequestStruct = object({
  id: string(),
  jsonrpc: literal('2.0'),
  method: literal(CronjobMethod.OnTransactionRejected),
  params: object({
    accountId: UuidStruct,
    base64EncodedTransactionMessage: string(),
    scope: NetworkStruct,
  }),
});

/**
 * Handles side effects that need to happen when user rejects a transaction (= does not confirm it).
 *
 * @param args - The arguments object.
 * @param args.request - The request object containing transaction details.
 * @returns A promise that resolves when the side effects are complete.
 */
export const onTransactionRejected: OnCronjobHandler = async ({ request }) => {
  try {
    logger.info('[onTransactionRejected] Cronjob triggered', request);

    assert(request, OnTransactionRejectedRequestStruct);

    const { accountId, base64EncodedTransactionMessage, scope } =
      request.params;

    const account = await keyring.getAccountOrThrow(accountId);

    await analyticsService.trackEventTransactionRejected(
      account,
      base64EncodedTransactionMessage,
      scope,
    );
  } catch (error) {
    logger.error(error);
    throw new InternalError(error as string) as Error;
  }
};
