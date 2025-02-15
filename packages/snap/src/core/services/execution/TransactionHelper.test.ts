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

// Note the ".each" here
describe.each(MOCK_EXECUTION_SCENARIOS)('TransactionHelper', (scenario) => {
  const {
    name,
    scope,
    fromAccountPrivateKeyBytes,
    transactionMessage,
    transactionMessageBase64Encoded,
    signedTransaction,
    signature,
  } = scenario;

  let mockSigner: KeyPairSigner;

  const mockRpcResponse = {
    send: jest.fn(),
  };

  const mockConnection = {
    getRpc: jest.fn().mockReturnValue({
      getLatestBlockhash: () => mockRpcResponse,
      getFeeForMessage: () => mockRpcResponse,
      getMultipleAccounts: () => mockRpcResponse,
    }),
  } as unknown as SolanaConnection;

  let transactionHelper: TransactionHelper;

  beforeEach(async () => {
    jest.clearAllMocks();
    transactionHelper = new TransactionHelper(mockConnection, logger);
    mockSigner = await createKeyPairSignerFromPrivateKeyBytes(
      fromAccountPrivateKeyBytes,
    );
  });

  describe('getLatestBlockhash', () => {
    it(`Scenario ${name}: fetches and returns the latest blockhash`, async () => {
      const expectedResponse = {
        blockhash: 'mockBlockhash',
        lastValidBlockHeight: BigInt(100),
      };

      mockRpcResponse.send.mockResolvedValueOnce({ value: expectedResponse });

      const result = await transactionHelper.getLatestBlockhash(scope);

      expect(result).toStrictEqual(expectedResponse);
      expect(mockConnection.getRpc).toHaveBeenCalledWith(scope);
      expect(mockRpcResponse.send).toHaveBeenCalled();
    });

    it(`Scenario ${name}: throws and logs error when fetching blockhash fails`, async () => {
      const error = new Error('Network error');
      mockRpcResponse.send.mockRejectedValueOnce(error);

      await expect(transactionHelper.getLatestBlockhash(scope)).rejects.toThrow(
        'Network error',
      );
    });
  });

  describe('getComputeUnitEstimate', () => {
    it(`Scenario ${name}: returns compute unit estimate successfully`, async () => {
      const mockTransactionMessage = {} as any;
      const expectedEstimate = 200000;

      const result = await transactionHelper.getComputeUnitEstimate(
        mockTransactionMessage,
        scope,
      );

      expect(result).toBe(expectedEstimate);
      expect(mockConnection.getRpc).toHaveBeenCalledWith(scope);
    });
  });

  describe('sendTransaction', () => {
    it(`Scenario ${name}: successfully sends a transaction and returns signature`, async () => {
      const getSignatureFromTransactionSpy = jest.spyOn(
        require('@solana/web3.js'),
        'getSignatureFromTransaction',
      );

      const result = await transactionHelper.sendTransaction(
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

  describe('getFeeForMessageInLamports', () => {
    it('returns the fee for a message in lamports', async () => {
      mockRpcResponse.send.mockResolvedValueOnce({ value: 100000 });

      const result = await transactionHelper.getFeeForMessageInLamports(
        'mockMessage',
        Network.Mainnet,
      );

      expect(result).toBe(100000);
    });

    it('returns null when the fee cannot be fetched', async () => {
      mockRpcResponse.send.mockRejectedValueOnce(new Error('Network error'));

      const result = await transactionHelper.getFeeForMessageInLamports(
        'mockMessage',
        Network.Mainnet,
      );

      expect(result).toBeNull();
    });
  });
});
