/* eslint-disable jest/prefer-strict-equal */
/* eslint-disable @typescript-eslint/naming-convention */
import BigNumber from 'bignumber.js';

import { serialize } from './serialize';

describe('serialize', () => {
  it('serializes primitive values', () => {
    expect(serialize('test')).toBe('test');
    expect(serialize(42)).toBe(42);
    expect(serialize(true)).toBe(true);
    expect(serialize(null)).toBeNull();
    expect(serialize(undefined)).toStrictEqual({ __type: 'undefined' });
  });

  it('serializes special types', () => {
    expect(serialize(BigInt(9007199254740991))).toStrictEqual({
      __type: 'bigint',
      value: '9007199254740991',
    });
    expect(serialize(new BigNumber('123456789.123456789'))).toStrictEqual({
      __type: 'BigNumber',
      value: '123456789.123456789',
    });
  });

  it('serializes arrays with mixed types', () => {
    const input = [undefined, new BigNumber('123'), BigInt('456')];
    const result = serialize(input);
    expect(result).toStrictEqual([
      { __type: 'undefined' },
      { __type: 'BigNumber', value: '123' },
      { __type: 'bigint', value: '456' },
    ]);
  });

  it('serializes objects with nested structures', () => {
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

  it('serializes empty objects and arrays', () => {
    const input = {
      emptyObject: {},
      emptyArray: [],
    };

    const result = serialize(input);

    expect(result).toStrictEqual(input);
  });

  it('serializes deeply nested structures', () => {
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

  it('serializes Uint8Array', () => {
    const input = new Uint8Array([1, 2, 3]);
    const result = serialize(input);
    expect(result).toStrictEqual({
      __type: 'Uint8Array',
      value: 'AQID',
    });
  });
});
