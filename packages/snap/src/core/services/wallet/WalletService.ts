/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { SolMethod } from '@metamask/keyring-api';
import type { Infer } from '@metamask/superstruct';
import { assert, instance, object } from '@metamask/superstruct';
import type { Commitment, SignatureBytes } from '@solana/kit';
import {
  address as asAddress,
  assertTransactionIsFullySigned,
  createKeyPairSignerFromPrivateKeyBytes,
  createSignableMessage,
  createSolanaRpcFromTransport,
  getBase58Codec,
  getBase58Decoder,
  getBase64Codec,
  getSignatureFromTransaction,
  getUtf8Codec,
  sendTransactionWithoutConfirmingFactory,
  verifySignature,
} from '@solana/kit';

import type { SolanaKeyringAccount } from '../../../entities';
import type { Caip10Address, Network } from '../../constants/solana';
import type { DecompileTransactionMessageFetchingLookupTablesConfig } from '../../sdk-extensions/codecs';
import { fromTransactionToBase64String } from '../../sdk-extensions/codecs';
import { addressToCaip10 } from '../../utils/addressToCaip10';
import { deriveSolanaKeypair } from '../../utils/deriveSolanaKeypair';
import { getSolanaExplorerUrl } from '../../utils/getSolanaExplorerUrl';
import type { ILogger } from '../../utils/logger';
import logger, { createPrefixedLogger } from '../../utils/logger';
import { Base58Struct, Base64Struct } from '../../validation/structs';
import type { AnalyticsService } from '../analytics/AnalyticsService';
import type { SolanaConnection } from '../connection';
import { createMainTransport } from '../connection/transport';
import type { Signer } from '../signer/Signer';
import type { SignatureMonitor } from '../subscriptions';
import type {
  SolanaSignAndSendTransactionOptions,
  SolanaSignAndSendTransactionResponse,
  SolanaSignInRequest,
  SolanaSignTransactionOptions,
  SolanaWalletRequest,
} from './structs';
import {
  SolanaSignAndSendTransactionResponseStruct,
  type SolanaSignInResponse,
  SolanaSignInResponseStruct,
  type SolanaSignMessageResponse,
  SolanaSignMessageResponseStruct,
  type SolanaSignTransactionResponse,
  SolanaSignTransactionResponseStruct,
} from './structs';

export class WalletService {
  readonly #connection: SolanaConnection;

  readonly #signer: Signer;

  readonly #signatureMonitor: SignatureMonitor;

  readonly #analyticsService: AnalyticsService;

  readonly #logger: ILogger;

  constructor(
    connection: SolanaConnection,
    signer: Signer,
    signatureMonitor: SignatureMonitor,
    analyticsService: AnalyticsService,
    _logger = logger,
  ) {
    this.#connection = connection;
    this.#signer = signer;
    this.#signatureMonitor = signatureMonitor;
    this.#analyticsService = analyticsService;
    this.#logger = createPrefixedLogger(_logger, '[👛 WalletService]');
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
    this.#logger.log('Resolving account address', {
      keyringAccounts,
      scope,
      request,
    });

    const { method, params } = request;

    const accountsWithThisScope = keyringAccounts.filter((account) =>
      account.scopes.includes(scope),
    );

    if (accountsWithThisScope.length === 0) {
      throw new Error('No accounts with this scope');
    }

    let addressToValidate: string;

    switch (method) {
      case SolMethod.SignIn: {
        const { address } = params;
        if (!address) {
          throw new Error('No address');
        }
        addressToValidate = address;
        break;
      }
      case SolMethod.SignAndSendTransaction:
      case SolMethod.SignMessage:
      case SolMethod.SignTransaction: {
        const { account } = params;
        addressToValidate = account.address;
        break;
      }
      default: {
        // This code is unreachable because the "validateRequest" function
        // already protects against invalid methods.
        this.#logger.warn({ method }, 'Unsupported method');
        throw new Error('Unsupported method');
      }
    }

    const foundAccount = accountsWithThisScope.find(
      (a) => a.address === addressToValidate,
    );

    if (!foundAccount) {
      throw new Error('Account not found');
    }

    return addressToCaip10(scope, addressToValidate);
  }

  /**
   * Signs a transaction.
   *
   * For a detailed visual representation of the transaction signing flow, see the
   * [transaction signing flow diagram](./img/transaction-signing-flow.png).
   *
   * @param account - The account to sign the transaction.
   * @param transaction - The transaction to sign.
   * @param scope - The scope of the transaction.
   * @param origin - The origin of the transaction.
   * @param options - The options for the transaction.
   * @returns A Promise that resolves to the signed transaction.
   */
  async signTransaction(
    account: SolanaKeyringAccount,
    transaction: string,
    scope: Network,
    origin: string,
    options?: SolanaSignTransactionOptions,
  ): Promise<SolanaSignTransactionResponse> {
    this.#logger.log('Signing transaction', {
      account,
      transaction,
      scope,
      options,
    });

    const config: DecompileTransactionMessageFetchingLookupTablesConfig =
      options?.minContextSlot
        ? {
            minContextSlot: BigInt(options.minContextSlot),
          }
        : undefined;

    const partiallySignedTransaction =
      await this.#signer.partiallySignBase64String(
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

    // If the transaction is fully signed, we can monitor it.
    try {
      assertTransactionIsFullySigned(partiallySignedTransaction);
      const signature = getSignatureFromTransaction(partiallySignedTransaction);
      await this.#signatureMonitor.monitor(
        signature,
        account.id,
        'confirmed',
        scope,
        origin,
      );
    } catch (error) {
      this.#logger.warn(
        'Transaction is not fully signed, skipping monitoring',
        {
          error,
        },
      );
    }

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
    this.#logger.log('Signing and sending transaction', account);

    const signConfig: DecompileTransactionMessageFetchingLookupTablesConfig =
      options?.minContextSlot
        ? {
            minContextSlot: BigInt(options.minContextSlot),
          }
        : undefined;

    const partiallySignedTransaction =
      await this.#signer.partiallySignBase64String(
        transactionMessageBase64Encoded,
        account,
        scope,
        signConfig,
      );

    const signature = getSignatureFromTransaction(partiallySignedTransaction);

    // eslint-disable-next-line no-restricted-globals -- injected at build time via snap.config.ts / .env
    const sendTransactionRpcUrl = process.env.SEND_TRANSACTION_RPC_URL?.trim();
    const rpc = sendTransactionRpcUrl
      ? createSolanaRpcFromTransport(
          createMainTransport([sendTransactionRpcUrl]),
        )
      : this.#connection.getRpc(scope);

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
      skipPreflight: options?.skipPreflight ?? true,
      // Set to 'confirmed' as required to be defined, but ignored by sendTransactionWithoutConfirming.
      // This is because RPC Subscriptions rely on websockets, which are unavailable in the Snap environment.
      // We compensate for this with `waitForTransactionCommitment`.
      commitment: 'confirmed' as Commitment,
    };

    await sendTransactionWithoutConfirming(
      partiallySignedTransaction,
      sendConfig,
    );

    await this.#analyticsService.trackEventTransactionSubmitted(
      account,
      signature,
      { scope, origin },
    );

    await this.#signatureMonitor.monitor(
      signature,
      account.id,
      options?.commitment ?? 'confirmed',
      scope,
      origin,
    );

    const result = {
      signature,
    };
    assert(result, SolanaSignAndSendTransactionResponseStruct);
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
   * @param message - The message to sign.
   * @returns A Promise that resolves to the signed message.
   */
  async signMessage(
    account: SolanaKeyringAccount,
    message: string,
  ): Promise<SolanaSignMessageResponse> {
    this.#logger.log('Signing message', account, message);

    const { address, entropySource, derivationPath } = account;
    const addressAsAddress = asAddress(address);
    const messageBytes = getBase64Codec().encode(message);
    const messageUtf8 = getUtf8Codec().decode(messageBytes);
    const signableMessage = createSignableMessage(messageUtf8);

    const { privateKeyBytes } = await deriveSolanaKeypair({
      entropySource,
      derivationPath,
    });

    const signer =
      await createKeyPairSignerFromPrivateKeyBytes(privateKeyBytes);

    const [messageSignatureBytesMap] = await signer.signMessages([
      signableMessage,
    ]);

    // Equivalent to - but more compact than - an undefined check + throw error
    assert(messageSignatureBytesMap, object());

    const messageSignatureBytes = messageSignatureBytesMap[addressAsAddress];

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
   * @param params - A sign in intent object that contains data like domain, or uri.
   * @returns A Promise that resolves to the signed message.
   * @throws If the request is invalid.
   */
  async signIn(
    account: SolanaKeyringAccount,
    params: SolanaSignInRequest['params'],
  ): Promise<SolanaSignInResponse> {
    this.#logger.log('Signing in', account, params);

    const { address } = account;
    const messageUtf8 = this.#formatSignInMessage(params);
    const messageBytes = getUtf8Codec().encode(messageUtf8);
    const messageBase64 = getBase64Codec().decode(messageBytes);

    const signMessageResponse = await this.signMessage(account, messageBase64);

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
    this.#logger.log('Verifying signature', {
      account,
      signatureBase58,
      messageBase64,
    });

    assert(signatureBase58, Base58Struct);
    assert(messageBase64, Base64Struct);

    const signatureBytes = getBase58Codec().encode(
      signatureBase58,
    ) as SignatureBytes;
    const messageBytes = getBase64Codec().encode(messageBase64);

    const { privateKeyBytes } = await deriveSolanaKeypair({
      entropySource: account.entropySource,
      derivationPath: account.derivationPath,
    });

    const signer =
      await createKeyPairSignerFromPrivateKeyBytes(privateKeyBytes);

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

    const {
      domain,
      address,
      statement,
      uri,
      version,
      chainId,
      nonce,
      issuedAt,
      expirationTime,
      notBefore,
      requestId,
      resources,
    } = signInParams;

    // The inputs are already sanitized by the struct validation
    // So there is no need to sanitize again here
    let message = `${domain ?? ''} wants you to sign in with your Solana account:\n`;
    message += `${address ?? ''}`;

    if (statement) {
      message += `\n\n${statement}`;
    }

    const fields: string[] = [];
    if (uri) {
      fields.push(`URI: ${uri}`);
    }
    if (version) {
      fields.push(`Version: ${version}`);
    }
    if (chainId) {
      fields.push(`Chain ID: ${chainId}`);
    }
    if (nonce) {
      fields.push(`Nonce: ${nonce}`);
    }
    if (issuedAt) {
      fields.push(`Issued At: ${issuedAt}`);
    }
    if (expirationTime) {
      fields.push(`Expiration Time: ${expirationTime}`);
    }
    if (notBefore) {
      fields.push(`Not Before: ${notBefore}`);
    }
    if (requestId) {
      fields.push(`Request ID: ${requestId}`);
    }
    if (resources && resources.length > 0) {
      fields.push(`Resources:`);
      for (const resource of resources) {
        fields.push(`- ${resource}`);
      }
    }
    if (fields.length) {
      message += `\n\n${fields.join('\n')}`;
    }

    return message;
  }
}
