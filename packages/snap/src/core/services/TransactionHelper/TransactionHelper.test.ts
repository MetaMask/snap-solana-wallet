import {
  getSignatureFromTransaction,
  sendTransactionWithoutConfirmingFactory,
  signTransactionMessageWithSigners,
} from '@solana/web3.js';

import { SolanaCaip2Networks } from '../../constants/solana';
import logger from '../../utils/logger';
import type { SolanaConnection } from '../connection';
import { TransactionHelper } from './TransactionHelper';

// Mock dependencies
jest.mock('@solana-program/compute-budget');
jest.mock('@solana/web3.js', () => ({
  compileTransactionMessage: jest.fn(),
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
  address: jest.fn().mockImplementation((address) => address),
}));

describe('TransactionHelper', () => {
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

  beforeEach(() => {
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

      const result = await transactionHelper.getLatestBlockhash(
        SolanaCaip2Networks.Mainnet,
      );

      expect(result).toStrictEqual(expectedResponse);
      expect(mockConnection.getRpc).toHaveBeenCalledWith(
        SolanaCaip2Networks.Mainnet,
      );
      expect(mockRpcResponse.send).toHaveBeenCalled();
    });

    it('throws and logs error when fetching blockhash fails', async () => {
      const error = new Error('Network error');
      mockRpcResponse.send.mockRejectedValueOnce(error);

      await expect(
        transactionHelper.getLatestBlockhash(SolanaCaip2Networks.Mainnet),
      ).rejects.toThrow('Network error');
    });
  });

  describe('calculateCostInLamports', () => {
    const mockTransactionMessage = {};

    it('calculates transaction cost successfully', async () => {
      const expectedCost = '5000';
      mockRpcResponse.send.mockResolvedValueOnce({ value: expectedCost });

      const result = await transactionHelper.calculateCostInLamports(
        mockTransactionMessage as any,
        SolanaCaip2Networks.Mainnet,
      );

      expect(result).toStrictEqual(expectedCost);
      expect(logger.log).toHaveBeenCalledTimes(3);
      expect(mockConnection.getRpc).toHaveBeenCalledWith(
        SolanaCaip2Networks.Mainnet,
      );
    });

    it('throws and logs error when calculation fails', async () => {
      const error = new Error('Calculation error');
      mockRpcResponse.send.mockRejectedValueOnce(error);

      await expect(
        transactionHelper.calculateCostInLamports(
          mockTransactionMessage as any,
          SolanaCaip2Networks.Mainnet,
        ),
      ).rejects.toThrow('Calculation error');

      expect(logger.error).toHaveBeenCalledWith(error);
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
        SolanaCaip2Networks.Mainnet,
      );

      expect(result).toBe(expectedSignature);
      expect(signTransactionMessageWithSigners).toHaveBeenCalledWith(
        mockTransactionMessage,
      );
      expect(getSignatureFromTransaction).toHaveBeenCalledWith(
        mockSignedTransaction,
      );
      expect(logger.info).toHaveBeenCalledWith(
        `Sending transaction: https://explorer.solana.com/tx/${expectedSignature}`,
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
          SolanaCaip2Networks.Mainnet,
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
        SolanaCaip2Networks.Devnet,
      );

      expect(logger.info).toHaveBeenCalledWith(
        `Sending transaction: https://explorer.solana.com/tx/${expectedSignature}?cluster=devnet`,
      );
    });
  });
});
