import { InternalError, type OnCronjobHandler } from '@metamask/snaps-sdk';
import {
  assert,
  literal,
  nullable,
  object,
  string,
} from '@metamask/superstruct';

import { analyticsService, keyring } from '../../../../snapContext';
import logger from '../../../utils/logger';
import {
  Base64Struct,
  NetworkStruct,
  UuidStruct,
} from '../../../validation/structs';
import { ScheduleBackgroundEventMethod } from './ScheduleBackgroundEventMethod';

export const OnTransactionRejectedRequestStruct = object({
  id: string(),
  jsonrpc: literal('2.0'),
  method: literal(ScheduleBackgroundEventMethod.OnTransactionRejected),
  params: object({
    accountId: UuidStruct,
    /** The base64 encoded transaction or transaction message. */
    base64EncodedTransaction: Base64Struct,
    scope: NetworkStruct,
    origin: nullable(string()),
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

    const { accountId, base64EncodedTransaction, scope, origin } =
      request.params;

    const account = await keyring.getAccountOrThrow(accountId);

    await analyticsService.trackEventTransactionRejected(
      account,
      base64EncodedTransaction,
      scope,
      origin ?? undefined,
    );
  } catch (error) {
    logger.error(error);
    throw new InternalError(error as string) as Error;
  }
};
