/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { Transaction } from '@metamask/keyring-api';
import type { Address, Signature } from '@solana/kit';
import { omit, unset } from 'lodash';

import type {
  AssetEntity,
  SolanaKeyringAccount,
  Subscription,
} from '../../../entities';
import type { EventEmitter } from '../../../infrastructure';
import type { SpotPrices } from '../../clients/price-api/types';
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
  // we need to store the exhaustive list of signatures (including spam)
  // to keep track of the transactions per account. The field transactions above only stores non-spam transactions, which break the refreshAccounts cronjob logic.
  signatures: Record<Address, Signature[]>;
  assetEntities: Record<AccountId, AssetEntity[]>;
  tokenPrices: SpotPrices;
  subscriptions: Record<string, Subscription>;
};

export const DEFAULT_UNENCRYPTED_STATE: UnencryptedStateValue = {
  keyringAccounts: {},
  mapInterfaceNameToId: {},
  transactions: {},
  signatures: {},
  assetEntities: {},
  tokenPrices: {},
  subscriptions: {},
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
export class State<TStateValue extends Record<string, Serializable>>
  implements IStateManager<TStateValue>
{
  #config: StateConfig<TStateValue>;

  constructor(eventEmitter: EventEmitter, config: StateConfig<TStateValue>) {
    this.#config = config;

    eventEmitter.on('onStart', this.#migrateState.bind(this));
    eventEmitter.on('onUpdate', this.#migrateState.bind(this));
    eventEmitter.on('onInstall', this.#migrateState.bind(this));
  }

  async #migrateState() {
    await this.update((state) => {
      return omit(state as any, ['assets']);
    });
  }

  async get(): Promise<TStateValue> {
    const state = await snap.request({
      method: 'snap_getState',
      params: {
        encrypted: this.#config.encrypted,
      },
    });

    const stateDeserialized = deserialize(state ?? {}) as TStateValue;

    // Merge the default state with the underlying snap state
    // to ensure that we always have default values. It lets us avoid a ton of null checks everywhere.
    const stateWithDefaults = safeMerge(
      this.#config.defaultState,
      stateDeserialized,
    );

    return stateWithDefaults;
  }

  async getKey<TResponse extends Serializable>(
    key: string,
  ): Promise<TResponse | undefined> {
    const value = await snap.request({
      method: 'snap_getState',
      params: {
        key,
        encrypted: this.#config.encrypted,
      },
    });

    if (value === null) {
      return undefined;
    }

    return deserialize(value) as TResponse;
  }

  async setKey(key: string, value: Serializable): Promise<void> {
    await snap.request({
      method: 'snap_setState',
      params: {
        key,
        value: serialize(value),
        encrypted: this.#config.encrypted,
      },
    });
  }

  async update(
    updaterFunction: (state: TStateValue) => TStateValue,
  ): Promise<TStateValue> {
    return this.get().then(async (state) => {
      const newState = updaterFunction(state);

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

  async deleteKey(key: string): Promise<void> {
    await this.update((state) => {
      // Using lodash's unset to leverage the json path capabilities
      unset(state, key);
      return state;
    });
  }

  async deleteKeys(keys: string[]): Promise<void> {
    await this.update((state) => {
      keys.forEach((key) => {
        unset(state, key);
      });
      return state;
    });
  }
}
