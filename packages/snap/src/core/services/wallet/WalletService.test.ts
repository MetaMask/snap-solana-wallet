import { SolMethod } from '@metamask/keyring-api';

import { Network } from '../../constants/solana';
import {
  MOCK_SOLANA_KEYRING_ACCOUNT_0,
  MOCK_SOLANA_KEYRING_ACCOUNT_1,
  MOCK_SOLANA_KEYRING_ACCOUNT_2,
  MOCK_SOLANA_KEYRING_ACCOUNT_3,
  MOCK_SOLANA_KEYRING_ACCOUNT_4,
  MOCK_SOLANA_KEYRING_ACCOUNTS,
} from '../../test/mocks/solana-keyring-accounts';
import { getBip32EntropyMock } from '../../test/mocks/utils/getBip32Entropy';
import logger from '../../utils/logger';
import type { AnalyticsService } from '../analytics/AnalyticsService';
import type { SolanaConnection } from '../connection';
import { createMockConnection } from '../mocks/mockConnection';
import { MOCK_EXECUTION_SCENARIOS } from '../signer/mocks/scenarios';
import type { Signer } from '../signer/Signer';
import type { SignatureMonitor } from '../subscriptions';
import {
  MOCK_SIGN_AND_SEND_TRANSACTION_REQUEST,
  MOCK_SIGN_IN_REQUEST,
  MOCK_SIGN_IN_RESPONSE,
  MOCK_SIGN_MESSAGE_REQUEST,
  MOCK_SIGN_MESSAGE_RESPONSE,
  MOCK_SIGN_TRANSACTION_REQUEST,
} from './mocks';
import type { SolanaWalletRequest } from './structs';
import { WalletService } from './WalletService';

jest.mock('../../utils/getBip32Entropy', () => ({
  getBip32Entropy: getBip32EntropyMock,
}));

jest.mock('@metamask/keyring-snap-sdk', () => ({
  emitSnapKeyringEvent: jest.fn(),
}));

describe('WalletService', () => {
  let mockConnection: SolanaConnection;
  let mockSigner: Signer;
  let mockSignatureMonitor: SignatureMonitor;
  let mockAnalyticsService: AnalyticsService;
  let service: WalletService;
  const mockAccounts = [...MOCK_SOLANA_KEYRING_ACCOUNTS];
  let onCommitmentReachedCallback: (params: any) => Promise<void>;
  const origin = 'https://metamask.io';

  beforeEach(() => {
    mockConnection = createMockConnection();

    mockSigner = {
      partiallySignBase64String: jest.fn(),
    } as unknown as Signer;

    mockSignatureMonitor = {
      monitor: jest.fn(),
    } as unknown as SignatureMonitor;

    // Mock the monitor method to capture the onCommitmentReached callback
    (mockSignatureMonitor.monitor as jest.Mock).mockImplementation(
      async (params) => {
        onCommitmentReachedCallback = params.onCommitmentReached;
        return Promise.resolve();
      },
    );

    mockAnalyticsService = {
      trackEventTransactionSubmitted: jest.fn(),
    } as unknown as AnalyticsService;

    service = new WalletService(
      mockConnection,
      mockSigner,
      mockSignatureMonitor,
      mockAnalyticsService,
      logger,
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

    it('rejects a SignIn request with an address that does not belong to the keyring accounts', async () => {
      const request = {
        ...MOCK_SIGN_IN_REQUEST,
        params: {
          ...MOCK_SIGN_IN_REQUEST.params,
          address: 'non-existent-address',
        },
      } as unknown as SolanaWalletRequest;

      await expect(
        service.resolveAccountAddress(mockAccounts, scope, request),
      ).rejects.toThrow('Account not found');
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
          .spyOn(mockSigner, 'partiallySignBase64String')
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
          const result = await service.signTransaction(
            fromAccount,
            transactionMessageBase64Encoded,
            scope,
            origin,
          );

          expect(result).toStrictEqual({
            signedTransaction: signedTransactionBase64Encoded,
          });
        });

        it('starts monitoring the transaction for commitment "confirmed"', async () => {
          await service.signTransaction(
            fromAccount,
            transactionMessageBase64Encoded,
            scope,
            origin,
          );

          expect(mockSignatureMonitor.monitor).toHaveBeenCalledWith(
            signature,
            fromAccount.id,
            'confirmed',
            scope,
            'https://metamask.io',
          );
        });
      });

      describe(`Scenario ${name}: signAndSendTransaction`, () => {
        it('returns the signature', async () => {
          const result = await service.signAndSendTransaction(
            fromAccount,
            transactionMessageBase64Encoded,
            scope,
            'https://metamask.io',
          );

          expect(result).toStrictEqual({
            signature,
          });
        });

        it('starts monitoring the transaction for commitment "confirmed"', async () => {
          await service.signAndSendTransaction(
            fromAccount,
            transactionMessageBase64Encoded,
            scope,
            'https://metamask.io',
            {},
          );

          expect(mockSignatureMonitor.monitor).toHaveBeenCalledWith(
            signature,
            fromAccount.id,
            'confirmed',
            scope,
            'https://metamask.io',
          );
        });

        it('emits Transaction Submitted event after broadcasting', async () => {
          await service.signAndSendTransaction(
            fromAccount,
            transactionMessageBase64Encoded,
            scope,
            'https://metamask.io',
          );

          expect(
            mockAnalyticsService.trackEventTransactionSubmitted,
          ).toHaveBeenCalledWith(fromAccount, signature, {
            scope,
            origin: 'https://metamask.io',
          });
        });
      });

      describe('signMessage', () => {
        it('returns the signed message and is properly verified', async () => {
          const account = MOCK_SOLANA_KEYRING_ACCOUNT_3;
          const { message } = MOCK_SIGN_MESSAGE_REQUEST.params;

          const result = await service.signMessage(account, message);

          expect(result).toStrictEqual(MOCK_SIGN_MESSAGE_RESPONSE);

          const verified = await service.verifySignature(
            account,
            result.signature,
            result.signedMessage,
          );

          expect(verified).toBe(true);
        });
      });

      describe('signIn', () => {
        it('returns the signed message', async () => {
          const account = MOCK_SOLANA_KEYRING_ACCOUNT_2;
          const { params } = MOCK_SIGN_IN_REQUEST;

          const result = await service.signIn(account, params);

          expect(result).toStrictEqual(MOCK_SIGN_IN_RESPONSE);
        });

        it('sanitizes control characters from sign-in parameters', async () => {
          const account = MOCK_SOLANA_KEYRING_ACCOUNT_2;
          const maliciousParams = {
            domain: 'example.com\n<script>alert(1)</script>',
            address: '5Q444645Hz4hD7AuSj5z8m6jKLd3TxoMwp4Y7UWVKGqy\r\n',
            statement: 'I accept the terms\n\r\n\nof service',
            uri: 'https://example.com/login\r\n',
            version: '1\n',
            chainId: 'solana:101\r\n',
            nonce: '32891756\n',
            issuedAt: '2024-01-01T00:00:00.000Z\r\n',
            expirationTime: '2024-01-02T00:00:00.000Z\n',
            notBefore: '2023-12-31T00:00:00.000Z\r\n',
            requestId: '123\n',
            resources: [
              'https://example.com/resource1\r\n',
              'https://example.com/resource2\n',
            ],
          };

          const result = await service.signIn(account, maliciousParams);

          // The result should still be valid, but the message will be sanitized
          expect(result).toHaveProperty('signature');
          expect(result).toHaveProperty('signedMessage');
          expect(result).toHaveProperty('signatureType', 'ed25519');
          expect(result).toHaveProperty('account');
        });

        it('handles requests with invalid parameters by sanitizing them', async () => {
          const account = MOCK_SOLANA_KEYRING_ACCOUNT_2;
          const invalidParams = {
            domain: '',
            address: 'invalid-address',
            uri: 'not-a-url',
            issuedAt: 'invalid-timestamp',
          };

          // The sanitization should handle invalid parameters gracefully
          // and the sign-in should succeed with sanitized values
          const result = await service.signIn(account, invalidParams);

          expect(result).toHaveProperty('signature');
          expect(result).toHaveProperty('signedMessage');
          expect(result).toHaveProperty('signatureType', 'ed25519');
          expect(result).toHaveProperty('account');
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
    },
  );
});
