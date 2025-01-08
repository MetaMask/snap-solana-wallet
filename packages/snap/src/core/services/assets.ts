import type { Balance } from '@metamask/keyring-api';
import {
  address as asAddress,
  type JsonParsedTokenAccount,
} from '@solana/web3.js';
import { BigNumber } from 'bignumber.js';

import type { SolanaCaip2Networks } from '../constants/solana';
import {
  SOL_IMAGE_URL,
  SOL_SYMBOL,
  SolanaCaip19Tokens,
  TOKEN_PROGRAM_ID,
} from '../constants/solana';
import type { SolanaAsset } from '../types/solana';
import type { ILogger } from '../utils/logger';
import { tokenAddressToCaip19 } from '../utils/token-address-to-caip19';
import type { SolanaConnection } from './connection';

export class AssetsService {
  readonly #logger: ILogger;

  readonly #connection: SolanaConnection;

  constructor({
    connection,
    logger,
  }: {
    connection: SolanaConnection;
    logger: ILogger;
  }) {
    this.#logger = logger;
    this.#connection = connection;
  }

  async discoverTokens(
    address: string,
    scope: SolanaCaip2Networks,
  ): Promise<SolanaAsset[]> {
    const tokens = await this.#getAddressTokenAccounts(address, scope);

    const nonZeroBalanceTokens = this.filterZeroBalanceTokens(tokens);

    return nonZeroBalanceTokens;
  }

  async getNativeAsset(
    address: string,
    scope: SolanaCaip2Networks,
  ): Promise<SolanaAsset> {
    const response = await this.#connection
      .getRpc(scope)
      .getBalance(asAddress(address))
      .send();

    return {
      scope,
      address: `${scope}/${SolanaCaip19Tokens.SOL}`,
      balance: response.value.toString(),
      decimals: 9,
      native: true,
      metadata: {
        symbol: SOL_SYMBOL,
        name: 'Solana',
        iconUrl: SOL_IMAGE_URL,
      },
    };
  }

  filterZeroBalanceTokens(tokens: SolanaAsset[]) {
    return tokens.filter((token) =>
      new BigNumber(token.balance).isGreaterThan(0),
    );
  }

  async #getAddressTokenAccounts(address: string, scope: SolanaCaip2Networks) {
    try {
      const response = await this.#connection
        .getRpc(scope)
        .getTokenAccountsByOwner(
          asAddress(address),
          {
            programId: TOKEN_PROGRAM_ID,
          },
          {
            encoding: 'jsonParsed',
          },
        )
        .send();

      return response.value.map((token) =>
        this.#mapRpcSolanaToken(token.account.data.parsed.info, scope),
      );
    } catch (error) {
      this.#logger.error(error, 'Error fetching token accounts');
      throw error;
    }
  }

  #mapRpcSolanaToken(
    token: JsonParsedTokenAccount,
    scope: SolanaCaip2Networks,
  ): SolanaAsset {
    return {
      scope,
      address: tokenAddressToCaip19(scope, token.mint),
      balance: token.tokenAmount.amount,
      decimals: token.tokenAmount.decimals,
      native: token.isNative,
    };
  }
}
