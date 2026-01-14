import { InvalidParamsError, type JsonRpcRequest } from '@metamask/snaps-sdk';
import { getBase64Codec, getUtf8Codec, pipe } from '@solana/kit';

import { KnownCaip19Id, Network } from '../../constants/solana';
import type { AccountsService, ApproveTokenService } from '../../services';
import type { SendService } from '../../services/send/SendService';
import type { ValidationResponse } from '../../services/send/types';
import type { SolanaSignAndSendTransactionResponse } from '../../services/wallet/structs';
import type { WalletService } from '../../services/wallet/WalletService';
import {
  MOCK_SOLANA_KEYRING_ACCOUNT_0,
  MOCK_SOLANA_KEYRING_ACCOUNT_1,
} from '../../test/mocks/solana-keyring-accounts';
import type { ILogger } from '../../utils/logger';
import { ClientRequestHandler } from './ClientRequestHandler';
import { ClientRequestMethod } from './types';

// Mock the compileTransaction function
jest.mock('@solana/kit', () => {
  const actual = jest.requireActual('@solana/kit');
  return {
    ...actual,
    compileTransaction: jest.fn().mockReturnValue({
      messageBytes: new Uint8Array([1, 2, 3]),
      signatures: {},
    }),
  };
});

// Mock the fromTransactionToBase64String function
jest.mock('../../sdk-extensions/codecs', () => ({
  ...jest.requireActual('../../sdk-extensions/codecs'),
  fromTransactionToBase64String: jest
    .fn()
    .mockReturnValue('mockBase64Transaction'),
}));

describe('ClientRequestHandler', () => {
  let handler: ClientRequestHandler;
  let mockAccountsService: jest.Mocked<AccountsService>;
  let mockWalletService: jest.Mocked<WalletService>;
  let mockLogger: jest.Mocked<ILogger>;
  let sendService: jest.Mocked<SendService>;
  let mockApproveTokenService: jest.Mocked<ApproveTokenService>;

  beforeEach(() => {
    // Create mock keyring
    mockAccountsService = {
      findById: jest.fn(),
      findByAddress: jest.fn(),
    } as unknown as jest.Mocked<AccountsService>;

    // Create mock wallet service
    mockWalletService = {
      signAndSendTransaction: jest.fn(),
      signMessage: jest.fn(),
    } as unknown as jest.Mocked<WalletService>;

    // Create mock logger
    mockLogger = {
      log: jest.fn(),
    } as unknown as jest.Mocked<ILogger>;

    sendService = {
      onAmountInput: jest.fn(),
      onAddressInput: jest.fn(),
      confirmSend: jest.fn(),
    } as unknown as jest.Mocked<SendService>;

    // Create mock approve token service
    mockApproveTokenService = {
      buildApprovalTransactionMessage: jest.fn(),
    } as unknown as jest.Mocked<ApproveTokenService>;

    // Create handler instance
    handler = new ClientRequestHandler(
      mockAccountsService,
      mockWalletService,
      mockLogger,
      sendService,
      mockApproveTokenService,
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
  });

  describe('signAndSendTransactionWithoutConfirmation', () => {
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
        mockAccountsService.findByAddress.mockResolvedValue(
          MOCK_SOLANA_KEYRING_ACCOUNT_0,
        );
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
          'metamask',
          {
            commitment: 'confirmed',
            skipPreflight: false,
            maxRetries: 3,
          },
        );

        expect(response).toStrictEqual(expectedResponse);
      });

      it('propagates wallet service errors', async () => {
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
        mockAccountsService.findByAddress.mockResolvedValue(null);

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
          method: ClientRequestMethod.SignAndSendTransactionWithoutConfirmation,
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

  describe('signAndSendTransaction', () => {
    const mockTransaction =
      'gAEAChfds67pR0IYlL1XKFGjzC+zBZIA7vT1dj7nUBTUwAs7rBn3hrWmXImk+UetGwvWumZpcEhF+xT5THD5os2Svp67H8GdfJ4jkOslaYOff/X0SeF33Cha5Ij9DKlo3QaosfIhtgnDmdJAVdjfmyv5dEGsSWgYEYPaqW8v8hSJozhYIzcQa4p5MinFjNMq4vDm+n249hE5Vmwe+Adkq87GTDegPbdaVhuqlrT5hZnIkdcW67eCFvm9ZzXM9jeWm2GwnLBGfnLp6qHLD5IgtqLXr5clzwoa2ns4KdysosGA2yFHt2dBBA/kB6qwUEagfnGzH2GY12XE3va/gn3W4Loqy/D+gP5PMjWwL4nGY8i3EGxqLHt/i3x/EskcO1ftQjYqQtqMVVDE+U/Vngb6x6+HbBOGrDQOx73j0k813TrK9dmptLgHDBoOIz6tGmWT+r9wa3YtqouLIv01/IKynGlc4TnE0M2MheikqA6gkuj1PhXVDgPc7eSLCseVMCy/WUgTmKbXmnZ/QcH3X8YTJ//GR4yvL7LCHdfHPhS8B+4hpoFusQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAKD0N0oI1T+8K47DiJ9N82JyiZvsX3fj3y3zO++Tr3FVRPixdukLDvYMw2r2DTumX5VA1ifoAVfXgkOTnLswDEoyXJY9OJInxuz0QKRSODYMLWhOZ2v8QhASOe9jb6fhZAwZGb+UhFzL/7K26csOb57yM5bvF9xJrLEObOkAAAAC0P/on9df2SnTAmx8pWHneSwmrNt/J3VFLMhqns4zl6LwHxW5grT0/F3OC6sZUj7of0yz9kMoCs+fPoYX9znOYyUOdJ8PoWqEFw7H8n7xwkhg1P1tPfo1/6arncTl4PJkEedVb8jHAbu50xW7OaBUH/bGy3qP0jlECsc2iVrwTjwan1RcYx3TJKFZjmGkdXraLXrijm0ttXHNVWyEAAAAA0LlMW0o1bBeKH7IjSDuI9G0a+7kgVaW9ubbU+rklS9sFDgIWFAkAi8sXoE0wggARAAUCuIEWABEACAMgoQcAAAAAEAYACAATDS0BARVDLQ8ABgUECCoTFRUSFSslKyIjBQooKiQrDy0tKSsMAwEVKyErHB0KBygsHisPLS0pKx8gFScPJhsHBBcZGi0JGAILFSzBIJszQdacgQMDAAAAJmQAASZkAQIaZAIDQEIPAAAAAAC78khRAQAAADIAAANOgLKSmCyUmuksqMclFoVdtmiFizz7/yF11zNd6TSAxgUkIB4dIwIhIrYRAfelfqMdEh4JHXx6VS3GXpyeWhNKQlBsx9m2I8c+BhMSEBEUWgDdfctSzc+t7n0tohMIoz7S6USQkKhKDRCUSx6C3SjhJQQJAg8EBgoMCwYQBw==';

    const mockTransactionId =
      '4x9nP9P4PnddXcfuahUBtGD3YgskhYMhCvswVZev7ZZW9U5no9H9QP33UoynXoiynH43RvHwoTBDLmv4hMFBv16w';

    const validRequest: JsonRpcRequest = {
      jsonrpc: '2.0',
      id: 1,
      method: ClientRequestMethod.SignAndSendTransaction,
      params: {
        accountId: MOCK_SOLANA_KEYRING_ACCOUNT_0.id,
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
        mockAccountsService.findById.mockResolvedValue(
          MOCK_SOLANA_KEYRING_ACCOUNT_0,
        );
      });

      it('calls the wallet service and returns the response with transactionId', async () => {
        const expectedResponse = {
          transactionId: mockTransactionId,
        };
        mockWalletService.signAndSendTransaction.mockResolvedValue({
          signature: expectedResponse.transactionId,
        });

        const response = await handler.handle(validRequest);

        expect(mockAccountsService.findById).toHaveBeenCalledWith(
          MOCK_SOLANA_KEYRING_ACCOUNT_0.id,
        );
        expect(mockWalletService.signAndSendTransaction).toHaveBeenCalledWith(
          MOCK_SOLANA_KEYRING_ACCOUNT_0,
          mockTransaction,
          Network.Testnet,
          'metamask',
          {
            commitment: 'confirmed',
            skipPreflight: false,
            maxRetries: 3,
          },
        );

        expect(response).toStrictEqual(expectedResponse);
      });

      it('propagates wallet service errors', async () => {
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
        mockAccountsService.findById.mockRejectedValue(
          new Error('Account not found'),
        );

        await expect(handler.handle(validRequest)).rejects.toThrow(
          'Account not found',
        );
      });
    });

    describe('when the params are invalid', () => {
      it('throws a invalid params error', async () => {
        const invalidRequest: JsonRpcRequest = {
          jsonrpc: '2.0',
          id: 1,
          method: ClientRequestMethod.SignAndSendTransaction,
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

  describe('computeFee', () => {
    const mockTransaction =
      'AXxLCXtYo9AY2f1GE1V0Pp7QoiFvY67WGMkRasmnGa4QI66lz0fk+z1O9hWggkEdSb4eCK+sSQOBgKffpW8nFwGAAQACBZmwAo+dnq8yhuKR7QpXgj+5yPFMzVwViEudWE9Z+N90qg5jUUNU1A79nvrnBM2x0tvjvM0bJFPOKZHbnqR9TzLfJCXvFr85xcLXaaIzbXdnbOFs+klSdfVRIluJ9yfUxwMGRm/lIRcy/+ytunLDm+e8jOW7xfcSayxDmzpAAAAABt324ddloZPZy+FGzut5rBy0he1fWzeROoz1hX7/AKk9holmkkG74a11Z3XVXb69hHvVi8hHst59kfJlZt2iKAMDAAUCuhIAAAMACQPoAwAAAAAAAAQDAgEACQPoAwAAAAAAAAA=';

    const validRequest: JsonRpcRequest = {
      jsonrpc: '2.0',
      id: 1,
      method: ClientRequestMethod.ComputeFee,
      params: {
        transaction: mockTransaction,
        accountId: MOCK_SOLANA_KEYRING_ACCOUNT_0.id,
        scope: Network.Testnet,
      },
    };

    describe('when request is valid', () => {
      it('calls the transaction helper and returns the base and priority fee', async () => {
        const response = await handler.handle(validRequest);

        expect(response).toStrictEqual([
          {
            type: 'base',
            asset: {
              unit: 'SOL',
              type: 'solana:4uhcVJyU9pJkvQyS88uRDiswHXSCkY3z/slip44:501',
              amount: '0.000005',
              fungible: true,
            },
          },
          {
            type: 'priority',
            asset: {
              unit: 'SOL',
              type: 'solana:4uhcVJyU9pJkvQyS88uRDiswHXSCkY3z/slip44:501',
              amount: '0.000000004',
              fungible: true,
            },
          },
        ]);
      });
    });

    describe('when the params are invalid', () => {
      it('throws a invalid params error', async () => {
        const invalidRequest: JsonRpcRequest = {
          jsonrpc: '2.0',
          id: 1,
          method: ClientRequestMethod.ComputeFee,
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

  describe('confirmSend', () => {
    const request: JsonRpcRequest = {
      jsonrpc: '2.0',
      id: 1,
      method: ClientRequestMethod.ConfirmSend,
      params: {
        fromAccountId: MOCK_SOLANA_KEYRING_ACCOUNT_0.id,
        toAddress: MOCK_SOLANA_KEYRING_ACCOUNT_0.address,
        amount: '10',
        assetId: KnownCaip19Id.UsdcMainnet,
      },
    };

    it('calls the send service and returns the response', async () => {
      const response = {
        pending: false,
        result: {
          signature: 'transaction-signature',
        },
      };

      jest.spyOn(sendService, 'confirmSend').mockResolvedValue(response);

      const result = await handler.handle(request);

      expect(sendService.confirmSend).toHaveBeenCalledWith(request);
      expect(result).toStrictEqual(response);
    });

    it('propagates send service errors', async () => {
      const sendServiceError = new Error('Transaction failed');
      jest
        .spyOn(sendService, 'confirmSend')
        .mockRejectedValue(sendServiceError);

      await expect(handler.handle(request)).rejects.toThrow(
        'Transaction failed',
      );
    });

    it('validates the request if invalid params are provided', async () => {
      const invalidRequest: JsonRpcRequest = {
        ...request,
        params: {
          fromAccountId: 'invalid-account-id',
          toAddress: MOCK_SOLANA_KEYRING_ACCOUNT_0.address,
          amount: '10',
          assetId: KnownCaip19Id.UsdcMainnet,
        },
      };

      await expect(handler.handle(invalidRequest)).rejects.toThrow(
        InvalidParamsError,
      );
    });
  });

  describe('onAddressInput', () => {
    const request: JsonRpcRequest = {
      jsonrpc: '2.0',
      id: 1,
      method: ClientRequestMethod.OnAddressInput,
      params: {
        value: MOCK_SOLANA_KEYRING_ACCOUNT_0.address,
        scope: Network.Testnet,
      },
    };

    it('calls the send service and returns the response', async () => {
      const response = {
        valid: true,
        errors: [],
      };

      jest.spyOn(sendService, 'onAddressInput').mockResolvedValue(response);

      const result = await handler.handle(request);

      expect(sendService.onAddressInput).toHaveBeenCalledWith(
        MOCK_SOLANA_KEYRING_ACCOUNT_0.address,
        Network.Testnet,
      );
      expect(result).toStrictEqual(response);
    });

    it('defaults the scope to Mainnet if not provided', async () => {
      const response = {
        valid: true,
        errors: [],
      };

      jest.spyOn(sendService, 'onAddressInput').mockResolvedValue(response);

      const requestWithNoScope: JsonRpcRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: ClientRequestMethod.OnAddressInput,
        params: {
          value: MOCK_SOLANA_KEYRING_ACCOUNT_0.address,
        },
      };

      const result = await handler.handle(requestWithNoScope);

      expect(sendService.onAddressInput).toHaveBeenCalledWith(
        MOCK_SOLANA_KEYRING_ACCOUNT_0.address,
        Network.Mainnet,
      );
      expect(result).toStrictEqual(response);
    });

    it('throws an error if value is not provided', async () => {
      const emptyValueRequest: JsonRpcRequest = {
        ...request,
        params: {
          value: null,
        },
      };

      await expect(handler.handle(emptyValueRequest)).rejects.toThrow(
        InvalidParamsError,
      );
    });

    it('validates the response if invalid', async () => {
      const response = {
        property: 'invalid',
      } as unknown as ValidationResponse;

      jest.spyOn(sendService, 'onAddressInput').mockResolvedValue(response);

      await expect(handler.handle(request)).rejects.toThrow(/At path: valid/iu);
    });
  });

  describe('onAmountInput', () => {
    const request: JsonRpcRequest = {
      jsonrpc: '2.0',
      id: 1,
      method: ClientRequestMethod.OnAmountInput,
      params: {
        value: '10',
        accountId: MOCK_SOLANA_KEYRING_ACCOUNT_0.id,
        assetId: KnownCaip19Id.UsdcMainnet,
      },
    };

    it('calls the send service and returns the response', async () => {
      const response = {
        valid: true,
        errors: [],
      };

      jest.spyOn(sendService, 'onAmountInput').mockResolvedValue(response);

      const result = await handler.handle(request);

      expect(sendService.onAmountInput).toHaveBeenCalledWith(request);
      expect(result).toStrictEqual(response);
    });

    it('throws an error if value is not provided', async () => {
      const emptyValueRequest: JsonRpcRequest = {
        ...request,
        params: {
          value: null,
        },
      };

      await expect(handler.handle(emptyValueRequest)).rejects.toThrow(
        InvalidParamsError,
      );
    });

    it('validates the response if invalid', async () => {
      const response = {
        property: 'invalid',
      } as unknown as ValidationResponse;

      jest.spyOn(sendService, 'onAmountInput').mockResolvedValue(response);

      await expect(handler.handle(request)).rejects.toThrow(/At path: valid/iu);
    });
  });

  describe('signRewardsMessage', () => {
    // Helper function to convert a utf8 string to base64
    const utf8ToBase64 = (utf8: string): string =>
      pipe(utf8, getUtf8Codec().encode, getBase64Codec().decode);

    const { id: accountId, address } = MOCK_SOLANA_KEYRING_ACCOUNT_0;
    const mockTimestamp = 1736660000;

    // Helper function to create a request with a utf8 message. Defaults to a valid rewards message.
    const createRequest = (utf8Message?: string): JsonRpcRequest => ({
      jsonrpc: '2.0',
      id: 1,
      method: ClientRequestMethod.SignRewardsMessage,
      params: {
        accountId,
        message: utf8ToBase64(
          utf8Message ?? `rewards,${address},${mockTimestamp}`,
        ),
      },
    });

    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date(mockTimestamp * 1000));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('calls the wallet service and returns the response', async () => {
      const response = {
        signature:
          '61Go4ycewVBbfpDSP6hSad567y3USmUHbfR19wC2PA8uHEFGtWPpjyZnLrfH2yKLYkG7ezwT7jdE95NsVKUe1JNu',
        signedMessage:
          'cmV3YXJkcyxCTHczUndlSm1mYlRhcEpSZ25QUnZkOTYyWURqRllBblZHZDFwNWhtWjV0UCwxNzM2NjYwMDAw',
        signatureType: 'ed25519' as const,
      };
      jest
        .spyOn(mockAccountsService, 'findById')
        .mockResolvedValue(MOCK_SOLANA_KEYRING_ACCOUNT_0);
      jest.spyOn(mockWalletService, 'signMessage').mockResolvedValue(response);

      const request = createRequest();

      const result = await handler.handle(request);

      expect(mockWalletService.signMessage).toHaveBeenCalledWith(
        MOCK_SOLANA_KEYRING_ACCOUNT_0,
        'cmV3YXJkcyxCTHczUndlSm1mYlRhcEpSZ25QUnZkOTYyWURqRllBblZHZDFwNWhtWjV0UCwxNzM2NjYwMDAw',
      );
      expect(result).toStrictEqual(response);
    });

    it('throws an error if message is invalid', async () => {
      const invalidMessageRequest = createRequest('invalid-message');

      await expect(handler.handle(invalidMessageRequest)).rejects.toThrow(
        'Message must start with',
      );
    });

    it('throws an error if account is not found', async () => {
      const invalidAccountRequest = createRequest();
      mockAccountsService.findById.mockResolvedValue(null);

      await expect(handler.handle(invalidAccountRequest)).rejects.toThrow(
        'Account not found',
      );
    });

    it('throws an error if address in message does not match signing account', async () => {
      const signingAccount = MOCK_SOLANA_KEYRING_ACCOUNT_0;
      mockAccountsService.findById.mockResolvedValue(signingAccount);

      // Use a valid Solana address format but different from the signing account
      const differentAddress = MOCK_SOLANA_KEYRING_ACCOUNT_1.address;
      const requestWithDifferentAddress = createRequest(
        `rewards,${differentAddress},${mockTimestamp}`,
      );

      await expect(handler.handle(requestWithDifferentAddress)).rejects.toThrow(
        `Address in rewards message (${differentAddress}) does not match signing account address (${address})`,
      );
    });
  });

  describe('signCardMessage', () => {
    // Helper function to convert a utf8 string to base64
    const utf8ToBase64 = (utf8: string): string =>
      pipe(utf8, getUtf8Codec().encode, getBase64Codec().decode);

    const { id: accountId, address } = MOCK_SOLANA_KEYRING_ACCOUNT_0;

    // Create a valid SIWS-style card message
    const createCardMessage = (
      signerAddress = address,
      nonce = 'a90TLFMbDFGDWUTfs',
    ): string =>
      `approve.card.metamask.io wants you to sign in with your Solana account: ${signerAddress} Prove address ownership URI: https://approve.card.metamask.io Version: 1 Chain ID: 1 Nonce: ${nonce} Issued At: 2025-12-02T14:25:49.589Z Expiration Time: 2025-12-02T14:35:49.589Z`;

    const createRequest = (message: string): JsonRpcRequest => ({
      jsonrpc: '2.0',
      id: 1,
      method: ClientRequestMethod.SignCardMessage,
      params: {
        accountId,
        message: utf8ToBase64(message),
      },
    });

    it('calls the wallet service and returns the response', async () => {
      const validMessage = createCardMessage();
      const base64Message = utf8ToBase64(validMessage);

      const response = {
        signature:
          '61Go4ycewVBbfpDSP6hSad567y3USmUHbfR19wC2PA8uHEFGtWPpjyZnLrfH2yKLYkG7ezwT7jdE95NsVKUe1JNu',
        signedMessage: base64Message,
        signatureType: 'ed25519' as const,
      };
      jest
        .spyOn(mockAccountsService, 'findById')
        .mockResolvedValue(MOCK_SOLANA_KEYRING_ACCOUNT_0);
      jest.spyOn(mockWalletService, 'signMessage').mockResolvedValue(response);

      const request = createRequest(validMessage);

      const result = await handler.handle(request);

      expect(mockWalletService.signMessage).toHaveBeenCalledWith(
        MOCK_SOLANA_KEYRING_ACCOUNT_0,
        base64Message,
      );
      expect(result).toStrictEqual(response);
    });

    it('throws an error if account is not found', async () => {
      mockAccountsService.findById.mockResolvedValue(null);

      const request = createRequest(createCardMessage());

      await expect(handler.handle(request)).rejects.toThrow(
        'Account not found',
      );
    });

    it('throws an error if message format is invalid', async () => {
      const invalidMessageRequest = createRequest('invalid-message');

      await expect(handler.handle(invalidMessageRequest)).rejects.toThrow(
        'Invalid method parameter(s).',
      );
    });

    it('throws an error if address in message does not match signing account', async () => {
      const signingAccount = MOCK_SOLANA_KEYRING_ACCOUNT_0;
      mockAccountsService.findById.mockResolvedValue(signingAccount);

      // Use a valid Solana address format but different from the signing account
      const differentAddress = MOCK_SOLANA_KEYRING_ACCOUNT_1.address;
      const requestWithDifferentAddress = createRequest(
        createCardMessage(differentAddress),
      );

      await expect(handler.handle(requestWithDifferentAddress)).rejects.toThrow(
        `Address in card message (${differentAddress}) does not match signing account address (${address})`,
      );
    });

    it('throws an error if params are invalid', async () => {
      const invalidRequest: JsonRpcRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: ClientRequestMethod.SignCardMessage,
        params: {
          accountId: 'invalid-uuid',
          message: 'test',
        },
      };

      await expect(handler.handle(invalidRequest)).rejects.toThrow(
        'Invalid method parameter(s).',
      );
    });
  });

  describe('approveCardAmount', () => {
    const { id: accountId } = MOCK_SOLANA_KEYRING_ACCOUNT_0;
    const mockMint = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'; // USDC mint
    const mockDelegate = '4jepDb74FCMr1wgoSA34FeJ2mkvEsJBRZQQRumqp9EL3';

    const createRequest = (
      amount: string,
      mint = mockMint,
      delegate = mockDelegate,
      scope = Network.Mainnet,
    ): JsonRpcRequest => ({
      jsonrpc: '2.0',
      id: 1,
      method: ClientRequestMethod.ApproveCardAmount,
      params: {
        accountId,
        amount,
        mint,
        delegate,
        scope,
      },
    });

    it('builds and signs a token approval transaction', async () => {
      const mockSignature =
        '61Go4ycewVBbfpDSP6hSad567y3USmUHbfR19wC2PA8uHEFGtWPpjyZnLrfH2yKLYkG7ezwT7jdE95NsVKUe1JNu';

      // Mock the approve token service to return a transaction message
      mockApproveTokenService.buildApprovalTransactionMessage.mockResolvedValue(
        {} as any,
      );

      jest
        .spyOn(mockAccountsService, 'findById')
        .mockResolvedValue(MOCK_SOLANA_KEYRING_ACCOUNT_0);
      jest
        .spyOn(mockWalletService, 'signAndSendTransaction')
        .mockResolvedValue({
          signature: mockSignature,
        });

      const request = createRequest('100.50');

      const result = await handler.handle(request);

      expect(mockAccountsService.findById).toHaveBeenCalledWith(accountId);
      expect(
        mockApproveTokenService.buildApprovalTransactionMessage,
      ).toHaveBeenCalledWith({
        account: MOCK_SOLANA_KEYRING_ACCOUNT_0,
        mint: mockMint,
        delegate: mockDelegate,
        amount: '100.50',
        network: Network.Mainnet,
      });
      expect(mockWalletService.signAndSendTransaction).toHaveBeenCalledWith(
        MOCK_SOLANA_KEYRING_ACCOUNT_0,
        expect.any(String),
        Network.Mainnet,
        'metamask',
      );
      expect(result).toStrictEqual({ signature: mockSignature });
    });

    it('throws an error if account is not found', async () => {
      mockAccountsService.findById.mockResolvedValue(null);

      const request = createRequest('100');

      await expect(handler.handle(request)).rejects.toThrow(
        'Account not found',
      );
    });

    it('throws an error if amount is invalid', async () => {
      const invalidRequest: JsonRpcRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: ClientRequestMethod.ApproveCardAmount,
        params: {
          accountId,
          amount: '-100',
          mint: mockMint,
          delegate: mockDelegate,
          scope: Network.Mainnet,
        },
      };

      await expect(handler.handle(invalidRequest)).rejects.toThrow(
        'Invalid method parameter(s).',
      );
    });

    it('throws an error if params are missing', async () => {
      const invalidRequest: JsonRpcRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: ClientRequestMethod.ApproveCardAmount,
        params: {
          accountId,
        },
      };

      await expect(handler.handle(invalidRequest)).rejects.toThrow(
        'Invalid method parameter(s).',
      );
    });
  });
});
