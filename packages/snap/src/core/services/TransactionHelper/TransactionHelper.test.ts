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
    it('should fetch and return the latest blockhash', async () => {
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

    it('should throw and log error when fetching blockhash fails', async () => {
      const error = new Error('Network error');
      mockRpcResponse.send.mockRejectedValueOnce(error);

      await expect(
        transactionHelper.getLatestBlockhash(SolanaCaip2Networks.Mainnet),
      ).rejects.toThrow('Network error');
    });
  });

  describe('calculateCostInLamports', () => {
    const mockTransactionMessage = {};

    it('should calculate transaction cost successfully', async () => {
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

    it('should throw and log error when calculation fails', async () => {
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
});
