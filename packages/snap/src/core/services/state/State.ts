/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { Balance, Transaction } from '@metamask/keyring-api';
import type { Json } from '@metamask/snaps-sdk';
import type { CaipAssetType } from '@metamask/utils';
import BigNumber from 'bignumber.js';
import { cloneDeepWith } from 'lodash';

import type { SpotPrices } from '../../clients/price-api/types';
import type { SolanaTokenMetadata } from '../../clients/token-metadata-client/types';
import type { SolanaKeyringAccount } from '../../handlers/onKeyringRequest/Keyring';
import { safeMerge } from '../../utils/safeMerge';
import type { IStateManager } from './IStateManager';

export type AccountId = string;

export type EncryptedStateValue = {
  keyringAccounts: Record<string, SolanaKeyringAccount>;
};

export const DEFAULT_ENCRYPTED_STATE: EncryptedStateValue = {
  keyringAccounts: {},
};

export type UnencryptedStateValue = {
  mapInterfaceNameToId: Record<string, string>;
  transactions: Record<AccountId, Transaction[]>;
  assets: Record<AccountId, Record<CaipAssetType, Balance>>;
  metadata: Record<CaipAssetType, SolanaTokenMetadata>;
  tokenPrices: SpotPrices;
};

export const DEFAULT_UNENCRYPTED_STATE: UnencryptedStateValue = {
  mapInterfaceNameToId: {},
  transactions: {},
  assets: {},
  metadata: {},
  tokenPrices: {},
};

export type StateConfig<TStateValue extends object> = {
  encrypted: boolean;
  defaultState: TStateValue;
};

/**
 * This class is a layer on top the the `snap_manageState` API that facilitates its usage:
 *
 * Basic usage:
 * - Get and update the sate of the snap
 *
 * Serialization:
 * - It serializes the data before storing it in the snap state because only JSON-assignable data can be stored.
 * - It deserializes the data after retrieving it from the snap state.
 * - So you don't need to worry about the data format when storing or retrieving data.
 *
 * Default values:
 * - It  merges the default state with the underlying snap state to ensure that we always have default values,
 * letting us avoid a ton of null checks everywhere.
 */
export class State<TStateValue extends object>
  implements IStateManager<TStateValue>
{
  #config: StateConfig<TStateValue>;

  constructor(config: StateConfig<TStateValue>) {
    this.#config = config;
  }

  /**
   * Gets the state of the snap.
   *
   * @returns The state of the snap.
   */
  async get(): Promise<TStateValue> {
    const state = await snap.request({
      method: 'snap_manageState',
      params: {
        operation: 'get',
        encrypted: this.#config.encrypted,
      },
    });

    const stateDeserialized = this.#deserialize(state ?? {});

    // Merge the default state with the underlying snap state
    // to ensure that we always have default values. It lets us avoid a ton of null checks everywhere.
    const stateWithDefaults = safeMerge(
      this.#config.defaultState,
      stateDeserialized,
    );

    return stateWithDefaults;
  }

  /**
   * Updates the state of the snap.
   *
   * @param callback - A function that returns the new state.
   * @returns The new state.
   */
  async update(
    callback: (state: TStateValue) => TStateValue,
  ): Promise<TStateValue> {
    return this.get().then(async (state) => {
      const newState = callback(state);

      await snap.request({
        method: 'snap_manageState',
        params: {
          operation: 'update',
          newState: this.#serialize(newState),
          encrypted: this.#config.encrypted,
        },
      });

      return newState;
    });
  }

  /**
   * Serializes the state to a JSON object that can be stored in the snap state.
   * It transforms non-JSON-serializable values into a specific JSON-serializable representation that can be deserialized later.
   *
   * @param state - The state to serialize.
   * @returns The serialized state.
   */
  #serialize(state: TStateValue): Record<string, Json> {
    const transformedState = cloneDeepWith(state, (value) => {
      if (value === undefined) {
        return {
          __type: 'undefined',
        };
      }

      if (value instanceof BigNumber) {
        return {
          __type: 'BigNumber',
          value: value.toString(),
        };
      }

      if (typeof value === 'bigint') {
        return {
          __type: 'bigint',
          value: value.toString(),
        };
      }

      // Return undefined to let lodash handle the cloning of other values
      return undefined;
    });

    return transformedState;
  }

  /**
   * Deserializes the state from a JSON object that can be stored in the snap state.
   * It transforms the JSON-serializable representation of non-JSON-serializable values back into their original values.
   *
   * @param serializedState - The state to deserialize.
   * @returns The deserialized state.
   */
  #deserialize(serializedState: Record<string, Json>): TStateValue {
    return JSON.parse(JSON.stringify(serializedState), (_key, value) => {
      if (!value) {
        return value;
      }

      if (value.__type === 'undefined') {
        return undefined;
      }

      if (value.__type === 'BigNumber') {
        return new BigNumber(value.value);
      }

      if (value.__type === 'bigint') {
        return BigInt(value.value);
      }

      return value;
    });
  }
}
