import { assert, is } from '@metamask/superstruct';
import { getBase64Codec, getUtf8Codec, pipe } from '@solana/kit';

import {
  CardMessageStruct,
  parseCardMessage,
  RewardsMessageStruct,
} from './validation';

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
      expect(() => assert(message, RewardsMessageStruct)).toThrow(
        'Invalid timestamp',
      );
      expect(is(message, RewardsMessageStruct)).toBe(false);
    });

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

  describe('parseCardMessage', () => {
    const validAddress = '5F9jaU8pWmLJxCk3dHvC1e7d1sWQ9H2kgvA5g4TtK9hF';
    const toBase64 = (utf8: string): string =>
      pipe(utf8, getUtf8Codec().encode, getBase64Codec().decode);

    const buildMessage = (overrides: Record<string, string> = {}): string => {
      const fields: Record<string, string> = {
        domain: 'example.com',
        address: validAddress,
        statement: 'Please sign this message.',
        uri: 'https://example.com',
        version: '1',
        chainId: '1',
        nonce: 'abc123',
        issuedAt: '2024-01-01T00:00:00.000Z',
        ...overrides,
      };
      return [
        `${fields.domain} wants you to sign in with your Solana account:`,
        fields.address,
        fields.statement,
        `URI: ${fields.uri}`,
        `Version: ${fields.version}`,
        `Chain ID: ${fields.chainId}`,
        `Nonce: ${fields.nonce}`,
        `Issued At: ${fields.issuedAt}`,
        ...(fields.expirationTime
          ? [`Expiration Time: ${fields.expirationTime}`]
          : []),
      ].join('\n');
    };

    it('parses a valid message without expiration time', () => {
      const result = parseCardMessage(toBase64(buildMessage()));
      expect(result).toStrictEqual({
        domain: 'example.com',
        address: validAddress,
        statement: 'Please sign this message.',
        uri: 'https://example.com',
        version: '1',
        chainId: '1',
        nonce: 'abc123',
        issuedAt: '2024-01-01T00:00:00.000Z',
      });
    });

    it('parses a valid message with expiration time', () => {
      const result = parseCardMessage(
        toBase64(buildMessage({ expirationTime: '2024-01-02T00:00:00.000Z' })),
      );
      expect(result).toStrictEqual({
        domain: 'example.com',
        address: validAddress,
        statement: 'Please sign this message.',
        uri: 'https://example.com',
        version: '1',
        chainId: '1',
        nonce: 'abc123',
        issuedAt: '2024-01-01T00:00:00.000Z',
        expirationTime: '2024-01-02T00:00:00.000Z',
      });
    });

    it('parses a message with a multi-line statement', () => {
      const result = parseCardMessage(
        toBase64(buildMessage({ statement: 'Line one.\nLine two.' })),
      );
      expect(result.statement).toBe('Line one.\nLine two.');
    });

    it('parses a message with an alphanumeric nonce', () => {
      const result = parseCardMessage(
        toBase64(buildMessage({ nonce: 'Nonce1ABC2xyz3' })),
      );
      expect(result.nonce).toBe('Nonce1ABC2xyz3');
    });

    it('throws for invalid message format', () => {
      expect(() =>
        parseCardMessage(toBase64('not a valid siws message')),
      ).toThrow('Invalid card message format');
    });

    it('throws for an address with invalid Base58 characters', () => {
      // Ethereum addresses use chars outside Base58 (0, x), so the regex fails
      expect(() =>
        parseCardMessage(
          toBase64(
            buildMessage({
              address: '0x1234567890abcdef1234567890abcdef12345678',
            }),
          ),
        ),
      ).toThrow('Invalid card message format');
    });

    it('throws for invalid URI', () => {
      expect(() =>
        parseCardMessage(toBase64(buildMessage({ uri: 'not-a-uri' }))),
      ).toThrow('Invalid URI in card message');
    });

    it('throws for invalid Issued At date', () => {
      expect(() =>
        parseCardMessage(toBase64(buildMessage({ issuedAt: 'not-a-date' }))),
      ).toThrow('Invalid Issued At date in card message');
    });

    it('throws for invalid Expiration Time date', () => {
      expect(() =>
        parseCardMessage(
          toBase64(buildMessage({ expirationTime: 'not-a-date' })),
        ),
      ).toThrow('Invalid Expiration Time date in card message');
    });
  });

  describe('CardMessageStruct', () => {
    const validAddress = '5F9jaU8pWmLJxCk3dHvC1e7d1sWQ9H2kgvA5g4TtK9hF';
    const toBase64 = (utf8: string): string =>
      pipe(utf8, getUtf8Codec().encode, getBase64Codec().decode);

    const validBase64Message = toBase64(
      [
        'example.com wants you to sign in with your Solana account:',
        validAddress,
        'Please sign this message.',
        'URI: https://example.com',
        'Version: 1',
        'Chain ID: 1',
        'Nonce: abc123',
        'Issued At: 2024-01-01T00:00:00.000Z',
      ].join('\n'),
    );

    it('validates a valid card message', () => {
      expect(() => assert(validBase64Message, CardMessageStruct)).not.toThrow();
      expect(is(validBase64Message, CardMessageStruct)).toBe(true);
    });

    it('validates a valid card message with expiration time', () => {
      const message = toBase64(
        [
          'example.com wants you to sign in with your Solana account:',
          validAddress,
          'Please sign this message.',
          'URI: https://example.com',
          'Version: 1',
          'Chain ID: 1',
          'Nonce: abc123',
          'Issued At: 2024-01-01T00:00:00.000Z',
          'Expiration Time: 2024-01-02T00:00:00.000Z',
        ].join('\n'),
      );
      expect(() => assert(message, CardMessageStruct)).not.toThrow();
      expect(is(message, CardMessageStruct)).toBe(true);
    });

    it('rejects a message with invalid format', () => {
      const message = toBase64('not a siws message');
      expect(() => assert(message, CardMessageStruct)).toThrow(
        'Invalid card message format',
      );
      expect(is(message, CardMessageStruct)).toBe(false);
    });

    it.each([123, null, undefined, {}, [], true])(
      'rejects non-string values: "%s"',
      (value) => {
        expect(is(value, CardMessageStruct)).toBe(false);
      },
    );
  });
});
