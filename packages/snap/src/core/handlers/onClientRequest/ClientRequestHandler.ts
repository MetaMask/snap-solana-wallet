import { SnapError, type Json, type JsonRpcRequest } from '@metamask/snaps-sdk';
import { assert, enums } from '@metamask/superstruct';

import type { ILogger } from '../../utils/logger';
import type { SignAndSendTransactionWithIntentUseCase } from './SignAndSendTransactionWithIntentUseCase';
import type { ClientRequestUseCase } from './types';
import { ClientRequestMethod } from './types';

export class ClientRequestHandler {
  readonly #methodToUseCase: Record<ClientRequestMethod, ClientRequestUseCase>;

  readonly #logger: ILogger;

  constructor(
    signAndSendTransactionWithIntentUseCase: SignAndSendTransactionWithIntentUseCase,
    logger: ILogger,
  ) {
    this.#methodToUseCase = {
      [ClientRequestMethod.SignAndSendTransactionWithIntent]:
        signAndSendTransactionWithIntentUseCase,
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
    try {
      this.#logger.log('[onClientRequest] Handling client request...', request);

      const { method } = request;
      assert(method, enums(Object.values(ClientRequestMethod)));

      const useCase = this.#methodToUseCase[method];

      return useCase.execute(request);
    } catch (error: any) {
      this.#logger.error(error, 'Error handling client request');
      throw new SnapError(error);
    }
  }
}
