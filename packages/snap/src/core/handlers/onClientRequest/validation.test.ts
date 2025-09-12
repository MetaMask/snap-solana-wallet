import { assert, is } from '@metamask/superstruct';
import { getBase64Codec, getUtf8Codec, pipe } from '@solana/kit';

import { RewardsMessageStruct } from './validation';

describe('validation', () => {
  describe('RewardsMessageStruct', () => {
    const validSolanaAddress = '5F9jaU8pWmLJxCk3dHvC1e7d1sWQ9H2kgvA5g4TtK9hF';
    const currentTimestamp = Math.floor(Date.now() / 1000);

    const toBase64 = (utf8: string): string =>
      pipe(
        utf8,
        getUtf8Codec().encode, // From uint8Array to utf8
        getBase64Codec().decode, // From base64 to uint8Array
      );

    it.each([
      `rewards,${validSolanaAddress},${currentTimestamp}`,
      `rewards,${validSolanaAddress},${currentTimestamp - 30}`, // 30 seconds ago
      `rewards,${validSolanaAddress},${currentTimestamp + 30}`, // 30 seconds in future
      `rewards,BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP,${currentTimestamp}`, // Different valid address
    ])('validates valid messages: "%s"', (utf8Message) => {
      const message = toBase64(utf8Message);
      expect(() => assert(message, RewardsMessageStruct)).not.toThrow();
      expect(is(message, RewardsMessageStruct)).toBe(true);
    });

    it.each([
      'invalid-base64!', // Invalid characters
      'abc@def', // Invalid characters
      'hello world', // Spaces not allowed in base64
      '', // Empty string
      'abc', // Invalid padding
    ])(
      'rejects messages with invalid base64 encoding: "%s"',
      (base64Message) => {
        expect(() => assert(base64Message, RewardsMessageStruct)).toThrow(
          'Expected a string matching',
        );
        expect(is(base64Message, RewardsMessageStruct)).toBe(false);
      },
    );

    it.each([
      `reward,${validSolanaAddress},${currentTimestamp}`, // Missing 's'
      `Rewards,${validSolanaAddress},${currentTimestamp}`, // Wrong case
      `bonus,${validSolanaAddress},${currentTimestamp}`, // Wrong prefix
      `${validSolanaAddress},${currentTimestamp}`, // No prefix
    ])(
      'rejects messages that do not start with "rewards,": "%s"',
      (utf8Message) => {
        const message = toBase64(utf8Message);
        expect(() => assert(message, RewardsMessageStruct)).toThrow(
          'Message must start with "rewards,"',
        );
        expect(is(message, RewardsMessageStruct)).toBe(false);
      },
    );

    it.each([
      'rewards,', // Only prefix
      `rewards,${validSolanaAddress}`, // Missing timestamp
      `rewards,${validSolanaAddress},${currentTimestamp},extra`, // Too many parts
      'rewards,,,', // Empty parts
    ])(
      'rejects messages with incorrect number of parts: "%s"',
      (utf8Message) => {
        const message = toBase64(utf8Message);
        expect(() => assert(message, RewardsMessageStruct)).toThrow(
          'Message must have exactly 3 parts',
        );
        expect(is(message, RewardsMessageStruct)).toBe(false);
      },
    );

    it.each([
      `rewards,invalid-address,${currentTimestamp}`,
      `rewards,,${currentTimestamp}`, // Empty address
      `rewards,0x1234567890abcdef1234567890abcdef12345678,${currentTimestamp}`, // Ethereum address
      `rewards,too-short,${currentTimestamp}`, // Too short
      `rewards,this-address-is-way-too-long-to-be-a-valid-solana-address,${currentTimestamp}`, // Too long
    ])(
      'rejects messages with invalid Solana addresses: "%s"',
      (utf8Message) => {
        const message = toBase64(utf8Message);
        expect(() => assert(message, RewardsMessageStruct)).toThrow(
          'Invalid Solana address',
        );
        expect(is(message, RewardsMessageStruct)).toBe(false);
      },
    );

    it.each([
      `rewards,${validSolanaAddress},invalid`, // Non-numeric
      `rewards,${validSolanaAddress},`, // Empty timestamp
      `rewards,${validSolanaAddress},-1`, // Negative timestamp
      `rewards,${validSolanaAddress},0`, // Zero timestamp
      `rewards,${validSolanaAddress},123.456`, // Decimal timestamp
    ])('rejects messages with invalid timestamps: "%s"', (utf8Message) => {
      const message = toBase64(utf8Message);
      // eslint-disable-next-line jest/require-to-throw-message
      expect(() => assert(message, RewardsMessageStruct)).toThrow();
      expect(is(message, RewardsMessageStruct)).toBe(false);
    });

    it.each([
      `rewards,${validSolanaAddress},${currentTimestamp - 120}`, // 2 minutes ago
      `rewards,${validSolanaAddress},${currentTimestamp + 120}`, // 2 minutes in future
      `rewards,${validSolanaAddress},${currentTimestamp - 61}`, // Just over 1 minute ago
      `rewards,${validSolanaAddress},${currentTimestamp + 61}`, // Just over 1 minute in future
    ])(
      'rejects messages with timestamps outside 1-minute window: "%s"',
      (utf8Message) => {
        const message = toBase64(utf8Message);
        expect(() => assert(message, RewardsMessageStruct)).toThrow(
          'Timestamp must be within 1 minute',
        );
        expect(is(message, RewardsMessageStruct)).toBe(false);
      },
    );

    it.each([
      `rewards,${validSolanaAddress},${currentTimestamp - 60}`, // Exactly 1 minute ago
      `rewards,${validSolanaAddress},${currentTimestamp + 60}`, // Exactly 1 minute in future
      `rewards,${validSolanaAddress},${currentTimestamp - 59}`, // Just under 1 minute ago
      `rewards,${validSolanaAddress},${currentTimestamp + 59}`, // Just under 1 minute in future
    ])(
      'accepts messages with timestamps at boundary of 1-minute window: "%s"',
      (utf8Message) => {
        const message = toBase64(utf8Message);
        expect(() => assert(message, RewardsMessageStruct)).not.toThrow();
        expect(is(message, RewardsMessageStruct)).toBe(true);
      },
    );

    it.each([
      123, // Number
      null, // Null
      undefined, // Undefined
      {}, // Object
      [], // Array
      true, // Boolean
    ])('rejects non-string values: "%s"', (value) => {
      expect(() => assert(value, RewardsMessageStruct)).toThrow(
        'Expected a string',
      );
      expect(is(value, RewardsMessageStruct)).toBe(false);
    });
  });
});
