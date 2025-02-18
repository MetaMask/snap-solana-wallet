/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { SolMethod, type KeyringRequest } from '@metamask/keyring-api';
import type { JsonRpcRequest } from '@metamask/snaps-sdk';
import type { CaipChainId } from '@metamask/utils';
import { assert } from 'superstruct';

import type { Caip10Address } from '../../constants/solana';
import { addressToCaip10 } from '../../utils/addressToCaip10';
import type { ILogger } from '../../utils/logger';
import logger from '../../utils/logger';
import { NetworkStruct } from '../../validation/structs';
import { validateRequest } from '../../validation/validators';
import type { SolanaKeyringAccount } from '../keyring/Keyring';
import {
  SolanaSignAndSendTransactionRequestStruct,
  type SolanaSignAndSendTransactionResponse,
  SolanaSignAndSendTransactionResponseStruct,
  SolanaSignInRequestStruct,
  type SolanaSignInResponse,
  SolanaSignInResponseStruct,
  SolanaSignMessageRequestStruct,
  type SolanaSignMessageResponse,
  SolanaSignMessageResponseStruct,
  SolanaSignTransactionRequestStruct,
  type SolanaSignTransactionResponse,
  SolanaSignTransactionResponseStruct,
  SolanaWalletStandardRequestStruct,
} from './structs';

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
      case SolMethod.SignIn: {
        const { address } = params;
        if (!address) {
          throw new Error('No address');
        }
        return addressToCaip10(scope, address);
      }
      case SolMethod.SignAndSendTransaction:
      case SolMethod.SignMessage:
      case SolMethod.SignTransaction: {
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

  /**
   * Signs a transaction.
   * @param request - The request to sign a transaction.
   * @returns A Promise that resolves to the signed transaction.
   * @throws If the request is invalid.
   */
  async signTransaction(
    request: KeyringRequest,
  ): Promise<SolanaSignTransactionResponse> {
    assert(request.request, SolanaSignTransactionRequestStruct);

    const { transaction } = request.request.params;

    // TODO: Implement the actual confirmation + signing logic.
    const result = {
      signedTransaction: transaction,
    };

    assert(result, SolanaSignTransactionResponseStruct);

    return result;
  }

  /**
   * Signs and sends a transaction.
   * @param request - The request to sign and send a transaction.
   * @returns A Promise that resolves to the signed transaction.
   * @throws If the request is invalid.
   */
  async signAndSendTransaction(
    request: KeyringRequest,
  ): Promise<SolanaSignAndSendTransactionResponse> {
    assert(request.request, SolanaSignAndSendTransactionRequestStruct);

    const { transaction } = request.request.params;

    // TODO: Implement the actual confirmation + signing logic.
    const result = {
      signature: transaction,
    };

    assert(result, SolanaSignAndSendTransactionResponseStruct);

    return result;
  }

  /**
   * Signs a message.
   * @param request - The request to sign a message.
   * @returns A Promise that resolves to the signed message.
   * @throws If the request is invalid.
   */
  async signMessage(
    request: KeyringRequest,
  ): Promise<SolanaSignMessageResponse> {
    assert(request.request, SolanaSignMessageRequestStruct);

    const { message } = request.request.params;

    // TODO: Implement the actual confirmation + signing logic.
    const result = {
      signature: message,
      signedMessage: message,
      signatureType: 'ed25519',
    };

    assert(result, SolanaSignMessageResponseStruct);

    return result;
  }

  async signIn(request: KeyringRequest): Promise<SolanaSignInResponse> {
    assert(request.request, SolanaSignInRequestStruct);

    const { address, ...params } = request.request.params;

    // TODO: Implement the actual confirmation + signing logic.
    const message = Object.values(params).join(' | ');

    const result = {
      account: {
        address,
      },
      signature: 'mock-signature',
      signedMessage: message,
      signatureType: 'ed25519',
    };

    assert(result, SolanaSignInResponseStruct);

    return result;
  }
}
