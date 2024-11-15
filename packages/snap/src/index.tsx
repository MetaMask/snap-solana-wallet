import { handleKeyringRequest } from '@metamask/keyring-api';
import type { Json, OnKeyringRequestHandler } from '@metamask/snaps-sdk';
import {
  MethodNotFoundError,
  SnapError,
  UnauthorizedError,
  type OnRpcRequestHandler,
} from '@metamask/snaps-sdk';

import { install } from './core/polyfills/ed25519/install';
import { SolanaKeyring } from './core/services/keyring';
import { isSnapRpcError } from './core/utils/errors';
import logger from './core/utils/logger';
import { originPermissions } from './permissions';

/**
 * Install polyfills
 * - Add Ed25519 cryptography functionality to the browser crypto API
 */
install();

const keyring = new SolanaKeyring();

export const validateOrigin = (origin: string, method: string): void => {
  if (!origin) {
    // eslint-disable-next-line @typescript-eslint/no-throw-literal
    throw new UnauthorizedError('Origin not found');
  }
  if (!originPermissions.get(origin)?.has(method)) {
    // eslint-disable-next-line @typescript-eslint/no-throw-literal
    throw new UnauthorizedError(`Permission denied`);
  }
};

/**
 * Handle incoming JSON-RPC requests, sent through `wallet_invokeSnap`.
 *
 * @param args - The request handler args as object.
 * @param args.origin - The origin of the request, e.g., the website that
 * invoked the snap.
 * @param args.request - A validated JSON-RPC request object.
 * @throws If the request method is not valid for this snap.
 */
export const onRpcRequest: OnRpcRequestHandler = async ({
  origin,
  request,
}) => {
  try {
    const { method } = request;

    validateOrigin(origin, method);

    switch (method) {
      default:
        throw new MethodNotFoundError() as unknown as Error;
    }
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
    validateOrigin(origin, request.method);

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
      `onKeyringRequest error: ${JSON.stringify(snapError.toJSON(), null, 2)}`,
    );

    throw snapError;
  }
};
