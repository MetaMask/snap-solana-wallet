import type { Blockhash } from '@solana/kit';
import { address } from '@solana/kit';
import BigNumber from 'bignumber.js';

import { Network } from '../../../constants/solana';
import { MOCK_SOLANA_KEYRING_ACCOUNTS } from '../../../test/mocks/solana-keyring-accounts';
import logger from '../../../utils/logger';
import type { TransactionHelper } from '../TransactionHelper';
import { SendSolBuilder } from './SendSolBuilder';

describe('SendSolBuilder', () => {
  const mockTransactionHelper = {
    getLatestBlockhash: jest.fn(),
    sendTransaction: jest.fn(),
    getComputeUnitEstimate: jest.fn(),
  } as unknown as TransactionHelper;

  const mockFrom = address(MOCK_SOLANA_KEYRING_ACCOUNTS[0].address);
  const mockTo = address(MOCK_SOLANA_KEYRING_ACCOUNTS[1].address);
  const mockAmount = BigNumber(1); // 1 SOL
  const mockNetwork = Network.Testnet;

  let sendSolBuilder: SendSolBuilder;

  beforeEach(() => {
    jest.clearAllMocks();
    sendSolBuilder = new SendSolBuilder(mockTransactionHelper, logger);
  });

  describe('buildTransactionMessage', () => {
    it('successfully builds transaction message', async () => {
      // Mock return values
      const mockBlockhash = {
        blockhash: 'blockhash123' as Blockhash,
        lastValidBlockHeight: BigInt(1),
      };

      jest
        .spyOn(mockTransactionHelper, 'getLatestBlockhash')
        .mockResolvedValue(mockBlockhash);

      jest
        .spyOn(mockTransactionHelper, 'getComputeUnitEstimate')
        .mockResolvedValue(5000);

      // Execute
      const transactionMessage = await sendSolBuilder.buildTransactionMessage(
        mockFrom,
        mockTo,
        mockAmount,
        mockNetwork,
      );

      // Verify
      expect(transactionMessage).toStrictEqual({
        version: 0,
        feePayer: { address: 'BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP' },
        lifetimeConstraint: {
          blockhash: 'blockhash123',
          lastValidBlockHeight: 1n,
        },
        instructions: [
          {
            programAddress: 'ComputeBudget111111111111111111111111111111',
            data: Uint8Array.from([2, 136, 19, 0, 0]),
          },
          {
            accounts: [
              {
                address: 'BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP',
                role: 3,
                signer: {
                  address: 'BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP',
                  signMessages: expect.any(Function),
                  signTransactions: expect.any(Function),
                },
              },
              {
                address: 'FvS1p2dQnhWNrHyuVpJRU5mkYRkSTrubXHs4XrAn3PGo',
                role: 1,
              },
            ],
            programAddress: '11111111111111111111111111111111',
            data: Uint8Array.from([2, 0, 0, 0, 0, 202, 154, 59, 0, 0, 0, 0]),
          },
        ],
      });
    });

    it('throws error when building message fails', async () => {
      const mockError = new Error('Failed to fetch blockhash');
      (mockTransactionHelper.getLatestBlockhash as jest.Mock).mockRejectedValue(
        mockError,
      );

      await expect(
        sendSolBuilder.buildTransactionMessage(
          mockFrom,
          mockTo,
          mockAmount,
          mockNetwork,
        ),
      ).rejects.toThrow(mockError);
    });
  });
});
