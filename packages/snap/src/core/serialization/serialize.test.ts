/* eslint-disable @typescript-eslint/naming-convention */
import BigNumber from 'bignumber.js';

import { serialize } from './serialize';

describe('serialize', () => {
  it('should leave regular values unchanged', () => {
    const input = {
      string: 'test',
      number: 42,
      boolean: true,
      null: null,
      array: [1, 2, 3],
      object: { a: 1, b: 2 },
    };

    const result = serialize(input);

    expect(result).toStrictEqual(input);
  });

  it('should serialize undefined values', () => {
    const input = {
      value: undefined,
    };

    const result = serialize(input);

    expect(result).toStrictEqual({
      value: { __type: 'undefined' },
    });
  });

  it('should serialize BigNumber values', () => {
    const input = {
      value: new BigNumber('123456789.123456789'),
    };

    const result = serialize(input);

    expect(result).toStrictEqual({
      value: { __type: 'BigNumber', value: '123456789.123456789' },
    });
  });

  it('should serialize bigint values', () => {
    const input = {
      value: BigInt('9007199254740991'),
    };

    const result = serialize(input);

    expect(result).toStrictEqual({
      value: { __type: 'bigint', value: '9007199254740991' },
    });
  });

  it('should handle nested objects with special values', () => {
    const input = {
      nested: {
        bigNumber: new BigNumber('123.456'),
        bigint: BigInt('9007199254740991'),
        undefined,
      },
      array: [new BigNumber('789.012'), BigInt('9007199254740992')],
    };

    const result = serialize(input);

    expect(result).toStrictEqual({
      nested: {
        bigNumber: { __type: 'BigNumber', value: '123.456' },
        bigint: { __type: 'bigint', value: '9007199254740991' },
        undefined: { __type: 'undefined' },
      },
      array: [
        { __type: 'BigNumber', value: '789.012' },
        { __type: 'bigint', value: '9007199254740992' },
      ],
    });
  });

  it('should handle arrays with special values', () => {
    const input = {
      array: [undefined, new BigNumber('123'), BigInt('456')],
    };

    const result = serialize(input);

    expect(result).toStrictEqual({
      array: [
        { __type: 'undefined' },
        { __type: 'BigNumber', value: '123' },
        { __type: 'bigint', value: '456' },
      ],
    });
  });

  it('should handle empty objects and arrays', () => {
    const input = {
      emptyObject: {},
      emptyArray: [],
    };

    const result = serialize(input);

    expect(result).toStrictEqual(input);
  });

  it('should handle deeply nested structures', () => {
    const input = {
      level1: {
        level2: {
          level3: {
            bigint: BigInt('123'),
            undefined,
          },
        },
      },
    };

    const result = serialize(input);

    expect(result).toStrictEqual({
      level1: {
        level2: {
          level3: {
            bigint: { __type: 'bigint', value: '123' },
            undefined: { __type: 'undefined' },
          },
        },
      },
    });
  });
});
