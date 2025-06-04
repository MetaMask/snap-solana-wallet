import {
  InvalidParamsError,
  MethodNotFoundError,
  type Json,
  type JsonRpcRequest,
} from '@metamask/snaps-sdk';
import type { Struct } from '@metamask/superstruct';
import { assert, enums } from '@metamask/superstruct';

import type {
  SignAndSendTransactionWithIntentUseCase,
  UseCase,
} from '../../use-cases';
import type { ILogger } from '../../utils/logger';
import { ClientRequestMethod } from './types';
import { SignAndSendTransactionWithIntentParamsStruct } from './validation';

export class ClientRequestHandler {
  readonly #methodToUseCase: Record<ClientRequestMethod, UseCase>;

  readonly #methodToParamsStruct: Record<ClientRequestMethod, Struct<any, any>>;

  readonly #logger: ILogger;

  constructor(
    signAndSendTransactionWithIntentUseCase: SignAndSendTransactionWithIntentUseCase,
    logger: ILogger,
  ) {
    this.#methodToUseCase = {
      [ClientRequestMethod.SignAndSendTransactionWithIntent]:
        signAndSendTransactionWithIntentUseCase,
    };

    this.#methodToParamsStruct = {
      [ClientRequestMethod.SignAndSendTransactionWithIntent]:
        SignAndSendTransactionWithIntentParamsStruct,
    };

    this.#logger = logger;
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
    this.#logger.log('[onClientRequest] Handling client request...', request);

    const { method, params } = request;

    // Validate the method
    try {
      assert(method, enums(Object.values(ClientRequestMethod)));
    } catch (error) {
      const errorToThrow = new MethodNotFoundError() as Error;
      errorToThrow.cause = error;
      throw errorToThrow;
    }

    // Validate the params
    try {
      assert(params, this.#methodToParamsStruct[method as ClientRequestMethod]);
    } catch (error) {
      const errorToThrow = new InvalidParamsError() as Error;
      errorToThrow.cause = error;
      throw errorToThrow;
    }

    const useCase = this.#methodToUseCase[method];
    return useCase.execute(params);
  }
}
