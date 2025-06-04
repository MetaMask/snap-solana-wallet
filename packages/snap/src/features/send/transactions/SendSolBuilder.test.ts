import { address } from '@solana/kit';
import BigNumber from 'bignumber.js';

import { Network } from '../../../core/domain';
import { createMockConnection } from '../../../core/services/mocks/mockConnection';
import { MOCK_SOLANA_KEYRING_ACCOUNTS } from '../../../core/test/mocks/solana-keyring-accounts';
import logger from '../../../core/utils/logger';
import { SendSolBuilder } from './SendSolBuilder';

describe('SendSolBuilder', () => {
  const mockConnection = createMockConnection();

  const mockFrom = MOCK_SOLANA_KEYRING_ACCOUNTS[0];
  const mockTo = address(MOCK_SOLANA_KEYRING_ACCOUNTS[1].address);
  const mockAmount = BigNumber(1); // 1 SOL
  const mockNetwork = Network.Testnet;

  let sendSolBuilder: SendSolBuilder;

  beforeEach(() => {
    jest.clearAllMocks();
    sendSolBuilder = new SendSolBuilder(mockConnection, logger);
  });

  describe('buildTransactionMessage', () => {
    it('successfully builds transaction message', async () => {
      const transactionMessage = await sendSolBuilder.buildTransactionMessage({
        from: mockFrom,
        to: mockTo,
        amount: mockAmount,
        network: mockNetwork,
      });

      expect(transactionMessage).toStrictEqual({
        instructions: [
          {
            programAddress: 'ComputeBudget111111111111111111111111111111',
            data: new Uint8Array([2, 194, 1, 0, 0]),
          },
          {
            programAddress: 'ComputeBudget111111111111111111111111111111',
            data: new Uint8Array([3, 16, 39, 0, 0, 0, 0, 0, 0]),
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
            data: new Uint8Array([2, 0, 0, 0, 0, 202, 154, 59, 0, 0, 0, 0]),
          },
        ],
        version: 0,
        feePayer: {
          address: 'BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP',
        },
        lifetimeConstraint: {
          blockhash: '8HSvyvQvdRoFkCPnrtqF3dAS4SpPEbMKUVTdrK9auMR',
          lastValidBlockHeight: 334650256n,
        },
      });
    });

    it('throws error when building message fails', async () => {
      const mockError = new Error('Failed to fetch blockhash');
      (
        mockConnection.getRpc(mockNetwork).getLatestBlockhash()
          .send as jest.Mock
      ).mockRejectedValue(mockError);

      await expect(
        sendSolBuilder.buildTransactionMessage({
          from: mockFrom,
          to: mockTo,
          amount: mockAmount,
          network: mockNetwork,
        }),
      ).rejects.toThrow(mockError);
    });
  });
});
