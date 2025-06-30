/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  type KeyringRequest,
  SolMethod,
  type Transaction,
} from '@metamask/keyring-api';
import type { Infer } from '@metamask/superstruct';
import { assert, instance, object } from '@metamask/superstruct';
import type { Commitment, SignatureBytes } from '@solana/kit';
import {
  address as asAddress,
  assertTransactionIsFullySigned,
  createKeyPairSignerFromPrivateKeyBytes,
  createSignableMessage,
  getBase58Codec,
  getBase58Decoder,
  getBase64Codec,
  getSignatureFromTransaction,
  getUtf8Codec,
  sendTransactionWithoutConfirmingFactory,
  verifySignature,
} from '@solana/kit';

import type { SolanaKeyringAccount } from '../../../entities';
import { eventEmitter } from '../../../snapContext';
import type { Caip10Address, Network } from '../../constants/solana';
import { ScheduleBackgroundEventMethod } from '../../handlers/onCronjob/backgroundEvents/ScheduleBackgroundEventMethod';
import type { DecompileTransactionMessageFetchingLookupTablesConfig } from '../../sdk-extensions/codecs';
import { fromTransactionToBase64String } from '../../sdk-extensions/codecs';
import { addressToCaip10 } from '../../utils/addressToCaip10';
import { deriveSolanaKeypair } from '../../utils/deriveSolanaKeypair';
import { getSolanaExplorerUrl } from '../../utils/getSolanaExplorerUrl';
import type { ILogger } from '../../utils/logger';
import logger from '../../utils/logger';
import {
  Base58Struct,
  Base64Struct,
  NetworkStruct,
} from '../../validation/structs';
import type { SolanaConnection } from '../connection';
import type { TransactionHelper } from '../execution/TransactionHelper';
import { mapRpcTransaction } from '../transactions/utils/mapRpcTransaction';
import type {
  SolanaSignAndSendTransactionOptions,
  SolanaSignAndSendTransactionResponse,
  SolanaSignInRequest,
  SolanaWalletRequest,
} from './structs';
import {
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
  readonly #connection: SolanaConnection;

  readonly #transactionHelper: TransactionHelper;

  readonly #logger: ILogger;

  constructor(
    connection: SolanaConnection,
    transactionHelper: TransactionHelper,
    _logger = logger,
  ) {
    this.#connection = connection;
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
   * For a detailed visual representation of the transaction signing flow, see the
   * [transaction signing flow diagram](./img/transaction-signing-flow.png).
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
    eventEmitter.emit('onStart', request);

    assert(request.request, SolanaSignTransactionRequestStruct);
    assert(request.scope, NetworkStruct);

    const { transaction, scope, options } = request.request.params;

    const config: DecompileTransactionMessageFetchingLookupTablesConfig =
      options?.minContextSlot
        ? {
            minContextSlot: BigInt(options.minContextSlot),
          }
        : undefined;

    const partiallySignedTransaction =
      await this.#transactionHelper.partiallySignBase64String(
        transaction,
        account,
        scope,
        config,
      );

    const signedTransactionBase64 = fromTransactionToBase64String(
      partiallySignedTransaction,
    );

    const result = {
      signedTransaction: signedTransactionBase64,
    };

    assert(result, SolanaSignTransactionResponseStruct);

    // TODO: This is a temporary fix to ensure that transactions signed by the
    // extension but sent by a dApp, which is a common pattern in Solana, are
    // found faster and added to the ActivityList. If we don't do this, users
    // will have their transaction sent but will have to wait for the cronjob.

    await snap.request({
      method: 'snap_scheduleBackgroundEvent',
      params: {
        duration: 'PT3S',
        request: {
          method: ScheduleBackgroundEventMethod.OnSignTransaction,
          params: {
            accountId: account.id,
          },
        },
      },
    });

    return result;
  }

  /**
   * Signs and sends a transaction.
   *
   * @param account - The account to sign and send the transaction.
   * @param transactionMessageBase64Encoded - The transaction message base64 encoded.
   * @param scope - The scope of the transaction.
   * @param origin - The origin of the transaction.
   * @param options - The options for the transaction.
   * @param options.minContextSlot - The minimum context slot.
   * @param options.preflightCommitment - The preflight commitment.
   * @param options.maxRetries - The maximum number of retries.
   * @param options.commitment - The commitment.
   * @returns A Promise that resolves to the signed transaction.
   */
  async signAndSendTransaction(
    account: SolanaKeyringAccount,
    transactionMessageBase64Encoded: string,
    scope: Network,
    origin: string,
    options?: SolanaSignAndSendTransactionOptions,
  ): Promise<SolanaSignAndSendTransactionResponse> {
    const signConfig: DecompileTransactionMessageFetchingLookupTablesConfig =
      options?.minContextSlot
        ? {
            minContextSlot: BigInt(options.minContextSlot),
          }
        : undefined;

    const partiallySignedTransaction =
      await this.#transactionHelper.partiallySignBase64String(
        transactionMessageBase64Encoded,
        account,
        scope,
        signConfig,
      );

    const signature = getSignatureFromTransaction(partiallySignedTransaction);

    const rpc = this.#connection.getRpc(scope);

    const sendTransactionWithoutConfirming =
      sendTransactionWithoutConfirmingFactory({
        rpc,
      });

    const explorerUrl = getSolanaExplorerUrl(scope, 'tx', signature);
    this.#logger.info(`Sending transaction: ${explorerUrl}`);

    assertTransactionIsFullySigned(partiallySignedTransaction);

    const sendConfig = {
      ...(options?.preflightCommitment
        ? { preflightCommitment: options.preflightCommitment }
        : {}),
      ...(options?.minContextSlot
        ? { minContextSlot: BigInt(options.minContextSlot) }
        : {}),
      ...(options?.maxRetries
        ? { maxRetries: BigInt(options.maxRetries) }
        : {}),
      // Set to 'confirmed' as required to be defined, but ignored by sendTransactionWithoutConfirming.
      // This is because RPC Subscriptions rely on websockets, which are unavailable in the Snap environment.
      // We compensate for this with `waitForTransactionCommitment`.
      commitment: 'confirmed' as Commitment,
      skipPreflight: true,
    };

    await sendTransactionWithoutConfirming(
      partiallySignedTransaction,
      sendConfig,
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
            transactionMessageBase64Encoded,
            signature,
            metadata: {
              scope,
              origin,
            },
          },
        },
      },
    });

    const result = {
      signature,
    };

    assert(result, SolanaSignAndSendTransactionResponseStruct);

    /**
     * If the commitment is `processed`, we default to `confirmed`.
     * This is because we poll the RPC with `getTransaction` to check if the
     * transaction has been confirmed, and this method does not support
     * `processed` as a commitment. A solution would have been to simply not
     * wait when `processed` is provided, but this would prevents us from
     * fetching the transaction, mapping it, and triggering all the related
     * side effects.
     *
     * If the commitment is not provided, we default to `confirmed`.
     */
    const commitment =
      !options?.commitment || options?.commitment === 'processed'
        ? 'confirmed'
        : options?.commitment;

    const transaction =
      await this.#transactionHelper.waitForTransactionCommitment(
        signature,
        commitment,
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
            metadata: {
              scope,
              origin,
            },
          },
        },
      },
    });

    return result;
  }

  /**
   * Signs the provided base64 encoded message using the provided account's
   * private key.
   *
   * It DOES NOT decode the message to UTF-8 before signing, meaning that the
   * signature must be verified using the base64 encoded message as well.
   *
   * You can then verify the signature with {@link WalletService.verifySignature}.
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
    eventEmitter.emit('onTestSubscription', request);

    assert(request.request, SolanaSignMessageRequestStruct);

    // message is base64 encoded
    const { message } = request.request.params;
    const messageBytes = getBase64Codec().encode(message);
    const messageUtf8 = getUtf8Codec().decode(messageBytes);

    const { privateKeyBytes } = await deriveSolanaKeypair({
      entropySource: account.entropySource,
      derivationPath: account.derivationPath,
    });

    const signer =
      await createKeyPairSignerFromPrivateKeyBytes(privateKeyBytes);

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
   * using `JSON.stringify()`, then signs the message.
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

    const messageUtf8 = this.#formatSignInMessage(params);
    const messageBytes = getUtf8Codec().encode(messageUtf8);
    const messageBase64 = getBase64Codec().decode(messageBytes);

    const requestForSignMessage: KeyringRequest = {
      id: globalThis.crypto.randomUUID(),
      scope: request.scope,
      account: account.id,
      origin: request.origin,
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

    const { privateKeyBytes } = await deriveSolanaKeypair({
      entropySource: account.entropySource,
      derivationPath: account.derivationPath,
    });

    const signer =
      await createKeyPairSignerFromPrivateKeyBytes(privateKeyBytes);

    const signatureBytes = getBase58Codec().encode(
      signatureBase58,
    ) as SignatureBytes;

    const messageBytes = getBase64Codec().encode(messageBase64);

    const verified = await verifySignature(
      signer.keyPair.publicKey,
      signatureBytes,
      messageBytes,
    );

    return verified;
  }

  /**
   * Formats a Solana Sign-In message into a string.
   *
   * @param signInParams - The sign-in message parameters.
   * @returns The formatted message as a string.
   */
  #formatSignInMessage(signInParams: SolanaSignInRequest['params']): string {
    // ${domain} wants you to sign in with your Solana account:
    // ${address}
    //
    // ${statement}
    //
    // URI: ${uri}
    // Version: ${version}
    // Chain ID: ${chain}
    // Nonce: ${nonce}
    // Issued At: ${issued-at}
    // Expiration Time: ${expiration-time}
    // Not Before: ${not-before}
    // Request ID: ${request-id}
    // Resources:
    // - ${resources[0]}
    // - ${resources[1]}
    // ...
    // - ${resources[n]}

    let message = `${signInParams.domain} wants you to sign in with your Solana account:\n`;
    message += `${signInParams.address}`;

    if (signInParams.statement) {
      message += `\n\n${signInParams.statement}`;
    }

    const fields: string[] = [];
    if (signInParams.uri) {
      fields.push(`URI: ${signInParams.uri}`);
    }
    if (signInParams.version) {
      fields.push(`Version: ${signInParams.version}`);
    }
    if (signInParams.chainId) {
      fields.push(`Chain ID: ${signInParams.chainId}`);
    }
    if (signInParams.nonce) {
      fields.push(`Nonce: ${signInParams.nonce}`);
    }
    if (signInParams.issuedAt) {
      fields.push(`Issued At: ${signInParams.issuedAt}`);
    }
    if (signInParams.expirationTime) {
      fields.push(`Expiration Time: ${signInParams.expirationTime}`);
    }
    if (signInParams.notBefore) {
      fields.push(`Not Before: ${signInParams.notBefore}`);
    }
    if (signInParams.requestId) {
      fields.push(`Request ID: ${signInParams.requestId}`);
    }
    if (signInParams.resources) {
      fields.push(`Resources:`);
      for (const resource of signInParams.resources) {
        fields.push(`- ${resource}`);
      }
    }
    if (fields.length) {
      message += `\n\n${fields.join('\n')}`;
    }

    return message;
  }
}
