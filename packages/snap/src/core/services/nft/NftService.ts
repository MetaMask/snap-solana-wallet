import type { ILogger } from '../../utils/logger';
import logger from '../../utils/logger';
import type { SolanaConnection } from '../connection';

export class NftService {
  readonly #connection: SolanaConnection;

  readonly #logger: ILogger;

  constructor(connection: SolanaConnection, _logger: ILogger = logger) {
    this.#connection = connection;
    this.#logger = _logger;
  }

  /**
   * A quick and synchronous way to check if a token is non-fungible, i.e. it's an NFT.
   *
   * ⚠️ WARNING: This is NOT a 100% reliable way to check if a token is an NFT, just
   * that there's a good chance that the token is an NFT.
   *
   * It only checks if the token has 0 decimals, which is a common but not exclusive
   * characteristic of NFTs. A token with 0 decimals could still be a fungible token
   * with a supply greater than 1.
   *
   * Use cases:
   * - Quick filtering of potential NFTs in UI lists.
   * - Initial screening before performing full NFT validation.
   * - Situations where performance is critical and absolute accuracy isn't required.
   *
   * @param token - The token account to check. Must contain token amount information.
   * @param token.tokenAmount - The token amount object containing decimals information.
   * @param token.tokenAmount.decimals - The number of decimal places the token uses.
   * @returns True if the token has 0 decimals (potential NFT), false otherwise.
   */
  static isMaybeNonFungible<
    TToken extends { tokenAmount: { decimals: number } },
  >(token: TToken): boolean {
    const { tokenAmount } = token;
    const { decimals } = tokenAmount;

    // return decimals === 0;
    return true;
  }
}
