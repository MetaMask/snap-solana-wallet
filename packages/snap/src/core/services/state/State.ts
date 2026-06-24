/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { Transaction } from '@metamask/keyring-api';
import type { Address, Signature } from '@solana/kit';
import type { MutexInterface } from 'async-mutex';
import { Mutex } from 'async-mutex';
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
  webSocketConnections: {
    closeWebSocketConnectionsBackgroundEventId: string | null;
  };
};

export const DEFAULT_UNENCRYPTED_STATE: UnencryptedStateValue = {
  keyringAccounts: {},
  mapInterfaceNameToId: {},
  transactions: {},
  signatures: {},
  assetEntities: {},
  tokenPrices: {},
  subscriptions: {},
  webSocketConnections: {
    closeWebSocketConnectionsBackgroundEventId: null,
  },
};

export type StateConfig<TValue extends Record<string, Serializable>> = {
  encrypted: boolean;
  defaultState: TValue;
};

/**
 * Because we use both snap_manageState and snap_setState, we must protect against them being used at the same time.
 * We must also protect against multiple parallel requests to snap_manageState.
 * snap_setState, snap_getState etc does not have this limitation and can be accessed safely as long as
 * an ongoing manageState operation is not occurring.
 */
class StateLock {
  readonly #blobModificationMutex = new Mutex();

  readonly #regularStateUpdateMutex = new Mutex();

  #pendingRegularStateUpdates = 0;

  #releaseRegularStateUpdateMutex: MutexInterface.Releaser | null = null;

  async #acquireRegularStateUpdateMutex() {
    if (!this.#regularStateUpdateMutex.isLocked()) {
      this.#releaseRegularStateUpdateMutex =
        await this.#regularStateUpdateMutex.acquire();
    }
  }

  async wrapRegularStateOperation<T>(
    callback: MutexInterface.Worker<T>,
  ): Promise<T> {
    // If we are currently doing a full blob update, wait it out.
    // Signal that regular state operations are ongoing by acquring the mutex.
    // Other regular state operations can skip this, as they are safe to do in parallel.
    await Promise.all([
      this.#blobModificationMutex.waitForUnlock(),
      this.#acquireRegularStateUpdateMutex(),
    ]);

    try {
      this.#pendingRegularStateUpdates += 1;
      return await callback();
    } finally {
      this.#pendingRegularStateUpdates -= 1;

      if (
        this.#pendingRegularStateUpdates === 0 &&
        this.#releaseRegularStateUpdateMutex
      ) {
        this.#releaseRegularStateUpdateMutex();
      }
    }
  }

  async wrapManageStateOperation<T>(
    callback: MutexInterface.Worker<T>,
  ): Promise<T> {
    await this.#regularStateUpdateMutex.waitForUnlock();

    return await this.#blobModificationMutex.runExclusive(callback);
  }
}

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
export class State<
  TStateValue extends Record<string, Serializable>,
> implements IStateManager<TStateValue> {
  #lock = new StateLock();

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

  async #unsafeGet(): Promise<TStateValue> {
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

  async get(): Promise<TStateValue> {
    return this.#lock.wrapRegularStateOperation(async () => this.#unsafeGet());
  }

  async getKey<TResponse extends Serializable>(
    key: string,
  ): Promise<TResponse | undefined> {
    return this.#lock.wrapRegularStateOperation(async () => {
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
    });
  }

  async setKey(key: string, value: Serializable): Promise<void> {
    await this.#lock.wrapRegularStateOperation(async () => {
      await snap.request({
        method: 'snap_setState',
        params: {
          key,
          value: serialize(value),
          encrypted: this.#config.encrypted,
        },
      });
    });
  }

  async setKeyWith<TValue extends Serializable>(
    key: string,
    updater: (currentValue: TValue | undefined) => TValue,
  ): Promise<void> {
    await this.#lock.wrapManageStateOperation(async () => {
      const rawValue = await snap.request({
        method: 'snap_getState',
        params: {
          key,
          encrypted: this.#config.encrypted,
        },
      });

      const oldValue =
        rawValue === null ? undefined : (deserialize(rawValue) as TValue);
      const newValue = updater(oldValue);

      await snap.request({
        method: 'snap_setState',
        params: {
          key,
          value: serialize(newValue),
          encrypted: this.#config.encrypted,
        },
      });
    });
  }

  async update(
    updaterFunction: (state: TStateValue) => TStateValue,
  ): Promise<TStateValue> {
    // Because this function modifies the entire state blob,
    // we must protect against parallel requests.
    return await this.#lock.wrapManageStateOperation(async () => {
      const currentState = await this.#unsafeGet();

      const newState = updaterFunction(currentState);

      // Generally we should try to use snap_getState and snap_setState over this
      // as snap_manageState is slower and error-prone due to requiring manual mutex management.
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
    return this.setKey(key, undefined);
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
