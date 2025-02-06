import {
  address as asAddress,
  type JsonParsedTokenAccount,
} from '@solana/web3.js';
import { assert } from 'superstruct';

import type { Network } from '../../constants/solana';
import { SolanaCaip19Tokens, TOKEN_PROGRAM_ID } from '../../constants/solana';
import type { SolanaAsset } from '../../types/solana';
import type { ILogger } from '../../utils/logger';
import { tokenAddressToCaip19 } from '../../utils/tokenAddressToCaip19';
import type { SolanaConnection } from '../connection';
import {
  GetBalanceResponseStruct,
  GetTokenAccountsByOwnerResponseStruct,
} from '../connection/structs';

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
    scope: Network,
  ): Promise<SolanaAsset[]> {
    const tokens = await this.#getAddressTokenAccounts(address, scope);

    return tokens;
  }

  async getNativeAsset(address: string, scope: Network): Promise<SolanaAsset> {
    const response = await this.#connection
      .getRpc(scope)
      .getBalance(asAddress(address))
      .send();

    assert(response, GetBalanceResponseStruct);

    return {
      scope,
      address: `${scope}/${SolanaCaip19Tokens.SOL}`,
      balance: response.value.toString(),
      decimals: 9,
      native: true,
    };
  }

  async #getAddressTokenAccounts(address: string, scope: Network) {
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

      assert(response, GetTokenAccountsByOwnerResponseStruct);

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
    scope: Network,
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
