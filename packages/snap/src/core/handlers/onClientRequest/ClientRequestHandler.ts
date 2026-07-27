import { FeeType } from '@metamask/keyring-api';
import { InvalidParamsError, MethodNotFoundError } from '@metamask/snaps-sdk';
import type { Json, JsonRpcRequest } from '@metamask/snaps-sdk';
import { assert, create } from '@metamask/superstruct';
import { bytesToHex } from '@metamask/utils';
import {
  address as asAddress,
  compileTransaction,
  getBase58Codec,
  getBase64Codec,
  getUtf8Codec,
  pipe,
} from '@solana/kit';

import { METAMASK_ORIGIN, Networks } from '../../constants/solana';
import type { Network } from '../../constants/solana';
import { FeeCalculator } from '../../fees';
import { fromTransactionToBase64String } from '../../sdk-extensions/codecs';
import type { AccountsService, ApproveTokenService } from '../../services';
import type { SendService } from '../../services/send/SendService';
import type { OnAddressInputRequest } from '../../services/send/types';
import type { WalletService } from '../../services/wallet/WalletService';
import { lamportsToSol } from '../../utils/conversion';
import { createPrefixedLogger } from '../../utils/logger';
import type { ILogger } from '../../utils/logger';
import { ClientRequestMethod } from './types';
import {
  ApproveCardAmountRequestStruct,
  ApproveCardAmountResponseStruct,
  ComputeFeeRequestStruct,
  ComputeFeeResponseStruct,
  OnAddressInputRequestStruct,
  OnAmountInputRequestStruct,
  OnConfirmSendRequestStruct,
  parseCardMessage,
  parseProofOfOwnershipMessage,
  parseRewardsMessage,
  SignAndSendTransactionRequestStruct,
  SignAndSendTransactionResponseStruct,
  SignAndSendTransactionWithoutConfirmationRequestStruct,
  SignCardMessageRequestStruct,
  SignProofOfOwnershipRequestStruct,
  SignProofOfOwnershipResponseStruct,
  SignRewardsMessageRequestStruct,
  ValidationResponseStruct,
} from './validation';
import type {
  ComputeFeeResponse,
  SignAndSendTransactionResponse,
  SignProofOfOwnershipResponse,
} from './validation';

export class ClientRequestHandler {
  readonly #accountsService: AccountsService;

  readonly #walletService: WalletService;

  readonly #logger: ILogger;

  readonly #sendService: SendService;

  readonly #approveTokenService: ApproveTokenService;

  constructor(
    accountsService: AccountsService,
    walletService: WalletService,
    logger: ILogger,
    sendService: SendService,
    approveTokenService: ApproveTokenService,
  ) {
    this.#accountsService = accountsService;
    this.#walletService = walletService;
    this.#logger = createPrefixedLogger(logger, '[👋 ClientRequestHandler]');
    this.#sendService = sendService;
    this.#approveTokenService = approveTokenService;
  }

  /**
   * Handles JSON-RPC requests originating exclusively from the client - as defined in [SIP-31](https://github.com/MetaMask/SIPs/blob/main/SIPS/sip-31.md) -
   * by routing them to the appropriate use case, based on the method.
   *
   * @param request - The JSON-RPC request containing the method and parameters.
   * @returns The response to the JSON-RPC request.
   * @throws {MethodNotFoundError} If the method is not found.
   * @throws {InvalidParamsError} If the params are invalid.
   */
  async handle(request: JsonRpcRequest): Promise<Json> {
    this.#logger.log('Handling client request', request);

    const { method } = request;

    switch (method) {
      // TODO: Deprecate this method in the next major version
      case ClientRequestMethod.SignAndSendTransactionWithoutConfirmation:
        return this.#handleSignAndSendWithoutConfirmation(request);

      case ClientRequestMethod.ConfirmSend:
        return this.#handleConfirmSend(request);
      case ClientRequestMethod.SignAndSendTransaction:
        return this.#handleSignAndSendTransaction(request);
      case ClientRequestMethod.ComputeFee:
        return this.#handleComputeFee(request);
      case ClientRequestMethod.OnAddressInput:
        return this.#handleOnAddressInput(request);
      case ClientRequestMethod.OnAmountInput:
        return this.#handleOnAmountInput(request);
      case ClientRequestMethod.SignRewardsMessage:
        return this.#handleSignRewardsMessage(request);
      case ClientRequestMethod.SignCardMessage:
        return this.#handleSignCardMessage(request);
      case ClientRequestMethod.ApproveCardAmount:
        return this.#handleApproveCardAmount(request);
      case ClientRequestMethod.SignProofOfOwnership:
        return this.#handleSignProofOfOwnership(request);
      default:
        throw new MethodNotFoundError() as Error;
    }
  }

  /**
   * Handles signing and sending a transaction without confirmation.
   *
   * @param request - The JSON-RPC request containing the method and parameters.
   * @returns The response to the JSON-RPC request.
   * @throws {InvalidParamsError} If the params are invalid.
   * @deprecated
   */
  async #handleSignAndSendWithoutConfirmation(
    request: JsonRpcRequest,
  ): Promise<Json> {
    try {
      assert(request, SignAndSendTransactionWithoutConfirmationRequestStruct);
    } catch (error) {
      const errorToThrow = new InvalidParamsError() as Error;
      errorToThrow.cause = error;
      throw errorToThrow;
    }

    const {
      params: {
        transaction: base64EncodedTransaction,
        options,
        account: { address },
        scope,
      },
    } = request;

    const account = await this.#accountsService.findByAddress(address);
    if (!account) {
      throw new InvalidParamsError(`Account not found: ${address}`) as Error;
    }

    return this.#walletService.signAndSendTransaction(
      account,
      base64EncodedTransaction,
      scope,
      METAMASK_ORIGIN,
      options,
    );
  }

  async #handleSignAndSendTransaction(request: JsonRpcRequest): Promise<Json> {
    try {
      assert(request, SignAndSendTransactionRequestStruct);
    } catch (error) {
      const errorToThrow = new InvalidParamsError() as Error;
      errorToThrow.cause = error;
      throw errorToThrow;
    }

    const {
      params: {
        transaction: base64EncodedTransaction,
        options,
        accountId,
        scope,
      },
    } = request;

    const account = await this.#accountsService.findById(accountId);
    if (!account) {
      throw new InvalidParamsError(`Account not found: ${accountId}`) as Error;
    }

    const { signature } = await this.#walletService.signAndSendTransaction(
      account,
      base64EncodedTransaction,
      scope,
      METAMASK_ORIGIN,
      options,
    );

    const result: SignAndSendTransactionResponse = {
      transactionId: signature,
    };

    assert(result, SignAndSendTransactionResponseStruct);

    return result;
  }

  /**
   * Handles the confirmation of a send transaction.
   *
   * @param request - The JSON-RPC request containing the method and parameters.
   * @returns The response to the JSON-RPC request.
   * @throws {InvalidParamsError} If the params are invalid.
   */
  async #handleConfirmSend(request: JsonRpcRequest): Promise<Json> {
    try {
      assert(request, OnConfirmSendRequestStruct);
    } catch (error) {
      const errorToThrow = new InvalidParamsError() as Error;
      errorToThrow.cause = error;
      throw errorToThrow;
    }
    const result = await this.#sendService.confirmSend(request);

    return result;
  }

  /**
   * Handles the computation of a fee for a transaction.
   *
   * @param request - The JSON-RPC request containing the method and parameters.
   * @returns The response to the JSON-RPC request.
   * @throws {InvalidParamsError} If the params are invalid.
   */
  async #handleComputeFee(request: JsonRpcRequest): Promise<Json> {
    try {
      assert(request, ComputeFeeRequestStruct);
    } catch (error) {
      const errorToThrow = new InvalidParamsError() as Error;
      errorToThrow.cause = error;
      throw errorToThrow;
    }

    const {
      params: { transaction, scope },
    } = request;

    const { baseFee, priorityFee } = FeeCalculator.calculateFee(transaction);

    const units = Networks[scope].nativeToken.symbol;
    const type = Networks[scope].nativeToken.caip19Id;

    const result: ComputeFeeResponse = [
      {
        type: FeeType.Base,
        asset: {
          unit: units,
          type,
          amount: lamportsToSol(baseFee).toString(),
          fungible: true,
        },
      },
      {
        type: FeeType.Priority,
        asset: {
          unit: units,
          type,
          amount: lamportsToSol(priorityFee).toString(),
          fungible: true,
        },
      },
    ];

    assert(result, ComputeFeeResponseStruct);

    return result;
  }

  /**
   * Handles the input of an address.
   *
   * @param request - The JSON-RPC request containing the method and parameters.
   * @returns The response to the JSON-RPC request.
   * @throws {InvalidParamsError} If the params are invalid.
   */
  async #handleOnAddressInput(request: JsonRpcRequest): Promise<Json> {
    let parsed: OnAddressInputRequest;
    try {
      parsed = create(request, OnAddressInputRequestStruct);
    } catch (error) {
      const errorToThrow = new InvalidParamsError() as Error;
      errorToThrow.cause = error;
      throw errorToThrow;
    }

    const {
      params: { value, scope },
    } = parsed;
    const result = await this.#sendService.onAddressInput(value, scope);

    assert(result, ValidationResponseStruct);

    return result;
  }

  /**
   * Handles the input of an amount.
   *
   * @param request - The JSON-RPC request containing the method and parameters.
   * @returns The response to the JSON-RPC request.
   * @throws {InvalidParamsError} If the params are invalid.
   */
  async #handleOnAmountInput(request: JsonRpcRequest): Promise<Json> {
    try {
      assert(request, OnAmountInputRequestStruct);
    } catch (error) {
      const errorToThrow = new InvalidParamsError() as Error;
      errorToThrow.cause = error;
      throw errorToThrow;
    }

    const result = await this.#sendService.onAmountInput(request);

    assert(result, ValidationResponseStruct);

    return result;
  }

  /**
   * Handles the signing of a rewards message, of format `'rewards,{address},{timestamp}'` base64 encoded.
   *
   * @param request - The JSON-RPC request containing the method and parameters.
   * @returns The response to the JSON-RPC request.
   * @throws {InvalidParamsError} If the account is not found or if the address in the message doesn't match the signing account.
   */
  async #handleSignRewardsMessage(request: JsonRpcRequest): Promise<Json> {
    assert(request, SignRewardsMessageRequestStruct);

    const {
      params: { accountId, message },
    } = request;

    const account = await this.#accountsService.findById(accountId);
    if (!account) {
      throw new InvalidParamsError(`Account not found: ${accountId}`) as Error;
    }

    // Parse the rewards message to extract the address
    const { address: messageAddress } = parseRewardsMessage(message);

    // Validate that the address in the message matches the signing account
    if (messageAddress !== account.address) {
      throw new InvalidParamsError(
        `Address in rewards message (${messageAddress}) does not match signing account address (${account.address})`,
      ) as Error;
    }

    const result = await this.#walletService.signMessage(account, message);

    return result;
  }

  /**
   * Handles the signing of a card message in SIWS (Sign-In with Solana) format.
   *
   * @param request - The JSON-RPC request containing the method and parameters.
   * @returns The response to the JSON-RPC request.
   * @throws {InvalidParamsError} If the account is not found or if the address in the message doesn't match the signing account.
   */
  async #handleSignCardMessage(request: JsonRpcRequest): Promise<Json> {
    try {
      assert(request, SignCardMessageRequestStruct);
    } catch (error) {
      const errorToThrow = new InvalidParamsError() as Error;
      errorToThrow.cause = error;
      throw errorToThrow;
    }

    const {
      params: { accountId, message },
    } = request;

    const account = await this.#accountsService.findById(accountId);
    if (!account) {
      throw new InvalidParamsError(`Account not found: ${accountId}`) as Error;
    }

    // Parse the card message to extract the address
    const { address: messageAddress } = parseCardMessage(message);

    // Validate that the address in the message matches the signing account
    if (messageAddress !== account.address) {
      throw new InvalidParamsError(
        `Address in card message (${messageAddress}) does not match signing account address (${account.address})`,
      ) as Error;
    }

    const result = await this.#walletService.signMessage(account, message);

    return result;
  }

  /**
   * Handles the approval of a card amount by creating and signing a token approval transaction.
   * This creates an SPL token `approve` instruction that allows the delegate to spend tokens
   * from the user's associated token account.
   *
   * @param request - The JSON-RPC request containing the method and parameters.
   * @returns The response containing the transaction ID.
   * @throws {InvalidParamsError} If the account is not found or params are invalid.
   */
  async #handleApproveCardAmount(request: JsonRpcRequest): Promise<Json> {
    try {
      assert(request, ApproveCardAmountRequestStruct);
    } catch (error) {
      const errorToThrow = new InvalidParamsError() as Error;
      errorToThrow.cause = error;
      throw errorToThrow;
    }

    const {
      params: { accountId, amount, mint, delegate, scope },
    } = request;

    const account = await this.#accountsService.findById(accountId);
    if (!account) {
      throw new InvalidParamsError(`Account not found: ${accountId}`) as Error;
    }

    const network = scope;

    // Build the approval transaction message using the service
    const transactionMessage =
      await this.#approveTokenService.buildApprovalTransactionMessage({
        account,
        mint: asAddress(mint),
        delegate: asAddress(delegate),
        amount,
        network,
      });

    // Compile and encode the transaction
    const transaction = compileTransaction(transactionMessage);
    const base64EncodedTransaction = fromTransactionToBase64String(transaction);

    // Sign and send the transaction
    const { signature } = await this.#walletService.signAndSendTransaction(
      account,
      base64EncodedTransaction,
      network,
      METAMASK_ORIGIN,
    );

    const result = { signature };

    assert(result, ApproveCardAmountResponseStruct);

    return result;
  }

  /**
   * Handles the silent signing of a proof-of-ownership message, of format `'metamask:proof-of-ownership:{nonce}:{address}'`.
   * Used by `@metamask/profile-metrics-controller` to prove wallet control of an address; no user prompt, gated to the `metamask` origin (see `metamaskPermissions`) and bound to the message prefix.
   *
   * @param request - The JSON-RPC request containing the method and parameters.
   * @returns The response to the JSON-RPC request.
   * @throws {InvalidParamsError} If the account is not found or if the address in the message doesn't match the signing account.
   */
  async #handleSignProofOfOwnership(request: JsonRpcRequest): Promise<Json> {
    assert(request, SignProofOfOwnershipRequestStruct);

    const {
      params: { accountId, message },
    } = request;

    const account = await this.#accountsService.findById(accountId);
    if (!account) {
      throw new InvalidParamsError(`Account not found: ${accountId}`) as Error;
    }

    // Parse the proof-of-ownership message to extract the address
    const { address: messageAddress } = parseProofOfOwnershipMessage(message);

    // Validate that the address in the message matches the signing account
    if (messageAddress !== account.address) {
      throw new InvalidParamsError(
        `Address in proof-of-ownership message (${messageAddress}) does not match signing account address (${account.address})`,
      ) as Error;
    }

    // `WalletService.signMessage` expects a base64-encoded message
    const base64Message = pipe(
      message,
      getUtf8Codec().encode,
      getBase64Codec().decode,
    );

    const { signature: base58Signature } =
      await this.#walletService.signMessage(account, base64Message);

    // Transcode the base58 signature to 0x-prefixed hex for the identity
    // auth API; the dApp `signMessage` flow keeps its wallet-standard base58.
    const signature = bytesToHex(
      Uint8Array.from(getBase58Codec().encode(base58Signature)),
    );

    const result: SignProofOfOwnershipResponse = { signature };

    assert(result, SignProofOfOwnershipResponseStruct);

    return result;
  }
}
