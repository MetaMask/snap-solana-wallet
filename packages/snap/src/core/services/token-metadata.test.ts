import type { TokenMetadataClient } from '../clients/token-metadata-client/token-metadata-client';
import { Network } from '../constants/solana';
import {
  SOLANA_MOCK_SPL_TOKENS,
  SOLANA_MOCK_TOKEN_METADATA,
} from '../test/mocks/solana-assets';
import type { SolanaAsset } from '../types/solana';
import { TokenMetadataService } from './token-metadata';

describe('TokenMetadataService', () => {
  let tokenMetadataClient: TokenMetadataClient;
  let tokenMetadataService: TokenMetadataService;

  beforeEach(() => {
    tokenMetadataClient = {
      getTokenMetadataFromAddresses: jest.fn(),
    } as unknown as TokenMetadataClient;

    tokenMetadataService = new TokenMetadataService({ tokenMetadataClient });
  });

  describe('getMultipleTokenMetadata', () => {
    it('returns an empty object if no tokens are provided', async () => {
      const result = await tokenMetadataService.getMultipleTokenMetadata(
        [],
        Network.Localnet,
      );
      expect(result).toStrictEqual({});
    });

    it('returns token metadata from client', async () => {
      const tokens: SolanaAsset[] = SOLANA_MOCK_SPL_TOKENS;
      const scope: Network = Network.Localnet;
      const mockMetadata = SOLANA_MOCK_TOKEN_METADATA;

      jest
        .spyOn(tokenMetadataClient, 'getTokenMetadataFromAddresses')
        .mockResolvedValue(mockMetadata);

      const result = await tokenMetadataService.getMultipleTokenMetadata(
        tokens,
        scope,
      );

      expect(result).toStrictEqual(mockMetadata);
    });

    it('throws an error if the client fails to fetch token metadata', async () => {
      const tokens: SolanaAsset[] = SOLANA_MOCK_SPL_TOKENS;
      const scope: Network = Network.Localnet;
      const error = new Error('Error fetching token metadata');

      jest
        .spyOn(tokenMetadataClient, 'getTokenMetadataFromAddresses')
        .mockRejectedValue(error);

      await expect(
        tokenMetadataService.getMultipleTokenMetadata(tokens, scope),
      ).rejects.toThrow('Error fetching token metadata');
    });
  });
});
