import type { JsonRpcRequest } from '@metamask/snaps-sdk';

import { KnownCaip19Id } from '../../constants/solana';
import type { TransactionIntent } from '../../domain';
import {
  MOCK_SOLANA_KEYRING_ACCOUNT_0,
  MOCK_SOLANA_KEYRING_ACCOUNT_1,
} from '../../test/mocks/solana-keyring-accounts';
import type {
  SignAndSendTransactionWithoutConfirmationResponse,
  SignAndSendTransactionWithoutConfirmationUseCase,
} from '../../use-cases';
import type { ILogger } from '../../utils/logger';
import { ClientRequestHandler } from './ClientRequestHandler';
import { ClientRequestMethod } from './types';

describe('ClientRequestHandler', () => {
  let handler: ClientRequestHandler;
  let mockSignAndSendTransactionWithIntentUseCase: jest.Mocked<SignAndSendTransactionWithoutConfirmationUseCase>;
  let mockLogger: jest.Mocked<ILogger>;

  beforeEach(() => {
    // Create mock use case
    mockSignAndSendTransactionWithIntentUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<SignAndSendTransactionWithoutConfirmationUseCase>;

    // Create mock logger
    mockLogger = console as unknown as jest.Mocked<ILogger>;

    // Create handler instance
    handler = new ClientRequestHandler(
      mockSignAndSendTransactionWithIntentUseCase,
      mockLogger,
    );

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('handle', () => {
    describe('when request to method is not supported', () => {
      it('should throw method not found error', async () => {
        const request: JsonRpcRequest = {
          jsonrpc: '2.0',
          id: 1,
          method: 'unsupported_method' as ClientRequestMethod,
          params: [],
        };

        await expect(handler.handle(request)).rejects.toThrow(
          'The method does not exist / is not available.',
        );
      });
    });

    describe('when request to method signAndSendTransactionWithIntent', () => {
      describe('when request is valid', () => {
        // Swapping 1 SOL for 161.18 USDC
        const mockIntent: TransactionIntent = {
          id: 'c76b3834-b9a8-4dfd-91da-72c26a216fb2',
          type: 'swap',
          slippage: 0.01,
          timestamp: '2025-06-04T14:52:31.307Z',
          from: {
            address: MOCK_SOLANA_KEYRING_ACCOUNT_0.address,
            asset: KnownCaip19Id.SolMainnet,
            amount: '1000000000',
          },
          to: {
            address: MOCK_SOLANA_KEYRING_ACCOUNT_1.address,
            asset: KnownCaip19Id.UsdcMainnet,
            amount: '161180000',
          },
        };
        const mockTransaction =
          'gAEAChfds67pR0IYlL1XKFGjzC+zBZIA7vT1dj7nUBTUwAs7rBn3hrWmXImk+UetGwvWumZpcEhF+xT5THD5os2Svp67H8GdfJ4jkOslaYOff/X0SeF33Cha5Ij9DKlo3QaosfIhtgnDmdJAVdjfmyv5dEGsSWgYEYPaqW8v8hSJozhYIzcQa4p5MinFjNMq4vDm+n249hE5Vmwe+Adkq87GTDegPbdaVhuqlrT5hZnIkdcW67eCFvm9ZzXM9jeWm2GwnLBGfnLp6qHLD5IgtqLXr5clzwoa2ns4KdysosGA2yFHt2dBBA/kB6qwUEagfnGzH2GY12XE3va/gn3W4Loqy/D+gP5PMjWwL4nGY8i3EGxqLHt/i3x/EskcO1ftQjYqQtqMVVDE+U/Vngb6x6+HbBOGrDQOx73j0k813TrK9dmptLgHDBoOIz6tGmWT+r9wa3YtqouLIv01/IKynGlc4TnE0M2MheikqA6gkuj1PhXVDgPc7eSLCseVMCy/WUgTmKbXmnZ/QcH3X8YTJ//GR4yvL7LCHdfHPhS8B+4hpoFusQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAKD0N0oI1T+8K47DiJ9N82JyiZvsX3fj3y3zO++Tr3FVRPixdukLDvYMw2r2DTumX5VA1ifoAVfXgkOTnLswDEoyXJY9OJInxuz0QKRSODYMLWhOZ2v8QhASOe9jb6fhZAwZGb+UhFzL/7K26csOb57yM5bvF9xJrLEObOkAAAAC0P/on9df2SnTAmx8pWHneSwmrNt/J3VFLMhqns4zl6LwHxW5grT0/F3OC6sZUj7of0yz9kMoCs+fPoYX9znOYyUOdJ8PoWqEFw7H8n7xwkhg1P1tPfo1/6arncTl4PJkEedVb8jHAbu50xW7OaBUH/bGy3qP0jlECsc2iVrwTjwan1RcYx3TJKFZjmGkdXraLXrijm0ttXHNVWyEAAAAA0LlMW0o1bBeKH7IjSDuI9G0a+7kgVaW9ubbU+rklS9sFDgIWFAkAi8sXoE0wggARAAUCuIEWABEACAMgoQcAAAAAEAYACAATDS0BARVDLQ8ABgUECCoTFRUSFSslKyIjBQooKiQrDy0tKSsMAwEVKyErHB0KBygsHisPLS0pKx8gFScPJhsHBBcZGi0JGAILFSzBIJszQdacgQMDAAAAJmQAASZkAQIaZAIDQEIPAAAAAAC78khRAQAAADIAAANOgLKSmCyUmuksqMclFoVdtmiFizz7/yF11zNd6VSAxgUkIB4dIwIhIrYRAfelfqMdEh4JHXx6VS3GXpyeWhNKQlBsx9m2I8c+BhMSEBEUWgDdfctSzc+t7n0tohMIoz7S6USQkKhKDRCUSx6C3SjhJQQJAg8EBgoMCwYQBw==';
        const mockSignature =
          'rNaqYcw7VsWYcjHALq7nqmSXhYoUQ87hWWakzdztfsny5UGWrKYoLNwFbw9jADtAhfEdXNwyBAWn6MQkYt7UXcb';

        const validRequest: JsonRpcRequest = {
          jsonrpc: '2.0',
          id: 1,
          method: ClientRequestMethod.SignAndSendTransactionWithoutConfirmation,
          params: {
            intent: mockIntent,
            transaction: mockTransaction,
            signature: mockSignature,
          },
        };

        it('should call the use case and return the response', async () => {
          const expectedResponse: SignAndSendTransactionWithoutConfirmationResponse =
            {
              transactionId: 'transaction-signature',
            };
          mockSignAndSendTransactionWithIntentUseCase.execute.mockResolvedValue(
            expectedResponse,
          );

          const response = await handler.handle(validRequest);

          expect(
            mockSignAndSendTransactionWithIntentUseCase.execute,
          ).toHaveBeenCalledWith({
            intent: mockIntent,
            transaction: mockTransaction,
            signature: mockSignature,
          });

          expect(response).toStrictEqual(expectedResponse);
        });

        it('should propagate use case errors', async () => {
          const useCaseError = new Error('Transaction failed');
          mockSignAndSendTransactionWithIntentUseCase.execute.mockRejectedValue(
            useCaseError,
          );

          await expect(handler.handle(validRequest)).rejects.toThrow(
            'Transaction failed',
          );
        });
      });

      describe('when request is invalid', () => {
        const invalidRequest: JsonRpcRequest = {
          jsonrpc: '2.0',
          id: 1,
          method: ClientRequestMethod.SignAndSendTransactionWithoutConfirmation,
          params: {
            name: 'Alice',
          },
        };

        it('should throw validation error', async () => {
          await expect(handler.handle(invalidRequest)).rejects.toThrow(
            'Invalid method parameter(s).',
          );
        });
      });
    });
  });
});
