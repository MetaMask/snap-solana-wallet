import { KeyringRpcMethod } from '@metamask/keyring-api';
import { handleKeyringRequest } from '@metamask/keyring-snap-sdk';
import type {
  GetClientStatusResult,
  Json,
  OnAssetHistoricalPriceHandler,
  OnAssetsConversionHandler,
  OnAssetsLookupHandler,
  OnClientRequestHandler,
  OnCronjobHandler,
  OnKeyringRequestHandler,
  OnProtocolRequestHandler,
  OnUserInputHandler,
} from '@metamask/snaps-sdk';
import {
  MethodNotFoundError,
  SnapError,
  type OnRpcRequestHandler,
} from '@metamask/snaps-sdk';
import { assert, enums } from '@metamask/superstruct';
import BigNumber from 'bignumber.js';

import { onAssetHistoricalPrice as onAssetHistoricalPriceHandler } from './core/handlers/onAssetHistoricalPrice/onAssetHistoricalPrice';
import { onAssetsConversion as onAssetsConversionHandler } from './core/handlers/onAssetsConversion/onAssetsConversion';
import { onAssetsLookup as onAssetsLookupHandler } from './core/handlers/onAssetsLookup/onAssetsLookup';
import { handlers as onCronjobHandlers } from './core/handlers/onCronjob';
import { ScheduleBackgroundEventMethod } from './core/handlers/onCronjob/backgroundEvents/ScheduleBackgroundEventMethod';
import { CronjobMethod } from './core/handlers/onCronjob/cronjobs/CronjobMethod';
import { onProtocolRequest as onProtocolRequestHandler } from './core/handlers/onProtocolRequest/onProtocolRequest';
import { handlers as onRpcRequestHandlers } from './core/handlers/onRpcRequest';
import { RpcRequestMethod } from './core/handlers/onRpcRequest/types';
import { isSnapRpcError } from './core/utils/errors';
import { getClientStatus } from './core/utils/interface';
import logger from './core/utils/logger';
import { validateOrigin } from './core/validation/validators';
import { eventHandlers as confirmSignInEvents } from './features/confirmation/views/ConfirmSignIn/events';
import { eventHandlers as confirmSignMessageEvents } from './features/confirmation/views/ConfirmSignMessage/events';
import { eventHandlers as confirmSignAndSendTransactionEvents } from './features/confirmation/views/ConfirmTransactionRequest/events';
import { eventHandlers as sendFormEvents } from './features/send/views/SendForm/events';
import { eventHandlers as transactionConfirmationEvents } from './features/send/views/TransactionConfirmation/events';
import { installPolyfills } from './infrastructure';
import snapContext, {
  clientRequestHandler,
  keyring,
  state,
} from './snapContext';

installPolyfills();

// Lowest precision we ever go for: MicroLamports represented in Sol amount
BigNumber.config({ EXPONENTIAL_AT: 16 });

/**
 * Handle incoming JSON-RPC requests, sent through `wallet_invokeSnap`.
 *
 * @param args - The request handler args as object.
 * @param args.origin - The origin of the request, e.g., the website that
 * invoked the snap.
 * @param args.request - A validated JSON-RPC request object.
 * @returns A promise that resolves to the result of the RPC request.
 * @throws If the request method is not valid for this snap.
 */
export const onRpcRequest: OnRpcRequestHandler = async ({
  origin,
  request,
}) => {
  try {
    logger.log('[🔄 onRpcRequest]', request.method, request);

    const { method } = request;

    validateOrigin(origin, method);

    const handler = onRpcRequestHandlers[method as RpcRequestMethod];

    if (!handler) {
      throw new MethodNotFoundError(
        `RpcRequest method ${method} not found. Available methods: ${Object.values(
          RpcRequestMethod,
        ).toString()}`,
      ) as unknown as Error;
    }

    return handler({ origin, request });
  } catch (error: any) {
    let snapError = error;

    if (!isSnapRpcError(error)) {
      snapError = new SnapError(error);
    }
    logger.error(
      `onRpcRequest error: ${JSON.stringify(snapError.toJSON(), null, 2)}`,
    );
    throw snapError;
  }
};

/**
 * Handle incoming keyring requests.
 *
 * @param args - The request handler args as object.
 * @param args.origin - The origin of the request, e.g., the website that
 * invoked the snap.
 * @param args.request - A validated keyring request object.
 * @returns A promise that resolves to a JSON object.
 * @throws If the request method is not valid for this snap.
 */
export const onKeyringRequest: OnKeyringRequestHandler = async ({
  origin,
  request,
}): Promise<Json> => {
  try {
    logger.log('[🔑 onKeyringRequest]', request.method, request);

    validateOrigin(origin, request.method);

    // This is a temporal fix to prevent the swap/bridge functionality breaking
    // TODO: Remove this once changes in bridge-status-controller are in place
    if (
      request.method === KeyringRpcMethod.SubmitRequest &&
      request.params &&
      !('origin' in request.params)
    ) {
      (request.params as Record<string, Json>).origin = 'https://metamask.io';
    }

    return (await handleKeyringRequest(
      keyring,
      request,
    )) as unknown as Promise<Json>;
  } catch (error: any) {
    let snapError = error;

    if (!isSnapRpcError(error)) {
      snapError = new SnapError(error);
    }

    logger.error(
      `onKeyringRequest - ${request.method} - Error: ${JSON.stringify(
        snapError.toJSON(),
        null,
        2,
      )}`,
    );

    throw snapError;
  }
};

/**
 * Handle user events requests.
 *
 * @param args - The request handler args as object.
 * @param args.id - The interface id associated with the event.
 * @param args.event - The event object.
 * @param args.context - The context object.
 * @returns A promise that resolves to a JSON object.
 * @throws If the request method is not valid for this snap.
 */
export const onUserInput: OnUserInputHandler = async ({
  id,
  event,
  context,
}) => {
  logger.log('[👇 onUserInput]', id, event);

  // Using the name of the component, route it to the correct handler
  if (!event.name) {
    return;
  }

  const uiEventHandlers: Record<string, (...args: any) => Promise<void>> = {
    ...sendFormEvents,
    ...transactionConfirmationEvents,
    ...confirmSignAndSendTransactionEvents,
    ...confirmSignMessageEvents,
    ...confirmSignInEvents,
  };

  const handler = uiEventHandlers[event.name];

  if (!handler) {
    return;
  }

  await handler({ id, event, context, snapContext });
};

/**
 * Handle incoming cronjob requests.
 *
 * @param args - The request handler args as object.
 * @param args.request - A validated cronjob request object.
 * @returns A promise that resolves to a JSON object.
 * @throws If the request method is not valid for this snap.
 * @see https://docs.metamask.io/snaps/reference/entry-points/#oncronjob
 */
export const onCronjob: OnCronjobHandler = async ({ request }) => {
  logger.log('[⏱️ onCronjob]', request.method, request);

  const { method } = request;
  assert(
    method,
    enums([
      ...Object.values(CronjobMethod),
      ...Object.values(ScheduleBackgroundEventMethod),
    ]),
  );

  /**
   * Don't run cronjobs if client is locked or inactive
   * - We dont want to call cronjobs if the client is locked
   * - We Dont want to call cronjobs if the client is inactive (except if we havent run a cronjob in the last 15 minutes)
   */
  const { locked, active } =
    (await getClientStatus()) as GetClientStatusResult & {
      active: boolean | undefined; // FIXME: Remove this once the snap SDK is updated
    };

  logger.log('[🔑 onCronjob] Client status', { locked, active });

  if (locked) {
    return Promise.resolve();
  }

  // explicit check for non-undefined active
  // to make sure the cronjob is executed if `active` is undefined
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-boolean-literal-compare
  if (active === false) {
    const lastCronjobRun = await state.getKey<number>('lastCronjobRun');
    const THIRTY_MINUTES = 30 * 60 * 1000; // 30 minutes in milliseconds

    logger.log('[🔑 onCronjob] Last cronjob run', { lastCronjobRun });

    // Only skip if we've run a cronjob in the last 30 minutes
    if (lastCronjobRun && Date.now() - lastCronjobRun < THIRTY_MINUTES) {
      logger.log(
        '[🔑 onCronjob] Skipping cronjob because it has been run in the last 30 minutes',
      );
      return Promise.resolve();
    }
    // if `lastCronjobRun` is undefined, we can run the cronjob
  }

  await state.setKey('lastCronjobRun', Date.now());

  logger.log('[🔑 onCronjob] Running cronjob', { method });

  const handler = onCronjobHandlers[method];
  return handler({ request });
};

export const onAssetsLookup: OnAssetsLookupHandler = onAssetsLookupHandler;

export const onAssetsConversion: OnAssetsConversionHandler =
  onAssetsConversionHandler;

export const onProtocolRequest: OnProtocolRequestHandler =
  onProtocolRequestHandler;

export const onAssetHistoricalPrice: OnAssetHistoricalPriceHandler =
  onAssetHistoricalPriceHandler;

export const onClientRequest: OnClientRequestHandler = async ({ request }) =>
  clientRequestHandler.handle(request);
