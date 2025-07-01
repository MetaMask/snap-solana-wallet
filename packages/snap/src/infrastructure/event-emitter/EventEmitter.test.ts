import { mockLogger } from '../../core/services/mocks/logger';
import { EventEmitter } from './EventEmitter';

describe('EventEmitter', () => {
  let eventEmitter: EventEmitter;

  beforeEach(() => {
    eventEmitter = new EventEmitter(mockLogger);
  });

  describe('on', () => {
    it('adds a listener for an event', () => {
      const listener = jest.fn();

      eventEmitter.on('someEvent', listener);

      expect(eventEmitter.listenerCount('someEvent')).toBe(1);
    });

    it('adds multiple listeners for an event', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      eventEmitter.on('someEvent', listener1);
      eventEmitter.on('someEvent', listener2);

      expect(eventEmitter.listenerCount('someEvent')).toBe(2);
    });
  });

  describe('off', () => {
    it('removes a listener for an event', () => {
      const listener = jest.fn();
      eventEmitter.on('someEvent', listener);

      eventEmitter.off('someEvent', listener);

      expect(eventEmitter.listenerCount('someEvent')).toBe(0);
    });

    it('removes multiple listeners for an event', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      eventEmitter.on('someEvent', listener1);
      eventEmitter.on('someEvent', listener2);

      eventEmitter.off('someEvent', listener1);

      expect(eventEmitter.listenerCount('someEvent')).toBe(1);
    });
  });

  describe('emit', () => {
    it('calls all listeners for an event', async () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      const listener3 = jest.fn();
      eventEmitter.on('someEvent', listener1);
      eventEmitter.on('someEvent', listener2);
      eventEmitter.on('someEvent', listener3);

      await eventEmitter.emitSync('someEvent');

      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
      expect(listener3).toHaveBeenCalled();
    });

    it('does not call listeners for a different event', async () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      eventEmitter.on('someEvent', listener1);
      eventEmitter.on('someOtherEvent', listener2);

      await eventEmitter.emitSync('someEvent');

      expect(listener1).toHaveBeenCalled();
      expect(listener2).not.toHaveBeenCalled();
    });
  });

  describe('removeAllListeners', () => {
    it('removes all listeners for an event', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      eventEmitter.on('someEvent', listener1);
      eventEmitter.on('someEvent', listener2);

      eventEmitter.removeAllListeners('someEvent');

      expect(eventEmitter.listenerCount('someEvent')).toBe(0);
    });

    it('removes all listeners for all events', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      eventEmitter.on('someEvent', listener1);
      eventEmitter.on('someOtherEvent', listener2);

      eventEmitter.removeAllListeners();

      expect(eventEmitter.listenerCount('someEvent')).toBe(0);
      expect(eventEmitter.listenerCount('someOtherEvent')).toBe(0);
    });
  });

  describe('eventNames', () => {
    it('returns the names of all events', () => {
      eventEmitter.on('someEvent', jest.fn());
      eventEmitter.on('someOtherEvent', jest.fn());

      expect(eventEmitter.eventNames()).toStrictEqual([
        'someEvent',
        'someOtherEvent',
      ]);
    });
  });
});
