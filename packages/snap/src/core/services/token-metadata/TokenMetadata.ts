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
      this.#logger.warn(
        `No tokens to get metadata for ${tokensCaipIds.join(', ')}`,
      );
      return {};
    }

    const tokenMetadata =
      await this.#tokenMetadataClient.getTokenMetadataFromAddresses(
        tokensCaipIds,
      );

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
