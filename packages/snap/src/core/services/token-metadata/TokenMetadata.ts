import { getImageComponent } from '@metamask/snaps-sdk';

import type { TokenApiClient } from '../../clients/token-api-client/TokenApiClient';
import type { TokenCaipAssetType } from '../../constants/solana';
import QUESTION_MARK_SVG from '../../img/question-mark.svg';
import type { ILogger } from '../../utils/logger';

export class TokenMetadataService {
  readonly #tokenApiClient: TokenApiClient;

  readonly #logger: ILogger;

  constructor({
    tokenApiClient,
    logger,
  }: {
    tokenApiClient: TokenApiClient;
    logger: ILogger;
  }) {
    this.#tokenApiClient = tokenApiClient;
    this.#logger = logger;
  }

  async getTokensMetadata(assetTypes: TokenCaipAssetType[]) {
    if (assetTypes.length === 0) {
      this.#logger.warn(
        `No tokens to get metadata for ${assetTypes.join(', ')}`,
      );
      return {};
    }

    const tokenMetadata =
      await this.#tokenApiClient.getTokenMetadataFromAddresses(assetTypes);

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
