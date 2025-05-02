import type { CaipAssetType } from '@metamask/keyring-api';
import { getImageComponent } from '@metamask/snaps-sdk';

import type { TokenMetadataClient } from '../../clients/token-metadata-client/TokenMetadataClient';
import type { SolanaLegitimateTokenMetadata } from '../../clients/token-metadata-client/types';
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

    const existingTokenMetadata =
      await this.#tokenMetadataClient.getTokenMetadataFromAddresses(
        tokensCaipIds,
      );
    const newTokenMetadata: Record<
      CaipAssetType,
      SolanaLegitimateTokenMetadata
    > = {};

    await Promise.all(
      Object.entries(existingTokenMetadata).map(
        async ([tokenCaipId, metadata]) => {
          if (!metadata?.iconUrl) {
            this.#logger.warn(`No metadata for ${tokenCaipId}`);
            return;
          }

          const imageSvg = await this.generateImageComponent(metadata.iconUrl);

          newTokenMetadata[tokenCaipId as CaipAssetType] = {
            ...metadata,
            imageSvg,
          };
        },
      ),
    );

    return newTokenMetadata;
  }

  async generateImageComponent(imageUrl: string, width = 48, height = 48) {
    return getImageComponent(imageUrl, { width, height })
      .then((image) => image.value)
      .catch(() => QUESTION_MARK_SVG);
  }
}
