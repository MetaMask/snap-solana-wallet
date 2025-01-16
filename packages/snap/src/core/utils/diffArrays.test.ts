import { diffArrays } from './diffArrays';

describe('diffArrays', () => {
  it('returns added and deleted elements when there are differences', () => {
    const array1 = [1, 2, 3];
    const array2 = [2, 3, 4];
    const result = diffArrays(array1, array2);

    expect(result).toStrictEqual({
      added: [4],
      deleted: [1],
      hasDiff: true,
    });
  });

  it('returns empty arrays when there are no differences', () => {
    const array1 = [1, 2, 3];
    const array2 = [1, 2, 3];
    const result = diffArrays(array1, array2);

    expect(result).toStrictEqual({
      added: [],
      deleted: [],
      hasDiff: false,
    });
  });

  it('returns all elements as added when the first array is empty', () => {
    const array1: number[] = [];
    const array2 = [1, 2, 3];
    const result = diffArrays(array1, array2);

    expect(result).toStrictEqual({
      added: [1, 2, 3],
      deleted: [],
      hasDiff: true,
    });
  });

  it('returns all elements as deleted when the second array is empty', () => {
    const array1 = [1, 2, 3];
    const array2: number[] = [];
    const result = diffArrays(array1, array2);

    expect(result).toStrictEqual({
      added: [],
      deleted: [1, 2, 3],
      hasDiff: true,
    });
  });

  it('handles arrays with different types', () => {
    const array1 = ['a', 'b', 'c'];
    const array2 = ['b', 'c', 'd'];
    const result = diffArrays(array1, array2);

    expect(result).toStrictEqual({
      added: ['d'],
      deleted: ['a'],
      hasDiff: true,
    });
  });
});
