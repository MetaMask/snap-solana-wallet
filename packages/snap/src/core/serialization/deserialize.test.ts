/* eslint-disable jest/prefer-strict-equal */
/* eslint-disable @typescript-eslint/naming-convention */
import BigNumber from 'bignumber.js';

import { deserialize } from './deserialize';

describe('deserialize', () => {
  it('deserializes primitive values', () => {
    expect(deserialize('test')).toBe('test');
    expect(deserialize(42)).toBe(42);
    expect(deserialize(true)).toBe(true);
    expect(deserialize(null)).toBeNull();
  });

  it('deserializes special serialized types', () => {
    expect(deserialize({ __type: 'undefined' })).toBeUndefined();
    expect(
      deserialize({ __type: 'bigint', value: '9007199254740991' }),
    ).toStrictEqual(BigInt(9007199254740991));
    expect(
      deserialize({ __type: 'BigNumber', value: '123456789.123456789' }),
    ).toStrictEqual(new BigNumber('123456789.123456789'));
  });

  it('deserializes arrays with mixed types', () => {
    expect(
      deserialize([
        1,
        'hello',
        true,
        null,
        { __type: 'undefined' },
        { __type: 'bigint', value: '9007199254740991' },
        { __type: 'BigNumber', value: '123456789.123456789' },
      ]),
    ).toEqual([
      1,
      'hello',
      true,
      null,
      undefined,
      BigInt(9007199254740991),
      new BigNumber('123456789.123456789'),
    ]);
  });

  it('deserializes objects with nested structures', () => {
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

    const result = deserialize(input);

    expect(result).toEqual({
      nested: {
        bigNumber: new BigNumber('123.456'),
        bigint: BigInt('9007199254740991'),
        undefined,
      },
      array: [new BigNumber('789.012'), BigInt('9007199254740992')],
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

  it('deserializes Uint8Array', () => {
    const input = { __type: 'Uint8Array', value: 'AQID' };
    const result = deserialize(input);
    expect(result).toStrictEqual(new Uint8Array([1, 2, 3]));
  });
});
