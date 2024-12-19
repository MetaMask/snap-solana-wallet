/* eslint-disable @typescript-eslint/no-throw-literal */
import {
  InvalidParamsError,
  SnapError,
  UnauthorizedError,
} from '@metamask/snaps-sdk';
import type { Struct } from 'superstruct';
import { assert } from 'superstruct';

import { originPermissions } from '../../permissions';

export const validateOrigin = (origin: string, method: string): void => {
  if (!origin) {
    throw new UnauthorizedError('Origin not found');
  }
  if (!originPermissions.get(origin)?.has(method)) {
    throw new UnauthorizedError('Permission denied');
  }
};

/**
 * Validates that the request parameters conform to the expected structure defined by the provided struct.
 *
 * @template Params - The expected structure of the request parameters.
 * @param requestParams - The request parameters to validate.
 * @param struct - The expected structure of the request parameters.
 * @throws {typeof InvalidParamsError} If the request parameters do not conform to the expected structure.
 */
export function validateRequest<Params>(requestParams: Params, struct: Struct) {
  try {
    assert(requestParams, struct);
  } catch (error: any) {
    throw new InvalidParamsError(error.message) as unknown as Error;
  }
}

/**
 * Validates that the response conforms to the expected structure defined by the provided struct.
 *
 * @template Params - The expected structure of the response.
 * @param response - The response to validate.
 * @param struct - The expected structure of the response.
 * @throws {SnapError} If the response does not conform to the expected structure.
 */
export function validateResponse<Params>(response: Params, struct: Struct) {
  try {
    assert(response, struct);
  } catch (error) {
    throw new SnapError('Invalid Response') as unknown as Error;
  }
}
