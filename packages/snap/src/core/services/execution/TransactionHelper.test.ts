/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-restricted-globals */
/* eslint-disable @typescript-eslint/no-require-imports */
import type { KeyPairSigner } from '@solana/web3.js';
import { createKeyPairSignerFromPrivateKeyBytes } from '@solana/web3.js';

import { Network } from '../../constants/solana';
import {
  MOCK_SOLANA_KEYRING_ACCOUNTS,
  MOCK_SOLANA_KEYRING_ACCOUNTS_PRIVATE_KEY_BYTES,
} from '../../test/mocks/solana-keyring-accounts';
import logger from '../../utils/logger';
import type { SolanaConnection } from '../connection';
import { MOCK_EXECUTION_SCENARIOS } from './mocks/scenarios';
import { MOCK_EXECUTION_SCENARIO_SEND_SOL } from './mocks/scenarios/sendSol';
import { TransactionHelper } from './TransactionHelper';

// Mock dependencies
jest.mock('@solana-program/compute-budget');

jest.mock('@solana/web3.js', () => ({
  ...jest.requireActual('@solana/web3.js'),
  getComputeUnitEstimateForTransactionMessageFactory: jest
    .fn()
    .mockReturnValue(jest.fn().mockResolvedValue(200000)),
  sendTransactionWithoutConfirmingFactory: jest
    .fn()
    .mockReturnValue(jest.fn().mockResolvedValueOnce(undefined)),
}));

jest.mock('../../utils/deriveSolanaPrivateKey', () => ({
  deriveSolanaPrivateKey: jest.fn().mockImplementation((index) => {
    const account = MOCK_SOLANA_KEYRING_ACCOUNTS[index];
    if (!account) {
      throw new Error('[deriveSolanaAddress] Not enough mocked indices');
    }
    return {
      privateKeyBytes:
        MOCK_SOLANA_KEYRING_ACCOUNTS_PRIVATE_KEY_BYTES[account.id],
      publicKeyBytes: null, // We don't need public key bytes for the tests
    };
  }),
}));

describe('TransactionHelper', () => {
  const mockScope = Network.Mainnet;

  const mockRpcResponse = {
    send: jest.fn(),
  };

  const mockConnection = {
    getRpc: jest.fn().mockReturnValue({
      getLatestBlockhash: () => mockRpcResponse,
      getFeeForMessage: () => mockRpcResponse,
      getMultipleAccounts: jest.fn().mockReturnValue({
        send: jest.fn(),
      }),
    }),
  } as unknown as SolanaConnection;

  let transactionHelper: TransactionHelper;

  beforeEach(async () => {
    jest.clearAllMocks();
    transactionHelper = new TransactionHelper(mockConnection, logger);
  });

  describe('getLatestBlockhash', () => {
    it('fetches and returns the latest blockhash', async () => {
      const expectedResponse = {
        blockhash: 'mockBlockhash',
        lastValidBlockHeight: BigInt(100),
      };

      mockRpcResponse.send.mockResolvedValueOnce({ value: expectedResponse });

      const result = await transactionHelper.getLatestBlockhash(mockScope);

      expect(result).toStrictEqual(expectedResponse);
      expect(mockConnection.getRpc).toHaveBeenCalledWith(mockScope);
      expect(mockRpcResponse.send).toHaveBeenCalled();
    });

    it('throws and logs error when fetching blockhash fails', async () => {
      const error = new Error('Network error');
      mockRpcResponse.send.mockRejectedValueOnce(error);

      await expect(
        transactionHelper.getLatestBlockhash(mockScope),
      ).rejects.toThrow('Network error');
    });
  });

  describe('getComputeUnitEstimate', () => {
    it('returns compute unit estimate successfully', async () => {
      const mockTransactionMessage = {} as any;
      const expectedEstimate = 200000;

      const result = await transactionHelper.getComputeUnitEstimate(
        mockTransactionMessage,
        mockScope,
      );

      expect(result).toBe(expectedEstimate);
      expect(mockConnection.getRpc).toHaveBeenCalledWith(mockScope);
    });
  });

  describe('getFeeForMessageInLamports', () => {
    it('returns the fee for a message in lamports', async () => {
      const mockMessage =
        MOCK_EXECUTION_SCENARIO_SEND_SOL.transactionMessageBase64Encoded;
      mockRpcResponse.send.mockResolvedValueOnce({ value: 100000 });

      const result = await transactionHelper.getFeeForMessageInLamports(
        mockMessage,
        mockScope,
      );

      expect(result).toBe(100000);
    });

    it('returns null when the fee cannot be fetched', async () => {
      const mockMessage =
        MOCK_EXECUTION_SCENARIO_SEND_SOL.transactionMessageBase64Encoded;
      mockRpcResponse.send.mockRejectedValueOnce(new Error('Network error'));

      const result = await transactionHelper.getFeeForMessageInLamports(
        mockMessage,
        mockScope,
      );

      expect(result).toBeNull();
    });
  });

  describe('waitForTransactionCommitment', () => {
    it('successfully waits for transaction commitment', async () => {
      const mockSignature = MOCK_EXECUTION_SCENARIO_SEND_SOL.signature;
      const mockTransaction = { blockTime: 123 };
      const mockGetTransactionResponse = {
        send: jest.fn().mockResolvedValue(mockTransaction),
      };

      jest.spyOn(mockConnection, 'getRpc').mockReturnValue({
        getTransaction: () => mockGetTransactionResponse,
      } as any);

      const result = await transactionHelper.waitForTransactionCommitment(
        mockSignature,
        'confirmed',
        mockScope,
      );

      expect(result).toBe(mockTransaction);
      expect(mockConnection.getRpc).toHaveBeenCalledWith(mockScope);
      expect(mockGetTransactionResponse.send).toHaveBeenCalled();
    });

    it('retries on failure before succeeding', async () => {
      const mockSignature = MOCK_EXECUTION_SCENARIO_SEND_SOL.signature;
      const mockTransaction = { blockTime: 123 };
      const mockGetTransactionResponse = {
        send: jest
          .fn()
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce(mockTransaction),
      };

      jest.spyOn(mockConnection, 'getRpc').mockReturnValue({
        getTransaction: () => mockGetTransactionResponse,
      } as any);

      const result = await transactionHelper.waitForTransactionCommitment(
        mockSignature,
        'confirmed',
        mockScope,
      );

      expect(result).toBe(mockTransaction);
      expect(mockGetTransactionResponse.send).toHaveBeenCalledTimes(3);
    });
  });

  // Note the ".each" here
  describe.each(MOCK_EXECUTION_SCENARIOS)('scenarios', (scenario) => {
    const {
      name,
      scope,
      fromAccountPrivateKeyBytes,
      transactionMessage,
      transactionMessageBase64Encoded,
      signedTransaction,
      signature,
      getMultipleAccountsResponse,
    } = scenario;

    let mockSigner: KeyPairSigner;

    beforeEach(async () => {
      jest.clearAllMocks();
      transactionHelper = new TransactionHelper(mockConnection, logger);
      jest.spyOn(mockConnection, 'getRpc').mockReturnValue({
        ...mockConnection.getRpc(mockScope),
        getLatestBlockhash: () => mockRpcResponse,
        getFeeForMessage: () => mockRpcResponse,
        getMultipleAccounts: jest.fn().mockReturnValue({
          send: jest
            .fn()
            .mockResolvedValue(getMultipleAccountsResponse?.result),
        }),
      });
      mockSigner = await createKeyPairSignerFromPrivateKeyBytes(
        fromAccountPrivateKeyBytes,
      );
    });

    describe('signAndSendTransaction', () => {
      it(`Scenario ${name}: successfully sends a transaction and returns signature`, async () => {
        const getSignatureFromTransactionSpy = jest.spyOn(
          require('@solana/web3.js'),
          'getSignatureFromTransaction',
        );

        const result = await transactionHelper.signAndSendTransaction(
          transactionMessage,
          [mockSigner],
          scope,
        );

        expect(getSignatureFromTransactionSpy).toHaveBeenCalledWith(
          signedTransaction,
        );

        expect(result).toBe(signature);
      });
    });

    describe('base64EncodeTransaction', () => {
      it(`Scenario ${name}: encodes a transaction successfully`, async () => {
        const result = await transactionHelper.base64EncodeTransaction(
          transactionMessage,
        );

        expect(result).toBe(transactionMessageBase64Encoded);
      });
    });

    describe('base64DecodeTransaction', () => {
      it(`Scenario ${name}: decodes a transaction successfully`, async () => {
        const result = await transactionHelper.base64DecodeTransaction(
          transactionMessageBase64Encoded,
          scope,
        );

        expect(result).toStrictEqual(transactionMessage);
      });
    });

    describe('signTransaction', () => {
      it(`Scenario ${name}: signs a transaction successfully`, async () => {
        const result = await transactionHelper.signTransaction(
          transactionMessage,
          [mockSigner],
        );

        expect(result).toStrictEqual({
          signature,
          signedTransaction,
        });
      });
    });
  });
});
