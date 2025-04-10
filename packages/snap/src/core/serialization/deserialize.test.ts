/* eslint-disable jest/prefer-strict-equal */
/* eslint-disable @typescript-eslint/naming-convention */
import BigNumber from 'bignumber.js';

import { deserialize } from './deserialize';

describe('deserialize', () => {
  it('returns regular values unchanged', () => {
    const input = {
      string: 'test',
      number: 42,
      boolean: true,
      null: null,
      array: [1, 2, 3],
      object: { a: 1, b: 2 },
    };

    const result = deserialize(input);

    expect(result).toStrictEqual(input);
  });

  it('deserializes undefined values', () => {
    const input = {
      value: { __type: 'undefined' },
    };

    const result = deserialize(input);

    expect(result).toEqual({ value: undefined });
  });

  it('deserializes BigNumber values', () => {
    const input = {
      value: { __type: 'BigNumber', value: '123456789.123456789' },
    };

    const result = deserialize(input);

    expect(result).toStrictEqual({
      value: new BigNumber('123456789.123456789'),
    });
  });

  it('deserializes bigint values', () => {
    const input = {
      value: { __type: 'bigint', value: '9007199254740991' },
    };

    const result = deserialize(input);

    expect(result).toStrictEqual({
      value: BigInt('9007199254740991'),
    });
  });

  it('handles non-undefined falsy values correctly', () => {
    const input = {
      zero: 0,
      emptyString: '',
      falseValue: false,
      nullValue: null,
    };

    const result = deserialize(input);

    expect(result).toStrictEqual({
      zero: 0,
      emptyString: '',
      falseValue: false,
      nullValue: null,
    });
  });

  it('handles nested objects with special values', () => {
    const input = {
      nested: {
        bigNumber: { __type: 'BigNumber', value: '123.456' },
        bigint: { __type: 'bigint', value: '9007199254740991' },
        undefined: { __type: 'undefined' },
      },
      array: [
        { __type: 'BigNumber', value: '789.012' },
        { __type: 'bigint', value: '9007199254740992' },
      ],
    };

    const result = deserialize<typeof input>(input);

    expect(result).toEqual({
      nested: {
        bigNumber: new BigNumber('123.456'),
        bigint: BigInt('9007199254740991'),
        undefined,
      },
      array: [new BigNumber('789.012'), BigInt('9007199254740992')],
    });
  });
});
