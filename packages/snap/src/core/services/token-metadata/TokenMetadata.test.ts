import type { TokenApiClient } from '../../clients/token-api-client/TokenApiClient';
import type { TokenCaipAssetType } from '../../constants/solana';
import {
  SOLANA_MOCK_SPL_TOKENS,
  SOLANA_MOCK_TOKEN_METADATA,
} from '../../test/mocks/solana-assets';
import type { SolanaAsset } from '../../types/solana';
import type { ILogger } from '../../utils/logger';
import { TokenMetadataService } from './TokenMetadata';

describe('TokenMetadataService', () => {
  let tokenApiClient: TokenApiClient;
  let tokenMetadataService: TokenMetadataService;
  let logger: ILogger;
  beforeEach(() => {
    tokenApiClient = {
      getTokenMetadataFromAddresses: jest.fn(),
    } as unknown as TokenApiClient;

    logger = {
      error: jest.fn(),
      warn: jest.fn(),
    } as unknown as ILogger;

    tokenMetadataService = new TokenMetadataService({
      tokenApiClient,
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
        .spyOn(tokenApiClient, 'getTokenMetadataFromAddresses')
        .mockResolvedValue(mockMetadata);

      const result = await tokenMetadataService.getTokensMetadata(
        tokens.map((token) => token.assetType as TokenCaipAssetType),
      );

      expect(result).toStrictEqual(mockMetadata);
    });

    it('throws an error if the client fails to fetch token metadata', async () => {
      const tokens: SolanaAsset[] = SOLANA_MOCK_SPL_TOKENS;
      const error = new Error('Error fetching token metadata');

      jest
        .spyOn(tokenApiClient, 'getTokenMetadataFromAddresses')
        .mockRejectedValue(error);

      await expect(
        tokenMetadataService.getTokensMetadata(
          tokens.map((token) => token.assetType as TokenCaipAssetType),
        ),
      ).rejects.toThrow('Error fetching token metadata');
    });
  });
});
