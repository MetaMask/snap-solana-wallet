import { Stack } from './stack';

describe('Stack', () => {
  let stack: Stack<number>;

  beforeEach(() => {
    stack = new Stack<number>();
  });

  describe('push', () => {
    it('adds items to the stack', () => {
      stack.push(1);
      expect(stack.size()).toBe(1);
    });

    it('throws error when exceeding capacity', () => {
      const limitedStack = new Stack<number>(1);
      limitedStack.push(1);
      expect(() => limitedStack.push(2)).toThrow(
        'Stack has reached max capacity',
      );
    });
  });

  describe('pop', () => {
    it('returns undefined for empty stack', () => {
      expect(stack.pop()).toBeUndefined();
    });

    it('removes and returns destackable items', () => {
      stack.push(1);
      stack.push(2);

      expect(stack.pop()).toBe(2);
      expect(stack.size()).toBe(1);
      expect(stack.pop()).toBe(1);
      expect(stack.size()).toBe(0);
    });

    it('returns but does not remove non-destackable items', () => {
      stack.push(1);
      stack.push(2, false); // non-destackable item

      expect(stack.pop()).toBe(2);
      expect(stack.size()).toBe(2); // size remains the same
      expect(stack.pop()).toBe(2); // same item returned again
      expect(stack.size()).toBe(2); // size still remains the same
    });
  });

  describe('size', () => {
    it('returns correct stack size', () => {
      expect(stack.size()).toBe(0);

      stack.push(1);
      expect(stack.size()).toBe(1);

      stack.push(2);
      expect(stack.size()).toBe(2);

      stack.pop();
      expect(stack.size()).toBe(1);
    });
  });

  describe('peek', () => {
    it('returns the last item without removing it', () => {
      stack.push(1);
      expect(stack.peek()).toBe(1);
    });
  });
});
