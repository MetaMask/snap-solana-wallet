import type { TokenMetadataClient } from '../../clients/token-metadata-client/TokenMetadataClient';
import type { SolanaAsset } from '../../domain';
import {
  SOLANA_MOCK_SPL_TOKENS,
  SOLANA_MOCK_TOKEN_METADATA,
} from '../../test/mocks/solana-assets';
import type { ILogger } from '../../utils/logger';
import { TokenMetadataService } from './TokenMetadata';

describe('TokenMetadataService', () => {
  let tokenMetadataClient: TokenMetadataClient;
  let tokenMetadataService: TokenMetadataService;
  let logger: ILogger;
  beforeEach(() => {
    tokenMetadataClient = {
      getTokenMetadataFromAddresses: jest.fn(),
    } as unknown as TokenMetadataClient;

    logger = {
      error: jest.fn(),
      warn: jest.fn(),
    } as unknown as ILogger;

    tokenMetadataService = new TokenMetadataService({
      tokenMetadataClient,
      logger,
    });
  });

  describe('getTokensMetadata', () => {
    it('returns an empty object if no tokens are provided', async () => {
      const result = await tokenMetadataService.getTokensMetadata([]);
      expect(result).toStrictEqual({});
    });

    it('returns token metadata from client', async () => {
      const tokens: SolanaAsset[] = SOLANA_MOCK_SPL_TOKENS;
      const mockMetadata = SOLANA_MOCK_TOKEN_METADATA;

      jest
        .spyOn(tokenMetadataClient, 'getTokenMetadataFromAddresses')
        .mockResolvedValue(mockMetadata);

      const result = await tokenMetadataService.getTokensMetadata(
        tokens.map((token) => token.assetType),
      );

      expect(result).toStrictEqual(mockMetadata);
    });

    it('throws an error if the client fails to fetch token metadata', async () => {
      const tokens: SolanaAsset[] = SOLANA_MOCK_SPL_TOKENS;
      const error = new Error('Error fetching token metadata');

      jest
        .spyOn(tokenMetadataClient, 'getTokenMetadataFromAddresses')
        .mockRejectedValue(error);

      await expect(
        tokenMetadataService.getTokensMetadata(
          tokens.map((token) => token.assetType),
        ),
      ).rejects.toThrow('Error fetching token metadata');
    });
  });
});
