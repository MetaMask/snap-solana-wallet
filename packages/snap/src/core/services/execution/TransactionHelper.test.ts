/* eslint-disable no-restricted-globals */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-require-imports */
import {
  decompileTransactionMessageFetchingLookupTables,
  getCompiledTransactionMessageDecoder,
  getSignatureFromTransaction,
  isTransactionMessageWithBlockhashLifetime,
  pipe,
} from '@solana/kit';

import { Network } from '../../constants/solana';
import {
  isTransactionMessageWithComputeUnitLimitInstruction,
  isTransactionMessageWithComputeUnitPriceInstruction,
  isTransactionMessageWithFeePayer,
} from '../../sdk-extensions/transaction-messages';
import { deriveSolanaKeypairMock } from '../../test/mocks/utils/deriveSolanaKeypair';
import logger from '../../utils/logger';
import type { SolanaConnection } from '../connection';
import { MOCK_EXECUTION_SCENARIOS } from './mocks/scenarios';
import { MOCK_EXECUTION_SCENARIO_SEND_SOL } from './mocks/scenarios/sendSol';
import { TransactionHelper } from './TransactionHelper';

jest.mock('@solana/kit', () => ({
  ...jest.requireActual('@solana/kit'),
  getComputeUnitEstimateForTransactionMessageFactory: jest
    .fn()
    .mockReturnValue(jest.fn().mockResolvedValue(200000)),
  sendTransactionWithoutConfirmingFactory: jest
    .fn()
    .mockReturnValue(jest.fn().mockResolvedValueOnce(undefined)),
}));

jest.mock('../../utils/deriveSolanaKeypair', () => ({
  deriveSolanaKeypair: deriveSolanaKeypairMock,
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
      fromAccount,
      transactionMessage,
      transactionMessageBase64Encoded,
      getMultipleAccountsResponse,
      signedTransaction,
      signedTransactionBase64Encoded,
      signature,
    } = scenario;

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
    });

    describe('signTransactionMessage', () => {
      it(`Scenario ${name}: signs a transaction message successfully`, async () => {
        const result = await transactionHelper.signTransactionMessage(
          transactionMessage,
          fromAccount,
          scope,
        );
        const resultSignature = getSignatureFromTransaction(result);

        expect(result).toStrictEqual(signedTransaction);
        expect(resultSignature).toBe(signature);
      });

      it(`Scenario ${name}: adds if missing a fee payer, a lifetimeConstraint, a compute unit limit and a compute unit price`, async () => {
        const { messageBytes } = await transactionHelper.signTransactionMessage(
          transactionMessage,
          fromAccount,
          scope,
        );
        const transactionMessageAfterSigning = await pipe(
          messageBytes,
          getCompiledTransactionMessageDecoder().decode,
          async (decodedMessageBytes) =>
            decompileTransactionMessageFetchingLookupTables(
              decodedMessageBytes,
              mockConnection.getRpc(scope),
            ),
        );

        expect(
          isTransactionMessageWithFeePayer(transactionMessageAfterSigning),
        ).toBe(true);
        expect(
          isTransactionMessageWithBlockhashLifetime(
            transactionMessageAfterSigning,
          ),
        ).toBe(true);
        expect(
          isTransactionMessageWithComputeUnitLimitInstruction(
            transactionMessageAfterSigning,
          ),
        ).toBe(true);
        expect(
          isTransactionMessageWithComputeUnitPriceInstruction(
            transactionMessageAfterSigning,
          ),
        ).toBe(true);
      });
    });

    describe('base64EncodeTransactionMessage', () => {
      it(`Scenario ${name}: encodes a transaction message to a base64 encoded string successfully`, async () => {
        const result = await transactionHelper.base64EncodeTransactionMessage(
          transactionMessage,
        );

        expect(result).toBe(transactionMessageBase64Encoded);
      });
    });

    // describe('decodeBase64Encoded', () => {
    //   it(`Scenario ${name}: decodes a transaction successfully`, async () => {
    //     const result = await transactionHelper.decodeBase64Encoded(
    //       transactionMessageBase64Encoded,
    //       scope,
    //     );

    //     expect(result).toStrictEqual(transactionMessage);
    //   });
    // });

    describe('encodeSignedTransactionToBase64', () => {
      it(`Scenario ${name}: encodes a signed transaction to a base64 encoded string successfully`, async () => {
        const result = await transactionHelper.encodeSignedTransactionToBase64(
          signedTransaction,
        );

        expect(result).toBe(signedTransactionBase64Encoded);
      });
    });
  });
});
