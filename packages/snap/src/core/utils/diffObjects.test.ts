import { diffObjects } from './diffObjects';

describe('diffObjects', () => {
  it('detects added properties', () => {
    const object1 = { a: 1 };
    const object2 = { a: 1, b: 2 };
    const result = diffObjects(object1, object2);
    expect(result).toStrictEqual({
      added: { b: 2 },
      deleted: {},
      changed: {},
      hasDiff: true,
    });
  });

  it('detects deleted properties', () => {
    const object1 = { a: 1, b: 2 };
    const object2 = { a: 1 };
    const result = diffObjects(object1, object2);
    expect(result).toStrictEqual({
      added: {},
      deleted: { b: 2 },
      changed: {},
      hasDiff: true,
    });
  });

  it('detects nested added properties', () => {
    const object1 = { a: 1, b: { c: 3 } };
    const object2 = { a: 1, b: { c: 3, d: 4 } };
    const result = diffObjects(object1, object2);
    expect(result).toStrictEqual({
      added: { 'b.d': 4 },
      deleted: {},
      changed: {},
      hasDiff: true,
    });
  });

  it('detects nested deleted properties', () => {
    const object1 = { a: 1, b: { c: 3, d: 4 } };
    const object2 = { a: 1, b: { c: 3 } };
    const result = diffObjects(object1, object2);
    expect(result).toStrictEqual({
      added: {},
      deleted: { 'b.d': 4 },
      changed: {},
      hasDiff: true,
    });
  });

  it('detects changed properties', () => {
    const object1 = { a: 1, b: 2 };
    const object2 = { a: 1, b: 3 };
    const result = diffObjects(object1, object2);
    expect(result).toStrictEqual({
      added: {},
      deleted: {},
      changed: { b: 3 },
      hasDiff: true,
    });
  });

  it('detects no differences', () => {
    const object1 = { a: 1, b: 2 };
    const object2 = { a: 1, b: 2 };
    const result = diffObjects(object1, object2);
    expect(result).toStrictEqual({
      added: {},
      deleted: {},
      changed: {},
      hasDiff: false,
    });
  });

  it('handles empty objects', () => {
    const object1 = {};
    const object2 = {};
    const result = diffObjects(object1, object2);
    expect(result).toStrictEqual({
      added: {},
      deleted: {},
      changed: {},
      hasDiff: false,
    });
  });
});
