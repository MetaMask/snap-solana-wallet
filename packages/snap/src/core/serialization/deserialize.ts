import type { Json } from '@metamask/snaps-sdk';
import BigNumber from 'bignumber.js';

import type { Serializable } from './types';

/**
 * Deserializes the passed value from a JSON object to an object with its the original values.
 * It transforms the JSON-serializable representation of non-JSON-serializable values back into their original values.
 *
 * @param serializedValue - The value to deserialize.
 * @returns The deserialized value.
 */
export const deserialize = (serializedValue: Json): Serializable =>
  JSON.parse(JSON.stringify(serializedValue), (_key, value) => {
    if (!value) {
      return value;
    }

    if (value.__type === 'undefined') {
      return undefined;
    }

    if (value.__type === 'BigNumber') {
      return new BigNumber(value.value);
    }

    // if (value.__type === 'bigint' && value.__brand === 'Lamports') {
    //   return lamports(BigInt(value.value));
    // }

    if (value.__type === 'bigint') {
      return BigInt(value.value);
    }

    return value;
  });
