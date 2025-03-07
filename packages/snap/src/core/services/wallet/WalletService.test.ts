import type { SLIP10PathNode, SupportedCurve } from '@metamask/key-tree';
import { SLIP10Node } from '@metamask/key-tree';
import { SolMethod } from '@metamask/keyring-api';
import type { JsonRpcRequest } from '@metamask/snaps-sdk';

import { Network } from '../../constants/solana';
import {
  MOCK_SEED_PHRASE_BYTES,
  MOCK_SOLANA_KEYRING_ACCOUNT_0,
  MOCK_SOLANA_KEYRING_ACCOUNT_1,
  MOCK_SOLANA_KEYRING_ACCOUNT_2,
  MOCK_SOLANA_KEYRING_ACCOUNT_3,
  MOCK_SOLANA_KEYRING_ACCOUNT_4,
  MOCK_SOLANA_KEYRING_ACCOUNTS,
} from '../../test/mocks/solana-keyring-accounts';
import type { ILogger } from '../../utils/logger';
import logger from '../../utils/logger';
import { EncryptedState } from '../encrypted-state/EncryptedState';
import type { FromBase64EncodedBuilder } from '../execution/builders/FromBase64EncodedBuilder';
import type { TransactionHelper } from '../execution/TransactionHelper';
import {
  MOCK_SIGN_AND_SEND_TRANSACTION_REQUEST,
  MOCK_SIGN_AND_SEND_TRANSACTION_RESPONSE,
  MOCK_SIGN_IN_REQUEST,
  MOCK_SIGN_IN_RESPONSE,
  MOCK_SIGN_MESSAGE_REQUEST,
  MOCK_SIGN_MESSAGE_RESPONSE,
  MOCK_SIGN_TRANSACTION_REQUEST,
  MOCK_SIGN_TRANSACTION_RESPONSE,
  wrapKeyringRequest,
} from './mocks';
import type { SolanaWalletRequest } from './structs';
import { WalletService } from './WalletService';

jest.mock('../../utils/getBip32Entropy', () => ({
  getBip32Entropy: jest
    .fn()
    .mockImplementation(async (path: string[], curve: SupportedCurve) => {
      return await SLIP10Node.fromDerivationPath({
        derivationPath: [
          MOCK_SEED_PHRASE_BYTES,
          ...path.slice(1).map((node) => `slip10:${node}` as SLIP10PathNode),
        ],
        curve,
      });
    }),
}));

describe('WalletService', () => {
  let mockLogger: ILogger;
  let mockState: EncryptedState;
  let mockTransactionHelper: TransactionHelper;
  let mockFromBase64EncodedBuilder: FromBase64EncodedBuilder;
  let service: WalletService;
  const scope = Network.Testnet;
  const mockAccounts = [...MOCK_SOLANA_KEYRING_ACCOUNTS];

  beforeEach(() => {
    mockLogger = logger;
    mockState = new EncryptedState();

    mockTransactionHelper = {
      getLatestBlockhash: jest.fn(),
      getComputeUnitEstimate: jest.fn(),
      sendTransaction: jest.fn(),
      base64DecodeTransaction: jest.fn(),
      getFeeForMessageInLamports: jest.fn(),
      waitForTransactionCommitment: jest.fn(),
    } as unknown as TransactionHelper;

    mockFromBase64EncodedBuilder = {
      buildTransactionMessage: jest.fn(),
    } as unknown as FromBase64EncodedBuilder;

    service = new WalletService(
      mockFromBase64EncodedBuilder,
      mockTransactionHelper,
      mockLogger,
    );

    (globalThis as any).snap = {
      request: jest.fn(),
    };
  });

  describe('resolveAccountAddress', () => {
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

  describe('signTransaction', () => {
    it('returns the signed transaction', async () => {
      const account = MOCK_SOLANA_KEYRING_ACCOUNT_0;
      const request = wrapKeyringRequest(
        MOCK_SIGN_TRANSACTION_REQUEST as unknown as JsonRpcRequest,
      );

      const result = await service.signTransaction(account, request);

      expect(result).toStrictEqual(MOCK_SIGN_TRANSACTION_RESPONSE);
    });

    it('rejects invalid requests', async () => {
      const account = MOCK_SOLANA_KEYRING_ACCOUNT_0;
      const request = wrapKeyringRequest({
        ...MOCK_SIGN_TRANSACTION_REQUEST,
        params: {},
      } as unknown as JsonRpcRequest);

      await expect(service.signTransaction(account, request)).rejects.toThrow(
        /At path/u,
      );
    });
  });

  describe('signAndSendTransaction', () => {
    it('returns the signed transaction', async () => {
      const account = MOCK_SOLANA_KEYRING_ACCOUNT_0;
      const request = wrapKeyringRequest(
        MOCK_SIGN_AND_SEND_TRANSACTION_REQUEST as unknown as JsonRpcRequest,
      );
      const mockSignature = MOCK_SIGN_AND_SEND_TRANSACTION_RESPONSE.signature;

      jest
        .spyOn(mockTransactionHelper, 'sendTransaction')
        .mockResolvedValue(mockSignature);

      const result = await service.signAndSendTransaction(account, request);

      expect(result).toStrictEqual({
        signature: mockSignature,
      });
    });

    it('rejects invalid requests', async () => {
      const account = MOCK_SOLANA_KEYRING_ACCOUNT_0;
      const request = wrapKeyringRequest({
        ...MOCK_SIGN_AND_SEND_TRANSACTION_REQUEST,
        params: {},
      } as unknown as JsonRpcRequest);

      await expect(
        service.signAndSendTransaction(account, request),
      ).rejects.toThrow(/At path/u);
    });
  });

  describe('signMessage', () => {
    it('returns the signed message', async () => {
      const account = MOCK_SOLANA_KEYRING_ACCOUNT_0;
      const request = wrapKeyringRequest(
        MOCK_SIGN_MESSAGE_REQUEST as unknown as JsonRpcRequest,
      );

      const result = await service.signMessage(account, request);

      expect(result).toStrictEqual(MOCK_SIGN_MESSAGE_RESPONSE);
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
      const account = MOCK_SOLANA_KEYRING_ACCOUNT_0;
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
        params: {},
      } as unknown as JsonRpcRequest);

      await expect(service.signIn(account, request)).rejects.toThrow(
        /At path/u,
      );
    });
  });
});
