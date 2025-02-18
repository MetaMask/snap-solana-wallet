import type { CaipAssetType } from '@metamask/keyring-api';
import { getImageComponent } from '@metamask/snaps-sdk';

import type { TokenMetadataClient } from '../../clients/token-metadata-client/TokenMetadataClient';
import QUESTION_MARK_SVG from '../../img/question-mark.svg';
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

  async getTokensMetadata(tokensCaipIds: CaipAssetType[]) {
    if (tokensCaipIds.length === 0) {
      return {};
    }

    const tokenMetadata =
      await this.#tokenMetadataClient.getTokenMetadataFromAddresses(
        tokensCaipIds,
      );

    const imagePromises = Object.keys(tokenMetadata).map(
      async (tokenCaipId) => {
        const caipAssetType = tokenCaipId as CaipAssetType;
        try {
          if (!tokenMetadata[caipAssetType]?.iconUrl) {
            this.#logger.warn(`No metadata for ${tokenCaipId}`);
            return;
          }

          const imageSvg = await this.generateImageComponent(
            tokenMetadata[caipAssetType].iconUrl,
          );

          if (!imageSvg) {
            this.#logger.warn(`Unable to generate image for ${tokenCaipId}`);
            return;
          }

          if (tokenMetadata[caipAssetType]) {
            tokenMetadata[caipAssetType].imageSvg = imageSvg;
          } else {
            this.#logger.warn(`No metadata for ${tokenCaipId}`);
          }
        } catch (error) {
          this.#logger.error(error);
        }
      },
    );

    await Promise.all(imagePromises);

    return tokenMetadata;
  }

  async generateImageComponent(imageUrl?: string, width = 48, height = 48) {
    if (!imageUrl) {
      return QUESTION_MARK_SVG;
    }

    return getImageComponent(imageUrl, { width, height })
      .then((image) => image.value)
      .catch(() => QUESTION_MARK_SVG);
  }
}
