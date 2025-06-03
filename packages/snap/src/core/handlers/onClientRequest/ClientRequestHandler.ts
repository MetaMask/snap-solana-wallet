import { type Json, type JsonRpcRequest } from '@metamask/snaps-sdk';
import type { Struct } from '@metamask/superstruct';
import { assert, enums } from '@metamask/superstruct';

import type { ILogger } from '../../utils/logger';
import type { SignAndSendTransactionWithIntentUseCase } from './SignAndSendTransactionWithIntentUseCase';
import type { ClientRequestUseCase } from './types';
import {
  ClientRequestMethod,
  SignAndSendTransactionWithIntentParamsStruct,
} from './types';

export class ClientRequestHandler {
  readonly #methodToUseCase: Record<ClientRequestMethod, ClientRequestUseCase>;

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
   */
  async handle(request: JsonRpcRequest): Promise<Json> {
    this.#logger.log('[onClientRequest] Handling client request...', request);

    const { method, params } = request;
    assert(method, enums(Object.values(ClientRequestMethod)));

    const paramsStruct = this.#methodToParamsStruct[method];
    assert(params, paramsStruct);

    const useCase = this.#methodToUseCase[method];
    return useCase.execute(params);
  }
}
