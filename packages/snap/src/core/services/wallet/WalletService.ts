/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  type KeyringRequest,
  SolMethod,
  type Transaction,
} from '@metamask/keyring-api';
import type { Infer } from '@metamask/superstruct';
import { assert, instance, object } from '@metamask/superstruct';
import type { SignatureBytes } from '@solana/web3.js';
import {
  address as asAddress,
  createKeyPairSignerFromPrivateKeyBytes,
  createSignableMessage,
  getBase58Codec,
  getBase58Decoder,
  getBase64Codec,
  getUtf8Codec,
  verifySignature,
} from '@solana/web3.js';

import type { Caip10Address, Network } from '../../constants/solana';
import { ScheduleBackgroundEventMethod } from '../../handlers/onCronjob/backgroundEvents/ScheduleBackgroundEventMethod';
import type { SolanaKeyringAccount } from '../../handlers/onKeyringRequest/Keyring';
import { addressToCaip10 } from '../../utils/addressToCaip10';
import { deriveSolanaPrivateKey } from '../../utils/deriveSolanaPrivateKey';
import type { ILogger } from '../../utils/logger';
import logger from '../../utils/logger';
import {
  Base58Struct,
  Base64Struct,
  NetworkStruct,
} from '../../validation/structs';
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
   *
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
    assert(request.scope, NetworkStruct);

    const { transaction, scope } = request.request.params;

    const transactionMessage =
      await this.#fromBase64EncodedBuilder.buildTransactionMessage(
        transaction,
        scope,
      );

    const { privateKeyBytes } = await deriveSolanaPrivateKey(account.index);
    const signer = await createKeyPairSignerFromPrivateKeyBytes(
      privateKeyBytes,
    );

    const { signature } = await this.#transactionHelper.signTransaction(
      transactionMessage,
      [signer],
    );

    const result = {
      signedTransaction: signature,
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
    const base64EncodedTransaction = params.transaction;

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

      const signature = await this.#transactionHelper.signAndSendTransaction(
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
              base64EncodedTransaction,
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
   * Signs the provided base64 encoded message using the provided account's
   * private key.
   *
   * It DOES NOT decode the message to UTF-8 before signing, meaning that the
   * signature must be verified using the base64 encoded message as well.
   *
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

    // message is base64 encoded
    const { message } = request.request.params;
    const messageBytes = getBase64Codec().encode(message);
    const messageUtf8 = getUtf8Codec().decode(messageBytes);

    const { privateKeyBytes } = await deriveSolanaPrivateKey(account.index);
    const signer = await createKeyPairSignerFromPrivateKeyBytes(
      privateKeyBytes,
    );

    const signableMessage = createSignableMessage(messageUtf8);

    const [messageSignatureBytesMap] = await signer.signMessages([
      signableMessage,
    ]);

    // Equivalent to - but more compact than - an undefined check + throw error
    assert(messageSignatureBytesMap, object());

    const messageSignatureBytes =
      messageSignatureBytesMap[asAddress(account.address)];

    // Equivalent to - but more compact than - an undefined check + throw error
    assert(messageSignatureBytes, instance(Uint8Array));

    const signature = getBase58Decoder().decode(messageSignatureBytes);

    const result = {
      signature,
      signedMessage: message,
      signatureType: 'ed25519',
    };

    assert(result, SolanaSignMessageResponseStruct);

    return result;
  }

  /**
   * Signs in to the Solana blockchain. Receives a sign in intent object
   * that contains data like domain, or uri, then converts it into a message
   * using JSON.stringify, then signs the message.
   *
   * @param account - The account to sign the message.
   * @param request - The JSON-RPC request object.
   * @param request.request.params - A sign in intent object that contains data like domain, or uri.
   * @returns A Promise that resolves to the signed message.
   * @throws If the request is invalid.
   */
  async signIn(
    account: SolanaKeyringAccount,
    request: KeyringRequest,
  ): Promise<SolanaSignInResponse> {
    assert(request.request, SolanaSignInRequestStruct);

    const { address } = account;
    const { params } = request.request;

    const messageUtf8 = JSON.stringify(params);
    const messageBytes = getUtf8Codec().encode(messageUtf8);
    const messageBase64 = getBase64Codec().decode(messageBytes);

    const requestForSignMessage: KeyringRequest = {
      id: globalThis.crypto.randomUUID(),
      scope: request.scope,
      account: account.id,
      request: {
        method: SolMethod.SignMessage,
        params: {
          account: {
            address,
          },
          message: messageBase64,
        },
      },
    };

    const signMessageResponse = await this.signMessage(
      account,
      requestForSignMessage,
    );

    const result = {
      account: {
        address,
      },
      ...signMessageResponse,
    };

    assert(result, SolanaSignInResponseStruct);

    return result;
  }

  /**
   * Verifies that the passed signature was rightfully created by signing the
   * passed message with the passed account's private key.
   *
   * @param account - The account that is being verified.
   * @param signatureBase58 - The signature to verify.
   * @param messageBase64 - The original message.
   * @returns A Promise that resolves to a boolean indicating whether the
   * signature is valid.
   */
  async verifySignature(
    account: SolanaKeyringAccount,
    signatureBase58: Infer<typeof Base58Struct>,
    messageBase64: Infer<typeof Base64Struct>,
  ): Promise<boolean> {
    assert(signatureBase58, Base58Struct);
    assert(messageBase64, Base64Struct);

    const { privateKeyBytes } = await deriveSolanaPrivateKey(account.index);
    const signer = await createKeyPairSignerFromPrivateKeyBytes(
      privateKeyBytes,
    );

    const signatureBytes = getBase58Codec().encode(
      signatureBase58,
    ) as SignatureBytes;
    console.log('signatureBytes', signatureBytes);

    const messageBytes = getBase64Codec().encode(messageBase64);
    console.log('messageBytes', messageBytes);

    const verified = await verifySignature(
      signer.keyPair.publicKey,
      signatureBytes,
      messageBytes,
    );

    return verified;
  }
}
