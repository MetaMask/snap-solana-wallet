import { getTransferSolInstruction } from '@solana-program/system';
import type { Blockhash } from '@solana/web3.js';
import {
  createKeyPairSignerFromPrivateKeyBytes,
  getSignatureFromTransaction,
  lamports,
  sendTransactionWithoutConfirmingFactory,
  signTransactionMessageWithSigners,
} from '@solana/web3.js';

import { Network } from '../../constants/solana';
import { MOCK_SOLANA_KEYRING_ACCOUNTS } from '../../test/mocks/solana-keyring-accounts';
import logger from '../../utils/logger';
import type { SolanaConnection } from '../connection';
import type { TransactionHelper } from '../transaction-helper/TransactionHelper';
import { TransferSolHelper } from './TransferSolHelper';

// Mock dependencies
jest.mock('@solana/web3.js', () => ({
  ...jest.requireActual('@solana/web3.js'),
  lamports: jest.fn(),
  createKeyPairSignerFromPrivateKeyBytes: jest.fn(),
  getSignatureFromTransaction: jest.fn(),
  sendTransactionWithoutConfirmingFactory: jest.fn(),
  signTransactionMessageWithSigners: jest.fn(),
}));

jest.mock('@solana-program/system');

describe('TransferSolHelper', () => {
  const mockTransactionHelper = {
    getLatestBlockhash: jest.fn(),
    calculateCostInLamports: jest.fn(),
  } as unknown as TransactionHelper;

  const mockConnection = {
    getRpc: jest.fn(),
  } as unknown as SolanaConnection;

  const mockFrom = MOCK_SOLANA_KEYRING_ACCOUNTS[0];
  const mockTo = MOCK_SOLANA_KEYRING_ACCOUNTS[1].address;
  const mockAmount = 1; // 1 SOL
  const mockNetwork = Network.Testnet;

  let transferSolHelper: TransferSolHelper;

  beforeEach(() => {
    jest.clearAllMocks();
    transferSolHelper = new TransferSolHelper(
      mockTransactionHelper,
      mockConnection,
      logger,
    );
  });

  describe('transferSol', () => {
    it('successfully transfers SOL', async () => {
      // Mock return values
      const mockSignature = 'mockSignature123';
      const mockSignedTransaction = { signature: mockSignature };

      // Setup mocks
      (lamports as jest.Mock).mockImplementation((value: bigint) => value);

      (createKeyPairSignerFromPrivateKeyBytes as jest.Mock).mockResolvedValue({
        address: mockFrom.address,
      });

      (getTransferSolInstruction as jest.Mock).mockReturnValue({});

      jest
        .spyOn(mockTransactionHelper, 'getLatestBlockhash')
        .mockResolvedValue({
          blockhash: 'blockhash123' as Blockhash,
          lastValidBlockHeight: BigInt(1),
        });

      jest
        .spyOn(mockTransactionHelper, 'calculateCostInLamports')
        .mockResolvedValue('5000');

      jest
        .spyOn(mockConnection, 'getRpc')
        .mockReturnValue({ url: 'https://mock-rpc.com' } as any);

      (signTransactionMessageWithSigners as jest.Mock).mockResolvedValue(
        mockSignedTransaction,
      );

      (getSignatureFromTransaction as jest.Mock).mockReturnValue(mockSignature);

      (sendTransactionWithoutConfirmingFactory as jest.Mock).mockReturnValue(
        jest.fn().mockResolvedValue(undefined),
      );

      // Execute
      const result = await transferSolHelper.transferSol(
        mockFrom,
        mockTo,
        mockAmount,
        mockNetwork,
      );

      // Verify
      expect(result).toBe(mockSignature);
    });

    it('throws error when transaction fails', async () => {
      (createKeyPairSignerFromPrivateKeyBytes as jest.Mock).mockResolvedValue({
        address: mockFrom.address,
      });

      const mockError = new Error('Transaction failed');
      (sendTransactionWithoutConfirmingFactory as jest.Mock).mockReturnValue(
        jest.fn().mockRejectedValue(mockError),
      );

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
});
