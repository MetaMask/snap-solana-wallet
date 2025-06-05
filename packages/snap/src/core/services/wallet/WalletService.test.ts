import { SolMethod } from '@metamask/keyring-api';
import type { JsonRpcRequest } from '@metamask/snaps-sdk';

import { Network } from '../../domain';
import { MOCK_EXECUTION_SCENARIOS } from '../../test/mocks/scenarios';
import {
  MOCK_SOLANA_KEYRING_ACCOUNTS,
  MOCK_SOLANA_KEYRING_ACCOUNT_0,
  MOCK_SOLANA_KEYRING_ACCOUNT_1,
  MOCK_SOLANA_KEYRING_ACCOUNT_2,
  MOCK_SOLANA_KEYRING_ACCOUNT_3,
  MOCK_SOLANA_KEYRING_ACCOUNT_4,
} from '../../test/mocks/solana-keyring-accounts';
import { getBip32EntropyMock } from '../../test/mocks/utils/getBip32Entropy';
import type { ILogger } from '../../utils/logger';
import logger from '../../utils/logger';
import type { SolanaConnection } from '../connection';
import type { TransactionHelper } from '../execution/TransactionHelper';
import { createMockConnection } from '../mocks/mockConnection';
import {
  MOCK_SIGN_AND_SEND_TRANSACTION_REQUEST,
  MOCK_SIGN_IN_REQUEST,
  MOCK_SIGN_IN_RESPONSE,
  MOCK_SIGN_MESSAGE_REQUEST,
  MOCK_SIGN_MESSAGE_RESPONSE,
  MOCK_SIGN_TRANSACTION_REQUEST,
  wrapKeyringRequest,
} from './mocks';
import type { SolanaWalletRequest } from './structs';
import { WalletService } from './WalletService';

jest.mock('../../utils/getBip32Entropy', () => ({
  getBip32Entropy: getBip32EntropyMock,
}));

describe('WalletService', () => {
  let mockLogger: ILogger;
  let mockConnection: SolanaConnection;
  let mockTransactionHelper: TransactionHelper;
  let service: WalletService;
  const mockAccounts = [...MOCK_SOLANA_KEYRING_ACCOUNTS];

  beforeEach(() => {
    mockLogger = logger;

    mockConnection = createMockConnection();

    mockTransactionHelper = {
      getLatestBlockhash: jest.fn(),
      getComputeUnitEstimate: jest.fn(),
      partiallySignBase64String: jest.fn(),
      waitForTransactionCommitment: jest.fn(),
    } as unknown as TransactionHelper;

    service = new WalletService(
      mockConnection,
      mockTransactionHelper,
      mockLogger,
    );

    (globalThis as any).snap = {
      request: jest.fn(),
    };
  });

  describe('resolveAccountAddress', () => {
    const scope = Network.Testnet;

    it('rejects invalid requests', async () => {
      const request = {
        id: 1,
        jsonrpc: '2.0',
        method: 'invalid-method',
        params: {},
      } as unknown as SolanaWalletRequest;

      await expect(
        service.resolveAccountAddress(mockAccounts, scope, request),
      ).rejects.toThrow('Unsupported method');
    });

    it('handles SolanaSignIn with valid address', async () => {
      const request = MOCK_SIGN_IN_REQUEST;

      const result = await service.resolveAccountAddress(
        mockAccounts,
        scope,
        request,
      );
      expect(result).toBe(`${scope}:${MOCK_SOLANA_KEYRING_ACCOUNT_2.address}`);
    });

    it('rejects SolanaSignIn without address', async () => {
      const request = {
        id: 1,
        jsonrpc: '2.0',
        method: SolMethod.SignIn,
        params: {},
      } as unknown as SolanaWalletRequest;

      await expect(
        service.resolveAccountAddress(mockAccounts, scope, request),
      ).rejects.toThrow('No address');
    });

    it('handles SolanaSignAndSendTransaction with valid account', async () => {
      const request = MOCK_SIGN_AND_SEND_TRANSACTION_REQUEST;

      const result = await service.resolveAccountAddress(
        mockAccounts,
        scope,
        request,
      );
      expect(result).toBe(`${scope}:${MOCK_SOLANA_KEYRING_ACCOUNT_1.address}`);
    });

    it('handles SolanaSignMessage with valid account', async () => {
      const request = MOCK_SIGN_MESSAGE_REQUEST;

      const result = await service.resolveAccountAddress(
        mockAccounts,
        scope,
        request,
      );
      expect(result).toBe(`${scope}:${MOCK_SOLANA_KEYRING_ACCOUNT_3.address}`);
    });

    it('handles SolanaSignTransaction with valid account', async () => {
      const request = MOCK_SIGN_TRANSACTION_REQUEST;

      const result = await service.resolveAccountAddress(
        mockAccounts,
        scope,
        request,
      );
      expect(result).toBe(`${scope}:${MOCK_SOLANA_KEYRING_ACCOUNT_4.address}`);
    });

    it('rejects request with non-existent account', async () => {
      const request = {
        ...MOCK_SIGN_TRANSACTION_REQUEST,
        params: {
          ...MOCK_SIGN_TRANSACTION_REQUEST.params,
          account: {
            ...MOCK_SIGN_TRANSACTION_REQUEST.params.account,
            address: 'non-existent-address',
          },
        },
      } as unknown as SolanaWalletRequest;

      await expect(
        service.resolveAccountAddress(mockAccounts, scope, request),
      ).rejects.toThrow('Account not found');
    });

    it('rejects when no accounts match scope', async () => {
      const request = MOCK_SIGN_TRANSACTION_REQUEST;

      // Set up the keyring so that the account has a different scope
      const accounts = [
        { ...MOCK_SOLANA_KEYRING_ACCOUNT_0, scopes: [Network.Mainnet] },
      ];

      await expect(
        service.resolveAccountAddress(accounts, scope, request),
      ).rejects.toThrow('No accounts with this scope');
    });
  });

  describe.each(MOCK_EXECUTION_SCENARIOS)(
    'transaction scenarios',
    (scenario) => {
      const {
        name,
        scope,
        fromAccount,
        transactionMessageBase64Encoded,
        signedTransaction,
        signedTransactionBase64Encoded,
        signature,
        getMultipleAccountsResponse,
      } = scenario;

      beforeEach(() => {
        jest
          .spyOn(mockTransactionHelper, 'partiallySignBase64String')
          .mockResolvedValue(signedTransaction);

        jest.spyOn(mockConnection, 'getRpc').mockReturnValue({
          ...mockConnection.getRpc(scope),
          getMultipleAccounts: jest.fn().mockReturnValue({
            send: jest
              .fn()
              .mockResolvedValue(getMultipleAccountsResponse?.result),
          }),
        });
      });

      describe(`signTransaction`, () => {
        it(`Scenario ${name}: returns the signed transaction`, async () => {
          const request = wrapKeyringRequest({
            method: SolMethod.SignTransaction,
            params: {
              account: {
                address: fromAccount.address,
              },
              transaction: transactionMessageBase64Encoded,
              scope,
            },
          });

          const result = await service.signTransaction(fromAccount, request);

          expect(result).toStrictEqual({
            signedTransaction: signedTransactionBase64Encoded,
          });
        });

        it(`Scenario ${name}: rejects invalid requests`, async () => {
          const request = wrapKeyringRequest({
            method: SolMethod.SignTransaction,
            params: {},
          });

          await expect(
            service.signTransaction(fromAccount, request),
          ).rejects.toThrow(/At path/u);
        });
      });

      describe(`Scenario ${name}: signAndSendTransaction`, () => {
        it('returns the signature', async () => {
          const request = wrapKeyringRequest({
            method: SolMethod.SignAndSendTransaction,
            params: {
              account: {
                address: fromAccount.address,
              },
              transaction: transactionMessageBase64Encoded,
              scope,
            },
          });

          const result = await service.signAndSendTransaction(
            fromAccount,
            request,
          );

          expect(result).toStrictEqual({
            signature,
          });
        });

        it('rejects invalid requests', async () => {
          const request = wrapKeyringRequest({
            method: SolMethod.SignAndSendTransaction,
            params: {},
          });

          await expect(
            service.signAndSendTransaction(fromAccount, request),
          ).rejects.toThrow(/At path/u);
        });

        it('defaults commitment to "confirmed" if not provided', async () => {
          const request = wrapKeyringRequest({
            method: SolMethod.SignAndSendTransaction,
            params: {
              account: {
                address: fromAccount.address,
              },
              transaction: transactionMessageBase64Encoded,
              scope,
              options: {},
            },
          });

          await service.signAndSendTransaction(fromAccount, request);

          expect(
            mockTransactionHelper.waitForTransactionCommitment,
          ).toHaveBeenCalledWith(
            expect.any(String),
            'confirmed',
            expect.any(String),
          );
        });

        it('uses the provided commitment if provided', async () => {
          const request = wrapKeyringRequest({
            method: SolMethod.SignAndSendTransaction,
            params: {
              account: {
                address: fromAccount.address,
              },
              transaction: transactionMessageBase64Encoded,
              scope,
              options: {
                commitment: 'finalized',
              },
            },
          });

          await service.signAndSendTransaction(fromAccount, request);

          expect(
            mockTransactionHelper.waitForTransactionCommitment,
          ).toHaveBeenCalledWith(
            expect.any(String),
            'finalized',
            expect.any(String),
          );
        });

        it('defaults commitment to "confirmed" if "processed" is provided', async () => {
          const request = wrapKeyringRequest({
            method: SolMethod.SignAndSendTransaction,
            params: {
              account: {
                address: fromAccount.address,
              },
              transaction: transactionMessageBase64Encoded,
              scope,
              options: {
                commitment: 'processed',
              },
            },
          });

          await service.signAndSendTransaction(fromAccount, request);

          expect(
            mockTransactionHelper.waitForTransactionCommitment,
          ).toHaveBeenCalledWith(
            expect.any(String),
            'confirmed',
            expect.any(String),
          );
        });
      });
    },
  );

  describe('signMessage', () => {
    it('returns the signed message and is properly verified', async () => {
      const account = MOCK_SOLANA_KEYRING_ACCOUNT_3;
      const request = wrapKeyringRequest(
        MOCK_SIGN_MESSAGE_REQUEST as unknown as JsonRpcRequest,
      );

      const result = await service.signMessage(account, request);

      expect(result).toStrictEqual(MOCK_SIGN_MESSAGE_RESPONSE);

      const verified = await service.verifySignature(
        account,
        result.signature,
        result.signedMessage,
      );

      expect(verified).toBe(true);
    });

    it('rejects invalid requests', async () => {
      const account = MOCK_SOLANA_KEYRING_ACCOUNT_0;
      const request = wrapKeyringRequest({
        ...MOCK_SIGN_MESSAGE_REQUEST,
        params: {},
      } as unknown as JsonRpcRequest);

      await expect(service.signMessage(account, request)).rejects.toThrow(
        /At path/u,
      );
    });
  });

  describe('signIn', () => {
    it('returns the signed message', async () => {
      const account = MOCK_SOLANA_KEYRING_ACCOUNT_2;
      const request = wrapKeyringRequest(
        MOCK_SIGN_IN_REQUEST as unknown as JsonRpcRequest,
      );

      const result = await service.signIn(account, request);

      expect(result).toStrictEqual(MOCK_SIGN_IN_RESPONSE);
    });

    it('rejects invalid requests', async () => {
      const account = MOCK_SOLANA_KEYRING_ACCOUNT_0;
      const request = wrapKeyringRequest({
        ...MOCK_SIGN_IN_REQUEST,
        params: undefined,
      } as unknown as JsonRpcRequest);

      await expect(service.signIn(account, request)).rejects.toThrow(
        /At path/u,
      );
    });
  });

  describe('verifySignature', () => {
    it('returns true for a valid signature', async () => {
      const account = MOCK_SOLANA_KEYRING_ACCOUNT_3;

      const result = await service.verifySignature(
        account,
        MOCK_SIGN_MESSAGE_RESPONSE.signature,
        MOCK_SIGN_MESSAGE_RESPONSE.signedMessage,
      );

      expect(result).toBe(true);
    });
  });
});
