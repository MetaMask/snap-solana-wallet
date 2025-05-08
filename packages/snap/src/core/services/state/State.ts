/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { Balance, Transaction } from '@metamask/keyring-api';
import type { CaipAssetType } from '@metamask/utils';

import type { SpotPrices } from '../../clients/price-api/types';
import type { SolanaKeyringAccount } from '../../handlers/onKeyringRequest/Keyring';
import { deserialize } from '../../serialization/deserialize';
import { serialize } from '../../serialization/serialize';
import type { Serializable } from '../../serialization/types';
import { safeMerge } from '../../utils/safeMerge';
import type { IStateManager } from './IStateManager';

export type AccountId = string;

export type UnencryptedStateValue = {
  keyringAccounts: Record<string, SolanaKeyringAccount>;
  mapInterfaceNameToId: Record<string, string>;
  transactions: Record<AccountId, Transaction[]>;
  assets: Record<AccountId, Record<CaipAssetType, Balance>>;
  tokenPrices: SpotPrices;
};

export const DEFAULT_UNENCRYPTED_STATE: UnencryptedStateValue = {
  keyringAccounts: {},
  mapInterfaceNameToId: {},
  transactions: {},
  assets: {},
  tokenPrices: {},
};

export type StateConfig<TValue extends Record<string, Serializable>> = {
  encrypted: boolean;
  defaultState: TValue;
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
export class State<TValue extends Record<string, Serializable>>
  implements IStateManager<TValue>
{
  #config: StateConfig<TValue>;

  constructor(config: StateConfig<TValue>) {
    this.#config = config;
  }

  /**
   * Gets the state of the snap.
   *
   * @returns The state of the snap.
   */
  async get(): Promise<TValue> {
    const state = await snap.request({
      method: 'snap_manageState',
      params: {
        operation: 'get',
        encrypted: this.#config.encrypted,
      },
    });

    const stateDeserialized = deserialize(state ?? {}) as TValue;

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
  async update(callback: (state: TValue) => TValue): Promise<TValue> {
    return this.get().then(async (state) => {
      const newState = callback(state);

      await snap.request({
        method: 'snap_manageState',
        params: {
          operation: 'update',
          newState: serialize(newState),
          encrypted: this.#config.encrypted,
        },
      });

      return newState;
    });
  }
}
