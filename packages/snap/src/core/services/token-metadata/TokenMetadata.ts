import { getImageComponent } from '@metamask/snaps-sdk';

import type { TokenMetadataClient } from '../../clients/token-metadata-client/TokenMetadataClient';
import type { Network } from '../../constants/solana';
import type { ILogger } from '../../utils/logger';

export class TokenMetadataService {
  readonly #tokenMetadataClient: TokenMetadataClient;

  readonly #logger: ILogger;

  constructor({
    tokenMetadataClient,
    logger,
  }: {
    tokenMetadataClient: TokenMetadataClient;
    logger: ILogger;
  }) {
    this.#tokenMetadataClient = tokenMetadataClient;
    this.#logger = logger;
  }

  async getMultipleTokenMetadata(tokensCaipIds: string[], scope: Network) {
    if (tokensCaipIds.length === 0) {
      return {};
    }

    const tokenMetadata =
      await this.#tokenMetadataClient.getTokenMetadataFromAddresses(
        tokensCaipIds,
        scope,
      );

    const imagePromises = Object.keys(tokenMetadata).map(
      async (tokenCaipId) => {
        try {
          if (!tokenMetadata[tokenCaipId]?.iconUrl) {
            throw new Error(`No metadata for ${tokenCaipId}`);
          }

          const imageSvg = await this.#generateImageComponent(
            tokenMetadata[tokenCaipId].iconUrl,
          );

          if (!imageSvg) {
            throw new Error(`Unable to generate image for ${tokenCaipId}`);
          }

          if (tokenMetadata[tokenCaipId]) {
            tokenMetadata[tokenCaipId].imageSvg = imageSvg;
          } else {
            throw new Error(`No metadata for ${tokenCaipId}`);
          }
        } catch (error) {
          this.#logger.error(error);
        }
      },
    );

    await Promise.all(imagePromises);

    return tokenMetadata;
  }

  async #generateImageComponent(imageUrl?: string) {
    if (!imageUrl) {
      return null;
    }

    return getImageComponent(imageUrl, { width: 48, height: 48 })
      .then((image) => image.value)
      .catch(() => null);
  }
}
