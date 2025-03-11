/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { Transaction } from '@metamask/keyring-api';
import { type KeyringRequest, SolMethod } from '@metamask/keyring-api';
import { assert } from '@metamask/superstruct';
import {
  address as asAddress,
  createKeyPairSignerFromPrivateKeyBytes,
} from '@solana/web3.js';

import type { Caip10Address, Network } from '../../constants/solana';
import { ScheduleBackgroundEventMethod } from '../../handlers/onCronjob/backgroundEvents/ScheduleBackgroundEventMethod';
import type { SolanaKeyringAccount } from '../../handlers/onKeyringRequest/Keyring';
import { addressToCaip10 } from '../../utils/addressToCaip10';
import { deriveSolanaPrivateKey } from '../../utils/deriveSolanaPrivateKey';
import type { ILogger } from '../../utils/logger';
import logger from '../../utils/logger';
import { NetworkStruct } from '../../validation/structs';
import type { FromBase64EncodedBuilder } from '../execution/builders/FromBase64EncodedBuilder';
import type { TransactionHelper } from '../execution/TransactionHelper';
import { mapRpcTransaction } from '../transactions/utils/mapRpcTransaction';
import type {
  SolanaSignAndSendTransactionResponse,
  SolanaWalletRequest,
} from './structs';
import {
  SolanaSignAndSendTransactionRequestStruct,
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
} from './structs';

export class WalletService {
  readonly #fromBase64EncodedBuilder: FromBase64EncodedBuilder;

  readonly #transactionHelper: TransactionHelper;

  readonly #logger: ILogger;

  constructor(
    fromBase64EncodedBuilder: FromBase64EncodedBuilder,
    transactionHelper: TransactionHelper,
    _logger = logger,
  ) {
    this.#fromBase64EncodedBuilder = fromBase64EncodedBuilder;
    this.#transactionHelper = transactionHelper;
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
    scope: Network,
    request: SolanaWalletRequest,
  ): Promise<Caip10Address> {
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
   * @param account - The account to sign the transaction.
   * @param request - The request to sign a transaction.
   * @returns A Promise that resolves to the signed transaction.
   * @throws If the request is invalid.
   */
  async signTransaction(
    account: SolanaKeyringAccount,
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
   * @param account - The account to sign and send the transaction.
   * @param request - The request to sign and send a transaction.
   * @returns A Promise that resolves to the signed transaction.
   */
  async signAndSendTransaction(
    account: SolanaKeyringAccount,
    request: KeyringRequest,
  ): Promise<SolanaSignAndSendTransactionResponse> {
    assert(request.request, SolanaSignAndSendTransactionRequestStruct);
    assert(request.scope, NetworkStruct);

    const {
      request: { params },
      scope,
    } = request;
    const base64EncodedTransaction = params.transaction ?? '';

    try {
      const transactionMessage =
        await this.#fromBase64EncodedBuilder.buildTransactionMessage(
          base64EncodedTransaction,
          scope,
        );

      const { privateKeyBytes } = await deriveSolanaPrivateKey(account.index);
      const signer = await createKeyPairSignerFromPrivateKeyBytes(
        privateKeyBytes,
      );

      const signature = await this.#transactionHelper.sendTransaction(
        transactionMessage,
        [signer],
        scope,
      );

      // Trigger the side effects that need to happen when the transaction is submitted
      await snap.request({
        method: 'snap_scheduleBackgroundEvent',
        params: {
          duration: 'PT1S',
          request: {
            method: ScheduleBackgroundEventMethod.OnTransactionSubmitted,
            params: {
              accountId: account.id,
              base64EncodedTransactionMessage: base64EncodedTransaction,
              signature,
              scope,
            },
          },
        },
      });

      const result = {
        signature,
      };

      assert(result, SolanaSignAndSendTransactionResponseStruct);

      const transaction =
        await this.#transactionHelper.waitForTransactionCommitment(
          signature,
          'confirmed',
          scope,
        );

      const mappedTransaction = mapRpcTransaction({
        scope,
        address: asAddress(account.address),
        transactionData: transaction,
      });

      const mappedTransactionWithAccountId: Transaction = {
        ...mappedTransaction,
        account: account.id,
      } as Transaction;

      // Trigger the side effects that need to happen when the transaction is finalized (failed or confirmed)
      await snap.request({
        method: 'snap_scheduleBackgroundEvent',
        params: {
          duration: 'PT1S',
          request: {
            method: ScheduleBackgroundEventMethod.OnTransactionFinalized,
            params: {
              accountId: account.id,
              transaction: mappedTransactionWithAccountId,
            },
          },
        },
      });

      return result;
    } catch (error) {
      console.error(error);
      this.#logger.error(error);
      throw error;
    }
  }

  /**
   * Signs a message.
   * @param account - The account to sign the message.
   * @param request - The request to sign a message.
   * @returns A Promise that resolves to the signed message.
   * @throws If the request is invalid.
   */
  async signMessage(
    account: SolanaKeyringAccount,
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

  async signIn(
    account: SolanaKeyringAccount,
    request: KeyringRequest,
  ): Promise<SolanaSignInResponse> {
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
