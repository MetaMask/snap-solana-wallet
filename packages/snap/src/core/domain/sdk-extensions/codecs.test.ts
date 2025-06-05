import type { TransactionMessageBytes } from '@solana/kit';
import {
  compileTransactionMessage,
  getCompiledTransactionMessageEncoder,
  pipe,
  type GetMultipleAccountsApi,
  type Rpc,
} from '@solana/kit';

import { MOCK_EXECUTION_SCENARIOS } from '../../test/mocks';
import {
  fromBase64StringToCompilableTransactionMessage,
  fromBase64StringToTransaction,
  fromBytesToCompilableTransactionMessage,
  fromCompilableTransactionMessageToBase64String,
  fromTransactionToBase64String,
  fromUnknowBase64StringToTransactionOrTransactionMessage,
} from './codecs';

describe('codecs', () => {
  describe.each(MOCK_EXECUTION_SCENARIOS)('scenarios', (scenario) => {
    const {
      name,
      transactionMessage,
      transactionMessageBase64Encoded,
      signedTransaction,
      signedTransactionBase64Encoded,
      getMultipleAccountsResponse,
    } = scenario;

    const mockRpc = {
      getMultipleAccounts: jest.fn().mockReturnValue({
        send: jest.fn().mockResolvedValue(getMultipleAccountsResponse?.result),
      }),
    } as unknown as Rpc<GetMultipleAccountsApi>;

    describe(`fromCompilableTransactionMessageToBase64String | Scenario: ${name}`, () => {
      it(`encodes a transaction message to a base64 string`, async () => {
        const result = await fromCompilableTransactionMessageToBase64String(
          transactionMessage,
        );

        expect(result).toStrictEqual(transactionMessageBase64Encoded);
      });
    });

    describe(`fromBase64StringToCompilableTransactionMessage | Scenario: ${name}`, () => {
      it('decodes a base64 string to a transaction message', async () => {
        const result = await fromBase64StringToCompilableTransactionMessage(
          transactionMessageBase64Encoded,
          mockRpc,
        );

        expect(result).toStrictEqual(transactionMessage);
      });
    });

    describe('fromBytesToCompilableTransactionMessage', () => {
      it('decodes bytes to a compilable transaction message', async () => {
        const transactionMessageBytes = pipe(
          transactionMessage,
          compileTransactionMessage,
          getCompiledTransactionMessageEncoder().encode,
        );

        const result = await fromBytesToCompilableTransactionMessage(
          transactionMessageBytes as TransactionMessageBytes,
          mockRpc,
        );

        expect(result).toStrictEqual(transactionMessage);
      });
    });

    describe('fromTransactionToBase64String', () => {
      it('encodes a transaction to a base64 string', () => {
        const result = fromTransactionToBase64String(signedTransaction);

        expect(result).toStrictEqual(signedTransactionBase64Encoded);
      });
    });

    describe(`fromBase64StringToTransaction | Scenario: ${name}`, () => {
      it('decodes a base64 string to a transaction', async () => {
        const result = await fromBase64StringToTransaction(
          signedTransactionBase64Encoded,
        );

        const { lifetimeConstraint, ...rest } = signedTransaction;

        expect(result).toStrictEqual(rest);
      });
    });

    describe('fromUnknowBase64StringToTransactionOrTransactionMessage', () => {
      it('decodes a base64 encoded transaction message to a transaction message', async () => {
        const result =
          await fromUnknowBase64StringToTransactionOrTransactionMessage(
            transactionMessageBase64Encoded,
            mockRpc,
          );

        expect(result).toStrictEqual(transactionMessage);
      });

      it('decodes a base64 encoded transaction to a transaction', async () => {
        const result =
          await fromUnknowBase64StringToTransactionOrTransactionMessage(
            signedTransactionBase64Encoded,
            mockRpc,
          );

        const { lifetimeConstraint, ...rest } = signedTransaction;

        expect(result).toStrictEqual(rest);
      });
    });
  });
});
