import { InternalError, type OnCronjobHandler } from '@metamask/snaps-sdk';
import { assert, literal, object, string } from '@metamask/superstruct';

import { analyticsService, keyring } from '../../../../snapContext';
import logger from '../../../utils/logger';
import { NetworkStruct, UuidStruct } from '../../../validation/structs';
import { ScheduleBackgroundEventMethod } from './ScheduleBackgroundEventMethod';

export const OnTransactionSubmittedRequestStruct = object({
  id: string(),
  jsonrpc: literal('2.0'),
  method: literal(ScheduleBackgroundEventMethod.OnTransactionSubmitted),
  params: object({
    accountId: UuidStruct,
    /** The base64 encoded transaction or transaction message. */
    base64EncodedTransaction: string(),
    signature: string(),
    scope: NetworkStruct,
  }),
});

/**
 * Handles side effects that need to happen when a transaction is submitted to the network.
 *
 * @param args - The arguments object.
 * @param args.request - The request object containing transaction details.
 * @returns A promise that resolves when the side effects are complete.
 */
export const onTransactionSubmitted: OnCronjobHandler = async ({ request }) => {
  try {
    logger.info('[onTransactionSubmitted] Cronjob triggered', request);

    assert(request, OnTransactionSubmittedRequestStruct);

    const { accountId, base64EncodedTransaction, signature, scope } =
      request.params;

    const account = await keyring.getAccountOrThrow(accountId);

    await analyticsService.trackEventTransactionSubmitted(
      account,
      base64EncodedTransaction,
      signature,
      scope,
    );
  } catch (error) {
    logger.error(error);
    throw new InternalError(error as string) as Error;
  }
};
