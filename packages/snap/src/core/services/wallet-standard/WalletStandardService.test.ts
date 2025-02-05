import type { JsonRpcRequest } from '@metamask/snaps-sdk';
import { SolanaSignIn } from '@solana/wallet-standard-core';

import { Network } from '../../constants/solana';
import {
  MOCK_SOLANA_KEYRING_ACCOUNT_0,
  MOCK_SOLANA_KEYRING_ACCOUNT_1,
  MOCK_SOLANA_KEYRING_ACCOUNT_2,
  MOCK_SOLANA_KEYRING_ACCOUNT_3,
  MOCK_SOLANA_KEYRING_ACCOUNT_4,
  MOCK_SOLANA_KEYRING_ACCOUNTS,
} from '../../test/mocks/solana-keyring-accounts';
import type { ILogger } from '../../utils/logger';
import {
  MOCK_SIGN_AND_SEND_ALL_TRANSACTIONS_REQUEST,
  MOCK_SIGN_AND_SEND_TRANSACTION_REQUEST,
  MOCK_SIGN_IN_REQUEST,
  MOCK_SIGN_MESSAGE_REQUEST,
  MOCK_SIGN_TRANSACTION_REQUEST,
} from './mocks';
import { WalletStandardService } from './WalletStandardService';

describe('WalletStandardService', () => {
  let mockLogger: ILogger;
  let service: WalletStandardService;
  const scope = 'solana:4uhcVJyU9pJkvQyS88uRDiswHXSCkY3z';
  const mockAccounts = [...MOCK_SOLANA_KEYRING_ACCOUNTS];

  beforeEach(() => {
    mockLogger = {
      warn: jest.fn(),
      error: jest.fn(),
      info: jest.fn(),
      debug: jest.fn(),
      log: jest.fn(),
    } as unknown as ILogger;

    service = new WalletStandardService(mockLogger);
  });

  describe('resolveAccountAddress', () => {
    it('rejects invalid requests', async () => {
      const request: JsonRpcRequest = {
        id: 1,
        jsonrpc: '2.0',
        method: 'invalid-method',
        params: {},
      };

      await expect(
        service.resolveAccountAddress(mockAccounts, scope, request),
      ).rejects.toThrow(
        'Expected the value to satisfy a union of `object | object | object | object | object`, but received: [object Object]',
      );
    });

    it('handles SignAndSendAllTransactions with same account', async () => {
      const request =
        MOCK_SIGN_AND_SEND_ALL_TRANSACTIONS_REQUEST as unknown as JsonRpcRequest;

      const result = await service.resolveAccountAddress(
        mockAccounts,
        scope,
        request,
      );
      expect(result).toBe(`${scope}:${MOCK_SOLANA_KEYRING_ACCOUNT_0.address}`);
    });

    it('rejects SignAndSendAllTransactions with different accounts', async () => {
      // Create a request with 2 different accounts
      const request = {
        ...MOCK_SIGN_AND_SEND_ALL_TRANSACTIONS_REQUEST,
        params: [
          MOCK_SIGN_AND_SEND_ALL_TRANSACTIONS_REQUEST.params[0],
          {
            account: {
              address: 'some-other-address',
              publicKey: new Uint8Array(),
              chains: [],
              features: [],
            },
            transaction: new TextEncoder().encode('transaction-1'),
          },
        ],
      } as unknown as JsonRpcRequest;

      await expect(
        service.resolveAccountAddress(mockAccounts, scope, request),
      ).rejects.toThrow('All accounts must be the same');
    });

    it('rejects SignAndSendAllTransactions with empty accounts array', async () => {
      const request = {
        ...MOCK_SIGN_AND_SEND_ALL_TRANSACTIONS_REQUEST,
        params: [],
      } as unknown as JsonRpcRequest;

      await expect(
        service.resolveAccountAddress(mockAccounts, scope, request),
      ).rejects.toThrow('No accounts');
    });

    it('handles SolanaSignIn with valid address', async () => {
      const request = MOCK_SIGN_IN_REQUEST as unknown as JsonRpcRequest;

      const result = await service.resolveAccountAddress(
        mockAccounts,
        scope,
        request,
      );
      expect(result).toBe(`${scope}:${MOCK_SOLANA_KEYRING_ACCOUNT_2.address}`);
    });

    it('rejects SolanaSignIn without address', async () => {
      const request: JsonRpcRequest = {
        id: 1,
        jsonrpc: '2.0',
        method: SolanaSignIn,
        params: {},
      };

      await expect(
        service.resolveAccountAddress(mockAccounts, scope, request),
      ).rejects.toThrow('No address');
    });

    it('handles SolanaSignAndSendTransaction with valid account', async () => {
      const request =
        MOCK_SIGN_AND_SEND_TRANSACTION_REQUEST as unknown as JsonRpcRequest;

      const result = await service.resolveAccountAddress(
        mockAccounts,
        scope,
        request,
      );
      expect(result).toBe(`${scope}:${MOCK_SOLANA_KEYRING_ACCOUNT_1.address}`);
    });

    it('handles SolanaSignMessage with valid account', async () => {
      const request = MOCK_SIGN_MESSAGE_REQUEST as unknown as JsonRpcRequest;

      const result = await service.resolveAccountAddress(
        mockAccounts,
        scope,
        request,
      );
      expect(result).toBe(`${scope}:${MOCK_SOLANA_KEYRING_ACCOUNT_3.address}`);
    });

    it('handles SolanaSignTransaction with valid account', async () => {
      const request =
        MOCK_SIGN_TRANSACTION_REQUEST as unknown as JsonRpcRequest;

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
      } as unknown as JsonRpcRequest;

      await expect(
        service.resolveAccountAddress(mockAccounts, scope, request),
      ).rejects.toThrow('Account not found');
    });

    it('rejects when no accounts match scope', async () => {
      const request =
        MOCK_SIGN_TRANSACTION_REQUEST as unknown as JsonRpcRequest;

      // Set up the keyring so that the account has a different scope
      const accounts = [
        { ...MOCK_SOLANA_KEYRING_ACCOUNT_0, scopes: [Network.Mainnet] },
      ];

      await expect(
        service.resolveAccountAddress(accounts, scope, request),
      ).rejects.toThrow('No accounts with this scope');
    });
  });
});
