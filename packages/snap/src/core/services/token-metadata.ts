import type { TokenMetadataClient } from '../clients/token-metadata-client/token-metadata-client';
import type { SolanaCaip2Networks } from '../constants/solana';
import type { SolanaAsset } from '../types/solana';

export class TokenMetadataService {
  readonly #tokenMetadataClient: TokenMetadataClient;

  constructor({
    tokenMetadataClient,
  }: {
    tokenMetadataClient: TokenMetadataClient;
  }) {
    this.#tokenMetadataClient = tokenMetadataClient;
  }

  async getMultipleTokenMetadata(
    tokens: SolanaAsset[],
    scope: SolanaCaip2Networks,
  ) {
    if (tokens.length === 0) {
      return {};
    }

    const tokenMetadata =
      await this.#tokenMetadataClient.getTokenMetadataFromAddresses(
        tokens.map((token) => token.address),
        scope,
      );

    return tokenMetadata;
  }
}
