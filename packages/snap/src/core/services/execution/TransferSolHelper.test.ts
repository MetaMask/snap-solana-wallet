import { getTransferSolInstruction } from '@solana-program/system';
import type { Blockhash } from '@solana/web3.js';
import {
  address,
  createKeyPairSignerFromPrivateKeyBytes,
} from '@solana/web3.js';
import BigNumber from 'bignumber.js';

import { Network } from '../../constants/solana';
import { MOCK_SOLANA_KEYRING_ACCOUNTS } from '../../test/mocks/solana-keyring-accounts';
import logger from '../../utils/logger';
import type { TransactionHelper } from './TransactionHelper';
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
    getComputeUnitEstimate: jest.fn(),
  } as unknown as TransactionHelper;

  const mockFrom = address(MOCK_SOLANA_KEYRING_ACCOUNTS[0].address);
  const mockTo = address(MOCK_SOLANA_KEYRING_ACCOUNTS[1].address);
  const mockAmount = BigNumber(1); // 1 SOL
  const mockNetwork = Network.Testnet;

  let transferSolHelper: TransferSolHelper;

  beforeEach(() => {
    jest.clearAllMocks();
    transferSolHelper = new TransferSolHelper(mockTransactionHelper, logger);
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
        address: mockFrom,
      });

      (getTransferSolInstruction as jest.Mock).mockReturnValue({});

      jest
        .spyOn(mockTransactionHelper, 'getLatestBlockhash')
        .mockResolvedValue(mockBlockhash);

      jest
        .spyOn(mockTransactionHelper, 'getComputeUnitEstimate')
        .mockResolvedValue(5000);

      // Execute
      const transactionMessage =
        await transferSolHelper.buildTransactionMessage(
          mockFrom,
          mockTo,
          mockAmount,
          mockNetwork,
        );

      // Verify
      expect(transactionMessage).toBeDefined();
      expect(getTransferSolInstruction).toHaveBeenCalled();
      expect(mockTransactionHelper.getLatestBlockhash).toHaveBeenCalledWith(
        mockNetwork,
      );
    });

    it('throws error when building message fails', async () => {
      const mockError = new Error('Failed to fetch blockhash');
      (mockTransactionHelper.getLatestBlockhash as jest.Mock).mockRejectedValue(
        mockError,
      );

      await expect(
        transferSolHelper.buildTransactionMessage(
          mockFrom,
          mockTo,
          mockAmount,
          mockNetwork,
        ),
      ).rejects.toThrow(mockError);
    });
  });
});
