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

export const OnTransactionApprovedRequestStruct = object({
  id: string(),
  jsonrpc: literal('2.0'),
  method: literal(ScheduleBackgroundEventMethod.OnTransactionApproved),
  params: object({
    accountId: UuidStruct,
    /** The base64 encoded transaction or transaction message. */
    base64EncodedTransaction: Base64Struct,
    metadata: object({
      scope: NetworkStruct,
      origin: nullable(string()),
    }),
  }),
});

/**
 * Handles side effects that need to happen when the user confirms a transaction in the confirmation UI.
 *
 * @param args - The arguments object.
 * @param args.request - The request object containing transaction details.
 * @returns A promise that resolves when the side effects are complete.
 */
export const onTransactionApproved: OnCronjobHandler = async ({ request }) => {
  try {
    logger.info('[onTransactionApproved] Cronjob triggered', request);

    assert(request, OnTransactionApprovedRequestStruct);

    const { accountId, base64EncodedTransaction, metadata } = request.params;

    const account = await keyring.getAccountOrThrow(accountId);

    await analyticsService.trackEventTransactionApproved(
      account,
      base64EncodedTransaction,
      metadata,
    );
  } catch (error) {
    logger.error(error);
    throw new InternalError(error as string) as Error;
  }
};
