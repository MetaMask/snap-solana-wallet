import type { JsonRpcRequest } from '@metamask/snaps-sdk';

import { Network } from '../../constants/solana';
import type { SolanaSignAndSendTransactionResponse } from '../../services/wallet/structs';
import type { WalletService } from '../../services/wallet/WalletService';
import { MOCK_SOLANA_KEYRING_ACCOUNT_0 } from '../../test/mocks/solana-keyring-accounts';
import type { ILogger } from '../../utils/logger';
import type { SolanaKeyring } from '../onKeyringRequest/Keyring';
import { ClientRequestHandler } from './ClientRequestHandler';
import { ClientRequestMethod } from './types';

describe('ClientRequestHandler', () => {
  let handler: ClientRequestHandler;
  let mockKeyring: jest.Mocked<SolanaKeyring>;
  let mockWalletService: jest.Mocked<WalletService>;
  let mockLogger: jest.Mocked<ILogger>;

  beforeEach(() => {
    // Create mock keyring
    mockKeyring = {
      listAccounts: jest.fn(),
    } as unknown as jest.Mocked<SolanaKeyring>;

    // Create mock wallet service
    mockWalletService = {
      signAndSendTransaction: jest.fn(),
    } as unknown as jest.Mocked<WalletService>;

    // Create mock logger
    mockLogger = {
      log: jest.fn(),
    } as unknown as jest.Mocked<ILogger>;

    // Create handler instance
    handler = new ClientRequestHandler(
      mockKeyring,
      mockWalletService,
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

    describe('when request to method signAndSendTransactionWithoutConfirmation', () => {
      const mockTransaction =
        'gAEAChfds67pR0IYlL1XKFGjzC+zBZIA7vT1dj7nUBTUwAs7rBn3hrWmXImk+UetGwvWumZpcEhF+xT5THD5os2Svp67H8GdfJ4jkOslaYOff/X0SeF33Cha5Ij9DKlo3QaosfIhtgnDmdJAVdjfmyv5dEGsSWgYEYPaqW8v8hSJozhYIzcQa4p5MinFjNMq4vDm+n249hE5Vmwe+Adkq87GTDegPbdaVhuqlrT5hZnIkdcW67eCFvm9ZzXM9jeWm2GwnLBGfnLp6qHLD5IgtqLXr5clzwoa2ns4KdysosGA2yFHt2dBBA/kB6qwUEagfnGzH2GY12XE3va/gn3W4Loqy/D+gP5PMjWwL4nGY8i3EGxqLHt/i3x/EskcO1ftQjYqQtqMVVDE+U/Vngb6x6+HbBOGrDQOx73j0k813TrK9dmptLgHDBoOIz6tGmWT+r9wa3YtqouLIv01/IKynGlc4TnE0M2MheikqA6gkuj1PhXVDgPc7eSLCseVMCy/WUgTmKbXmnZ/QcH3X8YTJ//GR4yvL7LCHdfHPhS8B+4hpoFusQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAKD0N0oI1T+8K47DiJ9N82JyiZvsX3fj3y3zO++Tr3FVRPixdukLDvYMw2r2DTumX5VA1ifoAVfXgkOTnLswDEoyXJY9OJInxuz0QKRSODYMLWhOZ2v8QhASOe9jb6fhZAwZGb+UhFzL/7K26csOb57yM5bvF9xJrLEObOkAAAAC0P/on9df2SnTAmx8pWHneSwmrNt/J3VFLMhqns4zl6LwHxW5grT0/F3OC6sZUj7of0yz9kMoCs+fPoYX9znOYyUOdJ8PoWqEFw7H8n7xwkhg1P1tPfo1/6arncTl4PJkEedVb8jHAbu50xW7OaBUH/bGy3qP0jlECsc2iVrwTjwan1RcYx3TJKFZjmGkdXraLXrijm0ttXHNVWyEAAAAA0LlMW0o1bBeKH7IjSDuI9G0a+7kgVaW9ubbU+rklS9sFDgIWFAkAi8sXoE0wggARAAUCuIEWABEACAMgoQcAAAAAEAYACAATDS0BARVDLQ8ABgUECCoTFRUSFSslKyIjBQooKiQrDy0tKSsMAwEVKyErHB0KBygsHisPLS0pKx8gFScPJhsHBBcZGi0JGAILFSzBIJszQdacgQMDAAAAJmQAASZkAQIaZAIDQEIPAAAAAAC78khRAQAAADIAAANOgLKSmCyUmuksqMclFoVdtmiFizz7/yF11zNd6TSAxgUkIB4dIwIhIrYRAfelfqMdEh4JHXx6VS3GXpyeWhNKQlBsx9m2I8c+BhMSEBEUWgDdfctSzc+t7n0tohMIoz7S6USQkKhKDRCUSx6C3SjhJQQJAg8EBgoMCwYQBw==';

      const validRequest: JsonRpcRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: ClientRequestMethod.SignAndSendTransactionWithoutConfirmation,
        params: {
          account: {
            address: MOCK_SOLANA_KEYRING_ACCOUNT_0.address,
          },
          scope: Network.Testnet,
          transaction: mockTransaction,
          options: {
            commitment: 'confirmed',
            skipPreflight: false,
            maxRetries: 3,
          },
        },
      };

      describe('when request is valid', () => {
        beforeEach(() => {
          mockKeyring.listAccounts.mockResolvedValue([
            MOCK_SOLANA_KEYRING_ACCOUNT_0,
          ]);
        });

        it('calls the wallet service and returns the response', async () => {
          const expectedResponse: SolanaSignAndSendTransactionResponse = {
            signature: 'transaction-signature',
          };
          mockWalletService.signAndSendTransaction.mockResolvedValue(
            expectedResponse,
          );

          const response = await handler.handle(validRequest);

          expect(mockWalletService.signAndSendTransaction).toHaveBeenCalledWith(
            MOCK_SOLANA_KEYRING_ACCOUNT_0,
            mockTransaction,
            Network.Testnet,
            undefined,
            {
              commitment: 'confirmed',
              skipPreflight: false,
              maxRetries: 3,
            },
          );

          expect(response).toStrictEqual(expectedResponse);
        });

        it('should propagate wallet service errors', async () => {
          const walletServiceError = new Error('Transaction failed');
          mockWalletService.signAndSendTransaction.mockRejectedValue(
            walletServiceError,
          );

          await expect(handler.handle(validRequest)).rejects.toThrow(
            'Transaction failed',
          );
        });
      });

      describe('when the account is not found', () => {
        it('throws an account not found error', async () => {
          mockKeyring.listAccounts.mockResolvedValue([]);

          await expect(handler.handle(validRequest)).rejects.toThrow(
            `Account not found: ${MOCK_SOLANA_KEYRING_ACCOUNT_0.address}`,
          );
        });
      });

      describe('when the method is invalid', () => {
        it('throws a method not found error', async () => {
          const invalidRequest: JsonRpcRequest = {
            jsonrpc: '2.0',
            id: 1,
            method: 'invalid_method' as ClientRequestMethod,
            params: [],
          };

          await expect(handler.handle(invalidRequest)).rejects.toThrow(
            'The method does not exist / is not available.',
          );
        });
      });

      describe('when the params are invalid', () => {
        it('throws a invalid params error', async () => {
          const invalidRequest: JsonRpcRequest = {
            jsonrpc: '2.0',
            id: 1,
            method:
              ClientRequestMethod.SignAndSendTransactionWithoutConfirmation,
            params: {
              name: 'Alice',
            },
          };

          await expect(handler.handle(invalidRequest)).rejects.toThrow(
            'Invalid method parameter(s).',
          );
        });
      });
    });
  });
});
