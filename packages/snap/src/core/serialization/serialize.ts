/* eslint-disable @typescript-eslint/naming-convention */
import type { Json } from '@metamask/snaps-sdk';
import BigNumber from 'bignumber.js';
import { cloneDeepWith } from 'lodash';

import type { Serializable } from './types';

/**
 * Serializes the passed value to a JSON object so it can be stored in JSON-serializable storage like the snap state and interface context.
 * It transforms non-JSON-serializable values into a specific JSON-serializable representation that can be deserialized later.
 *
 * @param value - The value to serialize.
 * @returns The serialized value.
 * @throws If an unsupported case is encountered. This indicates a missing implementation.
 */
export const serialize = (value: Serializable): Record<string, Json> =>
  cloneDeepWith(value, (val) => {
    if (val === undefined) {
      return {
        __type: 'undefined',
      };
    }

    if (val instanceof BigNumber) {
      return {
        __type: 'BigNumber',
        value: val.toString(),
      };
    }

    // if (isLamports(val)) {
    //   return {
    //     __type: 'bigint',
    //     __brand: 'Lamports',
    //     value: val.toString(),
    //   };
    // }

    if (typeof val === 'bigint') {
      return {
        __type: 'bigint',
        value: val.toString(),
      };
    }

    // Return undefined to let lodash handle the cloning of other values
    return undefined;
  });
