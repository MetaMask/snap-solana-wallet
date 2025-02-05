/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { JsonRpcRequest } from '@metamask/snaps-sdk';
import type { CaipChainId } from '@metamask/utils';
import {
  SignAndSendAllTransactions,
  SolanaSignAndSendTransaction,
  SolanaSignIn,
  SolanaSignMessage,
  SolanaSignTransaction,
} from '@solana/wallet-standard-core';
import { assert } from 'superstruct';

import type { Caip10Address } from '../../constants/solana';
import { addressToCaip10 } from '../../utils/addressToCaip10';
import type { ILogger } from '../../utils/logger';
import logger from '../../utils/logger';
import { NetworkStruct } from '../../validation/structs';
import { validateRequest } from '../../validation/validators';
import type { SolanaKeyringAccount } from '../keyring/Keyring';
import { SolanaWalletStandardRequestStruct } from './structs';

export class WalletStandardService {
  readonly #logger: ILogger;

  constructor(_logger = logger) {
    this.#logger = _logger;
  }

  /**
   * Resolves the address of an account from a signing request.
   *
   * This is required by the routing system of MetaMask to dispatch
   * incoming non-EVM dapp signing requests.
   *
   * @param keyringAccounts - The accounts available in the keyring.
   * @param scope - Request's scope (CAIP-2).
   * @param request - Signing request object.
   * @returns A Promise that resolves to the account address that must
   * be used to process this signing request, or null if none candidates
   * could be found.
   * @throws If the request is invalid.
   */
  async resolveAccountAddress(
    keyringAccounts: SolanaKeyringAccount[],
    scope: CaipChainId,
    request: JsonRpcRequest,
  ): Promise<Caip10Address> {
    validateRequest(request, SolanaWalletStandardRequestStruct);
    assert(scope, NetworkStruct);

    const { method, params } = request;

    const accountsWithThisScope = keyringAccounts.filter((account) =>
      account.scopes.includes(scope),
    );
    if (accountsWithThisScope.length === 0) {
      throw new Error('No accounts with this scope');
    }

    switch (method) {
      case SignAndSendAllTransactions: {
        /**
         * Here we receive a list of transactions to sign and send.
         * We check if all accounts in the request are the same.
         * If yes, we can safely return the address of the first account.
         * If not, we throw an error because we can't decide which one to use.
         */
        const accounts = params.map((param) => param.account);
        if (!accounts.length) {
          throw new Error('No accounts');
        }
        const firstAccount = accounts[0]!;

        const isAllAccountsTheSame = accounts.every(
          (account) => account.address === firstAccount.address,
        );
        if (!isAllAccountsTheSame) {
          throw new Error('All accounts must be the same');
        }

        return addressToCaip10(scope, firstAccount.address);
      }
      case SolanaSignIn: {
        const { address } = params;
        if (!address) {
          throw new Error('No address');
        }
        return addressToCaip10(scope, address);
      }
      case SolanaSignAndSendTransaction:
      case SolanaSignMessage:
      case SolanaSignTransaction: {
        const { account } = params;

        // Check if the account is in the list of accounts held in the keyring.
        const address = accountsWithThisScope.find(
          (a) => a.address === account.address,
        )?.address;

        if (!address) {
          throw new Error('Account not found');
        }

        return addressToCaip10(scope, address);
      }
      default: {
        // This code is unreachable because the "validateRequest" function
        // already protects against invalid methods.
        this.#logger.warn({ method }, 'Unsupported method');
        throw new Error('Unsupported method');
      }
    }
  }
}
