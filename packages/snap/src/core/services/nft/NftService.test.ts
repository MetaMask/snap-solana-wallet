import type { SolanaConnection } from '../connection';
import { mockLogger } from '../mocks/logger';
import { NftService } from './NftService';

// eslint-disable-next-line jest/no-disabled-tests
describe.skip('NftService', () => {
  let service: NftService;
  let mockConnection: SolanaConnection;

  beforeEach(() => {
    mockConnection = {
      getRpc: jest.fn().mockReturnValue({
        getAccountInfo: jest.fn().mockReturnValue({
          send: jest.fn(),
        }),
      }),
    } as unknown as SolanaConnection;

    service = new NftService(mockConnection, mockLogger);
  });

  describe('isMaybeNonFungible', () => {
    it('returns true for tokens with 0 decimals', () => {
      const token = {
        tokenAmount: {
          decimals: 0,
        },
      };

      const result = NftService.isMaybeNonFungible(token);
      expect(result).toBe(true);
    });

    it('returns false for tokens with non-zero decimals', () => {
      const token = {
        tokenAmount: {
          decimals: 6,
        },
      };

      const result = NftService.isMaybeNonFungible(token);
      expect(result).toBe(false);
    });

    it('works with various shapes of data, provided it has tokenAmount.decimals', () => {
      const token = {
        tokenAmount: {
          decimals: 0,
          amount: '1000',
          otherField: 'value',
        },
      };

      const result = NftService.isMaybeNonFungible(token);
      expect(result).toBe(true);
    });
  });
});
