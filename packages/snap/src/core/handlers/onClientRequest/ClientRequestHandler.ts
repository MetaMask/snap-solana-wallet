import { FeeType } from '@metamask/keyring-api';
import {
  InvalidParamsError,
  MethodNotFoundError,
  type Json,
  type JsonRpcRequest,
} from '@metamask/snaps-sdk';
import { assert } from '@metamask/superstruct';

import { METAMASK_ORIGIN, Networks } from '../../constants/solana';
import type { TransactionHelper } from '../../services/execution/TransactionHelper';
import type { SendService } from '../../services/send/SendService';
import type { WalletService } from '../../services/wallet/WalletService';
import { lamportsToSol } from '../../utils/conversion';
import { createPrefixedLogger, type ILogger } from '../../utils/logger';
import type { SolanaKeyring } from '../onKeyringRequest/Keyring';
import { ClientRequestMethod } from './types';
import {
  ComputeFeeRequestStruct,
  type ComputeFeeResponse,
  ComputeFeeResponseStruct,
  OnAddressInputRequestStruct,
  OnAmountInputRequestStruct,
  OnConfirmSendRequestStruct,
  SignAndSendTransactionRequestStruct,
  type SignAndSendTransactionResponse,
  SignAndSendTransactionResponseStruct,
  SignAndSendTransactionWithoutConfirmationRequestStruct,
  ValidationResponseStruct,
} from './validation';

export class ClientRequestHandler {
  readonly #keyring: SolanaKeyring;

  readonly #walletService: WalletService;

  readonly #logger: ILogger;

  readonly #sendService: SendService;

  readonly #transactionHelper: TransactionHelper;

  constructor(
    keyring: SolanaKeyring,
    walletService: WalletService,
    logger: ILogger,
    sendService: SendService,
    transactionHelper: TransactionHelper,
  ) {
    this.#keyring = keyring;
    this.#walletService = walletService;
    this.#logger = createPrefixedLogger(logger, '[👋 ClientRequestHandler]');
    this.#sendService = sendService;
    this.#transactionHelper = transactionHelper;
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
      default:
        throw new MethodNotFoundError() as Error;
    }
  }

  /**
   * Handles signing and sending a transaction without confirmation.
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

    const allAccounts = await this.#keyring.listAccounts();
    const account = allAccounts.find((item) => item.address === address);
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

    const account = await this.#keyring.getAccountOrThrow(accountId);

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

    const value =
      await this.#transactionHelper.getFeeFromBase64StringInLamports(
        transaction,
        scope,
      );

    if (value === null) {
      throw new Error('Failed to get fee for transaction');
    }

    const result: ComputeFeeResponse = [
      {
        type: FeeType.Base,
        asset: {
          unit: Networks[scope].nativeToken.symbol,
          type: Networks[scope].nativeToken.caip19Id,
          amount: lamportsToSol(value).toString(),
          fungible: true,
        },
      },
    ];

    assert(result, ComputeFeeResponseStruct);

    return result;
  }

  /**
   * Handles the input of an address.
   * @param request - The JSON-RPC request containing the method and parameters.
   * @returns The response to the JSON-RPC request.
   * @throws {InvalidParamsError} If the params are invalid.
   */
  async #handleOnAddressInput(request: JsonRpcRequest): Promise<Json> {
    try {
      assert(request, OnAddressInputRequestStruct);
    } catch (error) {
      const errorToThrow = new InvalidParamsError() as Error;
      errorToThrow.cause = error;
      throw errorToThrow;
    }

    const result = await this.#sendService.onAddressInput(request);

    assert(result, ValidationResponseStruct);

    return result;
  }

  /**
   * Handles the input of an amount.
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
}
