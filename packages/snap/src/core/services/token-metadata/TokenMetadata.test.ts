import type { TokenApiClient } from '../../clients/token-api-client/TokenApiClient';
import {
  MOCK_ASSET_ENTITY_1,
  MOCK_ASSET_ENTITY_2,
  SOLANA_MOCK_TOKEN_METADATA,
} from '../../test/mocks/asset-entities';
import type { ILogger } from '../../utils/logger';
import { TokenMetadataService } from './TokenMetadata';

describe('TokenMetadataService', () => {
  let tokenApiClient: TokenApiClient;
  let tokenMetadataService: TokenMetadataService;
  let logger: ILogger;

  const assetTypes = [MOCK_ASSET_ENTITY_1, MOCK_ASSET_ENTITY_2].map(
    (asset) => asset.assetType,
  );

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
      const mockMetadata = SOLANA_MOCK_TOKEN_METADATA;

      jest
        .spyOn(tokenApiClient, 'getTokenMetadataFromAddresses')
        .mockResolvedValue(mockMetadata);

      const result = await tokenMetadataService.getTokensMetadata(assetTypes);

      expect(result).toStrictEqual(mockMetadata);
    });

    it('throws an error if the client fails to fetch token metadata', async () => {
      const error = new Error('Error fetching token metadata');

      jest
        .spyOn(tokenApiClient, 'getTokenMetadataFromAddresses')
        .mockRejectedValue(error);

      await expect(
        tokenMetadataService.getTokensMetadata(assetTypes),
      ).rejects.toThrow('Error fetching token metadata');
    });
  });
});
