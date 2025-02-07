import type { KeyPairSigner } from '@solana/web3.js';
import {
  createKeyPairSignerFromPrivateKeyBytes,
  getSignatureFromTransaction,
  sendTransactionWithoutConfirmingFactory,
  signTransactionMessageWithSigners,
} from '@solana/web3.js';

import { Network } from '../../constants/solana';
import {
  MOCK_SOLANA_KEYRING_ACCOUNT_0_PRIVATE_KEY_BYTES,
  MOCK_SOLANA_KEYRING_ACCOUNTS,
  MOCK_SOLANA_KEYRING_ACCOUNTS_PRIVATE_KEY_BYTES,
} from '../../test/mocks/solana-keyring-accounts';
import logger from '../../utils/logger';
import type { SolanaConnection } from '../connection';
import { TransactionHelper } from './TransactionHelper';

// Mock dependencies
jest.mock('@solana-program/compute-budget');

jest.mock('@solana/web3.js', () => ({
  ...jest.requireActual('@solana/web3.js'),
  getBase64Decoder: () => ({
    decode: jest.fn().mockReturnValue('base64EncodedMessage'),
  }),
  getCompiledTransactionMessageEncoder: () => ({
    encode: jest.fn().mockReturnValue(new Uint8Array()),
  }),
  getComputeUnitEstimateForTransactionMessageFactory: jest
    .fn()
    .mockReturnValue(jest.fn().mockResolvedValue(200000)),
  pipe: (...fns: any[]) => fns[fns.length - 1],
  prependTransactionMessageInstructions: jest.fn().mockReturnValue({}),
  isSolanaError: jest.fn().mockReturnValue(false),
  signTransactionMessageWithSigners: jest.fn(),
  getSignatureFromTransaction: jest.fn(),
  sendTransactionWithoutConfirmingFactory: jest.fn(),
}));

jest.mock('../../utils/deriveSolanaPrivateKey', () => ({
  deriveSolanaPrivateKey: jest.fn().mockImplementation((index) => {
    const account = MOCK_SOLANA_KEYRING_ACCOUNTS[index];
    if (!account) {
      throw new Error('[deriveSolanaAddress] Not enough mocked indices');
    }
    return MOCK_SOLANA_KEYRING_ACCOUNTS_PRIVATE_KEY_BYTES[account.id];
  }),
}));

describe('TransactionHelper', () => {
  let mockSigner: KeyPairSigner;

  const mockRpcResponse = {
    send: jest.fn(),
  };

  const mockConnection = {
    getRpc: jest.fn().mockReturnValue({
      getLatestBlockhash: () => mockRpcResponse,
      getFeeForMessage: () => mockRpcResponse,
    }),
  } as unknown as SolanaConnection;

  let transactionHelper: TransactionHelper;

  beforeEach(async () => {
    jest.clearAllMocks();
    transactionHelper = new TransactionHelper(mockConnection, logger);
    mockSigner = await createKeyPairSignerFromPrivateKeyBytes(
      MOCK_SOLANA_KEYRING_ACCOUNT_0_PRIVATE_KEY_BYTES,
    );
  });

  describe('getLatestBlockhash', () => {
    it('fetches and returns the latest blockhash', async () => {
      const expectedResponse = {
        blockhash: 'mockBlockhash',
        lastValidBlockHeight: BigInt(100),
      };

      mockRpcResponse.send.mockResolvedValueOnce({ value: expectedResponse });

      const result = await transactionHelper.getLatestBlockhash(
        Network.Mainnet,
      );

      expect(result).toStrictEqual(expectedResponse);
      expect(mockConnection.getRpc).toHaveBeenCalledWith(Network.Mainnet);
      expect(mockRpcResponse.send).toHaveBeenCalled();
    });

    it('throws and logs error when fetching blockhash fails', async () => {
      const error = new Error('Network error');
      mockRpcResponse.send.mockRejectedValueOnce(error);

      await expect(
        transactionHelper.getLatestBlockhash(Network.Mainnet),
      ).rejects.toThrow('Network error');
    });
  });

  describe('getComputeUnitEstimate', () => {
    it('returns compute unit estimate successfully', async () => {
      const mockTransactionMessage = {} as any;
      const expectedEstimate = 200000;

      const result = await transactionHelper.getComputeUnitEstimate(
        mockTransactionMessage,
        Network.Mainnet,
      );

      expect(result).toBe(expectedEstimate);
      expect(mockConnection.getRpc).toHaveBeenCalledWith(Network.Mainnet);
    });
  });

  describe('sendTransaction', () => {
    const mockTransactionMessage = {
      instructions: [],
      version: 0,
    } as any;

    it('successfully sends a transaction and returns signature', async () => {
      const expectedSignature = 'mockSignature123';

      // Mock the web3.js functions
      const mockSignedTransaction = new Uint8Array();
      (signTransactionMessageWithSigners as jest.Mock).mockResolvedValueOnce(
        mockSignedTransaction,
      );
      (getSignatureFromTransaction as jest.Mock).mockReturnValueOnce(
        expectedSignature,
      );
      (sendTransactionWithoutConfirmingFactory as jest.Mock).mockReturnValue(
        jest.fn().mockResolvedValueOnce(undefined),
      );

      const result = await transactionHelper.sendTransaction(
        mockTransactionMessage,
        [mockSigner],
        Network.Mainnet,
      );

      expect(result).toBe(expectedSignature);
      expect(signTransactionMessageWithSigners).toHaveBeenCalledWith(
        mockTransactionMessage,
      );
      expect(getSignatureFromTransaction).toHaveBeenCalledWith(
        mockSignedTransaction,
      );
      expect(logger.info).toHaveBeenCalledWith(
        `Sending transaction: https://explorer.solana.com/tx/${expectedSignature}?cluster=mainnet`,
      );
    });

    it('throws and logs error when transaction fails', async () => {
      const error = new Error('Transaction failed');
      (signTransactionMessageWithSigners as jest.Mock).mockResolvedValueOnce(
        new Uint8Array(),
      );
      (getSignatureFromTransaction as jest.Mock).mockReturnValueOnce(
        'mockSignature',
      );
      (sendTransactionWithoutConfirmingFactory as jest.Mock).mockReturnValue(
        jest.fn().mockRejectedValueOnce(error),
      );

      await expect(
        transactionHelper.sendTransaction(
          mockTransactionMessage,
          [mockSigner],
          Network.Mainnet,
        ),
      ).rejects.toThrow('Transaction failed');
    });

    it('uses correct cluster in explorer URL for different networks', async () => {
      const expectedSignature = 'mockSignature123';
      (signTransactionMessageWithSigners as jest.Mock).mockResolvedValueOnce(
        new Uint8Array(),
      );
      (getSignatureFromTransaction as jest.Mock).mockReturnValueOnce(
        expectedSignature,
      );
      (sendTransactionWithoutConfirmingFactory as jest.Mock).mockReturnValue(
        jest.fn().mockResolvedValueOnce(undefined),
      );

      await transactionHelper.sendTransaction(
        mockTransactionMessage,
        [mockSigner],
        Network.Devnet,
      );

      expect(logger.info).toHaveBeenCalledWith(
        `Sending transaction: https://explorer.solana.com/tx/${expectedSignature}?cluster=devnet`,
      );
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
