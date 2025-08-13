import {
  InvalidParamsError,
  MethodNotFoundError,
  type Json,
  type JsonRpcRequest,
} from '@metamask/snaps-sdk';
import { assert } from '@metamask/superstruct';

import { METAMASK_ORIGIN } from '../../constants/solana';
import type { SendService } from '../../services/send/SendService';
import type { WalletService } from '../../services/wallet/WalletService';
import { createPrefixedLogger, type ILogger } from '../../utils/logger';
import type { SolanaKeyring } from '../onKeyringRequest/Keyring';
import { ClientRequestMethod } from './types';
import {
  OnAddressInputRequestStruct,
  OnAmountInputRequestStruct,
  OnConfirmSendRequestStruct,
  SignAndSendTransactionWithoutConfirmationRequestStruct,
  ValidationResponseStruct,
} from './validation';

export class ClientRequestHandler {
  readonly #keyring: SolanaKeyring;

  readonly #walletService: WalletService;

  readonly #logger: ILogger;

  readonly #sendService: SendService;

  constructor(
    keyring: SolanaKeyring,
    walletService: WalletService,
    logger: ILogger,
    sendService: SendService,
  ) {
    this.#keyring = keyring;
    this.#walletService = walletService;
    this.#logger = createPrefixedLogger(logger, '[👋 ClientRequestHandler]');
    this.#sendService = sendService;
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
      case ClientRequestMethod.SignAndSendTransactionWithoutConfirmation:
        return this.#handleSignAndSendTransactionWithoutConfirmation(request);
      case ClientRequestMethod.OnConfirmSend:
        return this.#handleOnConfirmSend(request);
      case ClientRequestMethod.OnAddressInput:
        return this.#handleOnAddressInput(request);
      case ClientRequestMethod.OnAmountInput:
        return this.#handleOnAmountInput(request);
      default:
        throw new MethodNotFoundError() as Error;
    }
  }

  async #handleSignAndSendTransactionWithoutConfirmation(
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

  async #handleOnConfirmSend(request: JsonRpcRequest): Promise<Json> {
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
