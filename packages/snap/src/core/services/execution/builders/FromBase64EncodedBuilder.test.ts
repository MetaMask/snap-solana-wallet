import type { Blockhash } from '@solana/kit';

import { MOCK_EXECUTION_SCENARIOS } from '../mocks/scenarios';
import type { TransactionHelper } from '../TransactionHelper';
import { FromBase64EncodedBuilder } from './FromBase64EncodedBuilder';

describe('FromBase64EncodedBuilder', () => {
  let mockTransactionHelper: TransactionHelper;
  let builder: FromBase64EncodedBuilder;

  beforeEach(() => {
    mockTransactionHelper = {
      decodeBase64Encoded: jest.fn(),
      getLatestBlockhash: jest.fn(),
    } as unknown as TransactionHelper;

    builder = new FromBase64EncodedBuilder(mockTransactionHelper);
  });

  it.each(MOCK_EXECUTION_SCENARIOS)(
    'builds a transaction message from base64 encoded transaction message',
    async (scenario) => {
      const { scope, transactionMessage, transactionMessageBase64Encoded } =
        scenario;
      const mockBlockhash = 'mock-blockhash' as Blockhash;

      const expectedResult = {
        ...transactionMessage,
        lifetimeConstraint: {
          blockhash: mockBlockhash,
          lastValidBlockHeight: expect.any(BigInt),
        },
      };

      jest
        .spyOn(mockTransactionHelper, 'decodeBase64Encoded')
        .mockResolvedValue(transactionMessage);

      jest
        .spyOn(mockTransactionHelper, 'getLatestBlockhash')
        .mockResolvedValue({
          blockhash: mockBlockhash,
          lastValidBlockHeight: 1000n,
        });

      const result = await builder.buildTransactionMessage(
        transactionMessageBase64Encoded,
        scope,
      );

      expect(result).toStrictEqual(expectedResult);
      expect(mockTransactionHelper.decodeBase64Encoded).toHaveBeenCalledWith(
        transactionMessageBase64Encoded,
        scope,
      );
      expect(mockTransactionHelper.getLatestBlockhash).toHaveBeenCalledWith(
        scope,
      );
    },
  );
});
