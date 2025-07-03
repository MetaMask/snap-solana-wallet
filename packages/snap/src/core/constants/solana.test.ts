import { assert, is } from '@metamask/superstruct';

import {
  KnownCaip19Id,
  TokenCaip19IdFromStringStruct,
  TokenCaip19IdStruct,
} from './solana';

describe('TokenCaip19IdStruct', () => {
  describe('validates correct CAIP-19 token IDs', () => {
    it('validates known CAIP-19 IDs from the enum', () => {
      const validIds = [
        KnownCaip19Id.UsdcMainnet,
        KnownCaip19Id.UsdcDevnet,
        KnownCaip19Id.UsdcLocalnet,
        KnownCaip19Id.EurcMainnet,
        KnownCaip19Id.EurcDevnet,
        KnownCaip19Id.EurcLocalnet,
        KnownCaip19Id.Ai16zLocalnet,
      ];

      validIds.forEach((id) => {
        console.log(`Testing valid ID: ${id}`);
        expect(() => assert(id, TokenCaip19IdStruct)).not.toThrow();
        expect(is(id, TokenCaip19IdStruct)).toBe(true);
      });
    });

    it('validates test data from TokenApiClient tests', () => {
      const testIds = [
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:1GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr',
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr',
      ];

      testIds.forEach((id) => {
        console.log(`Testing test ID: ${id}`);
        expect(() => assert(id, TokenCaip19IdStruct)).not.toThrow();
        expect(is(id, TokenCaip19IdStruct)).toBe(true);
      });
    });

    it('validates USDC address format', () => {
      const usdcId =
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
      console.log(`Testing USDC ID: ${usdcId}`);
      expect(() => assert(usdcId, TokenCaip19IdStruct)).not.toThrow();
      expect(is(usdcId, TokenCaip19IdStruct)).toBe(true);
    });
  });

  describe('rejects invalid CAIP-19 token IDs', () => {
    it('rejects malformed IDs', () => {
      const invalidIds = [
        'bad-asset-id',
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:', // missing token address
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token', // missing colon
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/extra', // extra parts
        'eip155:1/token:0x123', // wrong chain
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501', // wrong asset type
      ];

      invalidIds.forEach((id) => {
        console.log(`Testing invalid ID: ${id}`);
        expect(() => assert(id, TokenCaip19IdStruct)).toThrow(
          'Expected a string matching',
        );
        expect(is(id, TokenCaip19IdStruct)).toBe(false);
      });
    });

    it('rejects IDs with special characters in token address', () => {
      const invalidIds = [
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5@ufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // @ character
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5-ufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // - character
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5_ufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // _ character
      ];

      invalidIds.forEach((id) => {
        console.log(`Testing ID with special chars: ${id}`);
        expect(() => assert(id, TokenCaip19IdStruct)).toThrow(
          'Expected a string matching',
        );
        expect(is(id, TokenCaip19IdStruct)).toBe(false);
      });
    });
  });
});

describe('TokenCaip19IdFromStringStruct', () => {
  describe('validates and returns correct CAIP-19 token IDs', () => {
    it('validates known CAIP-19 IDs from the enum', () => {
      const validIds = [
        KnownCaip19Id.UsdcMainnet,
        KnownCaip19Id.UsdcDevnet,
        KnownCaip19Id.UsdcLocalnet,
        KnownCaip19Id.EurcMainnet,
        KnownCaip19Id.EurcDevnet,
        KnownCaip19Id.EurcLocalnet,
        KnownCaip19Id.Ai16zLocalnet,
      ];

      validIds.forEach((id) => {
        console.log(`Testing valid ID: ${id}`);
        expect(() => assert(id, TokenCaip19IdFromStringStruct)).not.toThrow();
        expect(is(id, TokenCaip19IdFromStringStruct)).toBe(true);
      });
    });

    it('validates test data from TokenApiClient tests', () => {
      const testIds = [
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:1GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr',
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr',
      ];

      testIds.forEach((id) => {
        console.log(`Testing test ID: ${id}`);
        expect(() => assert(id, TokenCaip19IdFromStringStruct)).not.toThrow();
        expect(is(id, TokenCaip19IdFromStringStruct)).toBe(true);
      });
    });

    it('validates USDC address format', () => {
      const usdcId =
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
      console.log(`Testing USDC ID: ${usdcId}`);
      expect(() => assert(usdcId, TokenCaip19IdFromStringStruct)).not.toThrow();
      expect(is(usdcId, TokenCaip19IdFromStringStruct)).toBe(true);
    });
  });

  describe('rejects invalid inputs', () => {
    it('rejects non-string values', () => {
      const invalidValues = [123, null, undefined, {}, [], true, false];

      invalidValues.forEach((value) => {
        console.log(
          `Testing non-string value: ${typeof value} - ${JSON.stringify(value)}`,
        );
        expect(() => assert(value, TokenCaip19IdFromStringStruct)).toThrow(
          'Expected a string',
        );
        expect(is(value, TokenCaip19IdFromStringStruct)).toBe(false);
      });
    });

    it('rejects malformed string IDs', () => {
      const invalidIds = [
        'bad-asset-id',
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:', // missing token address
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token', // missing colon
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/extra', // extra parts
        'eip155:1/token:0x123', // wrong chain
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501', // wrong asset type
      ];

      invalidIds.forEach((id) => {
        console.log(`Testing invalid string ID: ${id}`);
        expect(() => assert(id, TokenCaip19IdFromStringStruct)).toThrow(
          'Expected a string matching',
        );
        expect(is(id, TokenCaip19IdFromStringStruct)).toBe(false);
      });
    });

    it('rejects IDs with special characters in token address', () => {
      const invalidIds = [
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5@ufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // @ character
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5-ufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // - character
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5_ufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // _ character
      ];

      invalidIds.forEach((id) => {
        console.log(`Testing string ID with special chars: ${id}`);
        expect(() => assert(id, TokenCaip19IdFromStringStruct)).toThrow(
          'Expected a string matching',
        );
        expect(is(id, TokenCaip19IdFromStringStruct)).toBe(false);
      });
    });
  });
});

describe('Integration tests with actual API data', () => {
  it('validates the exact format from TokenApiClient test data', () => {
    const mockApiResponse = [
      {
        decimals: 9,
        assetId:
          'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:1GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr',
        name: 'Popcat 1',
        symbol: 'POPCAT',
      },
      {
        decimals: 9,
        assetId:
          'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr',
        name: 'Popcat 2',
        symbol: 'POPCAT',
      },
    ];

    mockApiResponse.forEach((item) => {
      console.log(`Testing API response assetId: ${item.assetId}`);
      expect(() =>
        assert(item.assetId, TokenCaip19IdFromStringStruct),
      ).not.toThrow();
      expect(is(item.assetId, TokenCaip19IdFromStringStruct)).toBe(true);
    });
  });

  it('validates real USDC addresses from the codebase', () => {
    const realUsdcAddresses = [
      'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // Mainnet
      'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1/token:4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU', // Devnet
    ];

    realUsdcAddresses.forEach((address) => {
      console.log(`Testing real USDC address: ${address}`);
      expect(() =>
        assert(address, TokenCaip19IdFromStringStruct),
      ).not.toThrow();
      expect(is(address, TokenCaip19IdFromStringStruct)).toBe(true);
    });
  });
});
