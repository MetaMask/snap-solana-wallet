import { getTransferSolInstruction } from '@solana-program/system';
import type { Blockhash } from '@solana/web3.js';
import {
  createKeyPairSignerFromPrivateKeyBytes,
  lamports,
} from '@solana/web3.js';

import { Network } from '../../constants/solana';
import { MOCK_SOLANA_KEYRING_ACCOUNTS } from '../../test/mocks/solana-keyring-accounts';
import logger from '../../utils/logger';
import type { TransactionHelper } from '../transaction-helper/TransactionHelper';
import { TransferSolHelper } from './TransferSolHelper';

// Mock dependencies
jest.mock('@solana/web3.js', () => ({
  ...jest.requireActual('@solana/web3.js'),
  lamports: jest.fn(),
  createKeyPairSignerFromPrivateKeyBytes: jest.fn(),
}));

jest.mock('@solana-program/system');

describe('TransferSolHelper', () => {
  const mockTransactionHelper = {
    getLatestBlockhash: jest.fn(),
    calculateCostInLamports: jest.fn(),
    sendTransaction: jest.fn(),
  } as unknown as TransactionHelper;

  const mockFrom = MOCK_SOLANA_KEYRING_ACCOUNTS[0];
  const mockTo = MOCK_SOLANA_KEYRING_ACCOUNTS[1].address;
  const mockAmount = 1; // 1 SOL
  const mockNetwork = Network.Testnet;

  let transferSolHelper: TransferSolHelper;

  beforeEach(() => {
    jest.clearAllMocks();
    transferSolHelper = new TransferSolHelper(mockTransactionHelper, logger);
  });

  describe('transferSol', () => {
    it('successfully transfers SOL', async () => {
      // Mock return values
      const mockSignature = 'mockSignature123';
      const mockTransactionMessage = {
        /* mock message */
      } as any;

      // Setup mocks
      (lamports as jest.Mock).mockImplementation((value: bigint) => value);

      jest
        .spyOn(transferSolHelper, 'buildTransactionMessage')
        .mockResolvedValue(mockTransactionMessage);

      jest
        .spyOn(mockTransactionHelper, 'sendTransaction')
        .mockResolvedValue(mockSignature);

      // Execute
      const result = await transferSolHelper.transferSol(
        mockFrom,
        mockTo,
        mockAmount,
        mockNetwork,
      );

      // Verify
      expect(result).toBe(mockSignature);
      expect(transferSolHelper.buildTransactionMessage).toHaveBeenCalledWith(
        mockFrom,
        mockTo,
        expect.any(BigInt),
        mockNetwork,
      );
      expect(mockTransactionHelper.sendTransaction).toHaveBeenCalledWith(
        mockTransactionMessage,
        mockNetwork,
      );
    });

    it('throws error when transaction fails', async () => {
      const mockError = new Error('Transaction failed');
      const mockTransactionMessage = {
        /* mock message */
      } as any;

      jest
        .spyOn(transferSolHelper, 'buildTransactionMessage')
        .mockResolvedValue(mockTransactionMessage);

      jest
        .spyOn(mockTransactionHelper, 'sendTransaction')
        .mockRejectedValue(mockError);

      await expect(
        transferSolHelper.transferSol(
          mockFrom,
          mockTo,
          mockAmount,
          mockNetwork,
        ),
      ).rejects.toThrow(mockError);
    });
  });

  describe('buildTransactionMessage', () => {
    it('successfully builds transaction message', async () => {
      // Mock return values
      const mockBlockhash = {
        blockhash: 'blockhash123' as Blockhash,
        lastValidBlockHeight: BigInt(1),
      };

      // Setup mocks
      (createKeyPairSignerFromPrivateKeyBytes as jest.Mock).mockResolvedValue({
        address: mockFrom.address,
      });

      (getTransferSolInstruction as jest.Mock).mockReturnValue({});

      jest
        .spyOn(mockTransactionHelper, 'getLatestBlockhash')
        .mockResolvedValue(mockBlockhash);

      // Execute
      const result = await transferSolHelper.buildTransactionMessage(
        mockFrom,
        mockTo,
        BigInt(mockAmount),
        mockNetwork,
      );

      // Verify
      expect(result).toBeDefined();
      expect(createKeyPairSignerFromPrivateKeyBytes).toHaveBeenCalled();
      expect(getTransferSolInstruction).toHaveBeenCalled();
      expect(mockTransactionHelper.getLatestBlockhash).toHaveBeenCalledWith(
        mockNetwork,
      );
    });

    it('throws error when building message fails', async () => {
      const mockError = new Error('Failed to build message');
      (createKeyPairSignerFromPrivateKeyBytes as jest.Mock).mockRejectedValue(
        mockError,
      );

      await expect(
        transferSolHelper.buildTransactionMessage(
          mockFrom,
          mockTo,
          BigInt(mockAmount),
          mockNetwork,
        ),
      ).rejects.toThrow(mockError);
    });
  });
});
