/* eslint-disable @typescript-eslint/naming-convention */
import type { Json } from '@metamask/snaps-sdk';
import type BigNumber from 'bignumber.js';

/**
 * A primitive value that can be serialized to JSON using the `serialize` function.
 */
export type Serializable =
  | Json
  | undefined
  | null
  | bigint
  //   | Lamports
  | BigNumber
  | Serializable[]
  | {
      [prop: string]: Serializable;
    };
