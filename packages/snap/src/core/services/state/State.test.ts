/* eslint-disable jest/prefer-strict-equal */
/* eslint-disable @typescript-eslint/naming-convention */
import BigNumber from 'bignumber.js';

import { EventEmitter } from '../../../infrastructure/event-emitter/EventEmitter';
import { mockLogger } from '../mocks/logger';
import { State } from './State';

const snap = {
  request: jest.fn(),
};

(globalThis as any).snap = snap;

type User = {
  name: string;
  age: BigNumber | bigint | number | undefined | null;
};

type MockStateValue = {
  users: User[];
};

const DEFAULT_STATE: MockStateValue = {
  users: [
    {
      name: 'John',
      age: 30,
    },
    {
      name: 'Jane',
      age: 25,
    },
  ],
};

describe('State', () => {
  let state: State<MockStateValue>;
  let eventEmitter: EventEmitter;

  beforeEach(() => {
    eventEmitter = new EventEmitter(mockLogger);

    state = new State<MockStateValue>(eventEmitter, {
      encrypted: false,
      defaultState: DEFAULT_STATE,
    });

    jest.clearAllMocks();
  });

  afterEach(() => {
    snap.request.mockReset();
  });

  describe('constructor', () => {
    it('runs migrateState on onStart/onUpdate/onInstall events', async () => {
      const spy = jest.spyOn(state, 'update');

      await eventEmitter.emitSync('onStart');

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('get', () => {
    it('gets the state', async () => {
      const mockUnderlyingState = DEFAULT_STATE;
      snap.request.mockResolvedValue(mockUnderlyingState);

      const stateValue = await state.get();

      expect(snap.request).toHaveBeenCalledWith({
        method: 'snap_getState',
        params: { encrypted: false },
      });
      expect(stateValue).toStrictEqual(mockUnderlyingState);
    });

    it('gets the default state if the snap state is empty', async () => {
      const mockUnderlyingState = {};
      snap.request.mockResolvedValue(mockUnderlyingState);

      const stateValue = await state.get();

      expect(stateValue).toStrictEqual(DEFAULT_STATE);
    });

    describe('when getting serialized non-JSON values', () => {
      it('deserializes undefined values', async () => {
        const mockUnderlyingState = {
          users: [
            {
              name: 'John',
              age: {
                __type: 'undefined',
              },
            },
          ],
        };
        snap.request.mockResolvedValue(mockUnderlyingState);

        const stateValue = await state.get();

        expect(stateValue).toEqual({
          users: [
            {
              name: 'John',
              age: undefined,
            },
          ],
        });
      });

      it('deserializes BigNumber values', async () => {
        const mockUnderlyingState = {
          users: [
            {
              name: 'John',
              age: {
                __type: 'BigNumber',
                value: '30',
              },
            },
          ],
        };
        snap.request.mockResolvedValue(mockUnderlyingState);

        const stateValue = await state.get();

        expect(stateValue).toStrictEqual({
          users: [
            {
              name: 'John',
              age: new BigNumber(30),
            },
          ],
        });
      });

      it('deserializes bigint values', async () => {
        const mockUnderlyingState = {
          users: [
            {
              name: 'John',
              age: {
                __type: 'bigint',
                value: '30',
              },
            },
          ],
        };
        snap.request.mockResolvedValue(mockUnderlyingState);

        const stateValue = await state.get();

        expect(stateValue).toStrictEqual({
          users: [
            {
              name: 'John',
              age: BigInt(30),
            },
          ],
        });
      });
    });
  });

  describe('getKey', () => {
    it('calls the snap_getState method with the correct parameters', async () => {
      const mockUnderlyingState = DEFAULT_STATE;
      snap.request.mockResolvedValue(mockUnderlyingState);

      await state.getKey('users.1.name');

      expect(snap.request).toHaveBeenCalledWith({
        method: 'snap_getState',
        params: { key: 'users.1.name', encrypted: false },
      });
    });

    it('returns undefined if the key does not exist', async () => {
      snap.request.mockResolvedValue(null);

      const value = await state.getKey('users.1.name');

      expect(value).toBeUndefined();
    });
  });

  describe('setKey', () => {
    it('sets the value of a key', async () => {
      await state.setKey('users.1.name', 'Bob');

      expect(snap.request).toHaveBeenCalledWith({
        method: 'snap_setState',
        params: {
          key: 'users.1.name',
          value: 'Bob',
          encrypted: false,
        },
      });
    });
  });

  describe('setKeyWith', () => {
    it('reads the current value, applies the updater, and writes the result', async () => {
      snap.request.mockResolvedValueOnce({ alice: 10 }); // getState (read)

      await state.setKeyWith<Record<string, number>>('scores', (current) => ({
        ...current,
        bob: 20,
      }));

      expect(snap.request).toHaveBeenNthCalledWith(1, {
        method: 'snap_getState',
        params: { key: 'scores', encrypted: false },
      });
      expect(snap.request).toHaveBeenNthCalledWith(2, {
        method: 'snap_setState',
        params: {
          key: 'scores',
          value: { alice: 10, bob: 20 },
          encrypted: false,
        },
      });
    });

    it('passes undefined to the updater when the key does not exist', async () => {
      snap.request.mockResolvedValueOnce(null); // getState returns null → key absent

      const updater = jest.fn().mockReturnValue({ bob: 20 });

      await state.setKeyWith('scores', updater);

      expect(updater).toHaveBeenCalledWith(undefined);
    });
  });

  describe('update', () => {
    it('updates the state', async () => {
      await state.update((currentState) => ({
        users: [
          ...currentState.users,
          {
            name: 'Bob',
            age: 50,
          },
        ],
      }));

      expect(snap.request).toHaveBeenCalledWith({
        method: 'snap_getState',
        params: { encrypted: false },
      });

      expect(snap.request).toHaveBeenCalledWith({
        method: 'snap_manageState',
        params: {
          operation: 'update',
          encrypted: false,
          newState: {
            users: [
              ...DEFAULT_STATE.users,
              {
                name: 'Bob',
                age: 50,
              },
            ],
          },
        },
      });
    });

    describe('when updating serialized non-JSON values', () => {
      it('serializes undefined values', async () => {
        await state.update((currentState) => ({
          users: [
            ...currentState.users,
            {
              name: 'Bob',
              age: undefined,
            },
          ],
        }));

        expect(snap.request).toHaveBeenNthCalledWith(2, {
          method: 'snap_manageState',
          params: {
            operation: 'update',
            encrypted: false,
            newState: {
              users: [
                ...DEFAULT_STATE.users,
                {
                  name: 'Bob',
                  age: {
                    __type: 'undefined',
                  },
                },
              ],
            },
          },
        });
      });

      it('serializes BigNumber values', async () => {
        await state.update((currentState) => ({
          users: [
            ...currentState.users,
            {
              name: 'Bob',
              age: new BigNumber(50),
            },
          ],
        }));

        expect(snap.request).toHaveBeenNthCalledWith(2, {
          method: 'snap_manageState',
          params: {
            operation: 'update',
            encrypted: false,
            newState: {
              users: [
                ...DEFAULT_STATE.users,
                {
                  name: 'Bob',
                  age: {
                    __type: 'BigNumber',
                    value: '50',
                  },
                },
              ],
            },
          },
        });
      });

      it('serializes bigint values', async () => {
        await state.update((currentState) => ({
          users: [
            ...currentState.users,
            {
              name: 'Bob',
              age: BigInt(50),
            },
          ],
        }));

        expect(snap.request).toHaveBeenNthCalledWith(2, {
          method: 'snap_manageState',
          params: {
            operation: 'update',
            encrypted: false,
            newState: {
              users: [
                ...DEFAULT_STATE.users,
                {
                  name: 'Bob',
                  age: {
                    __type: 'bigint',
                    value: '50',
                  },
                },
              ],
            },
          },
        });
      });

      it('serializes null values', async () => {
        await state.update((currentState) => ({
          users: [...currentState.users, { name: 'Bob', age: null }],
        }));

        expect(snap.request).toHaveBeenNthCalledWith(2, {
          method: 'snap_manageState',
          params: {
            operation: 'update',
            encrypted: false,
            newState: {
              users: [...DEFAULT_STATE.users, { name: 'Bob', age: null }],
            },
          },
        });
      });
    });
  });

  describe('deleteKey', () => {
    it('deletes a key', async () => {
      await state.deleteKey('users');

      expect(snap.request).toHaveBeenCalledWith({
        method: 'snap_setState',
        params: {
          key: 'users',
          value: {
            __type: 'undefined',
          },
          encrypted: false,
        },
      });
    });

    it('deletes a nested key', async () => {
      await state.deleteKey('users[0].age');

      expect(snap.request).toHaveBeenCalledWith({
        method: 'snap_setState',
        params: {
          key: 'users[0].age',
          value: {
            __type: 'undefined',
          },
          encrypted: false,
        },
      });
    });
  });

  describe('deleteKeys', () => {
    it('deletes multiple keys', async () => {
      await state.deleteKeys(['users.0.age', 'users.1.name']);

      expect(snap.request).toHaveBeenCalledWith({
        method: 'snap_manageState',
        params: {
          operation: 'update',
          newState: { users: [{ name: 'John' }, { age: 25 }] },
          encrypted: false,
        },
      });
    });
  });
});
