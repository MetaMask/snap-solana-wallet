/* eslint-disable no-restricted-globals */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-require-imports */
import {
  getSignatureFromTransaction,
  isTransactionMessageWithBlockhashLifetime,
} from '@solana/kit';

import { Network } from '../../constants/solana';
import { fromBytesToCompilableTransactionMessage } from '../../sdk-extensions/codecs';
import {
  isTransactionMessageWithComputeUnitLimitInstruction,
  isTransactionMessageWithComputeUnitPriceInstruction,
  isTransactionMessageWithFeePayer,
} from '../../sdk-extensions/transaction-messages';
import { deriveSolanaKeypairMock } from '../../test/mocks/utils/deriveSolanaKeypair';
import logger from '../../utils/logger';
import type { SolanaConnection } from '../connection';
import { createMockConnection } from '../mocks/mockConnection';
import { MOCK_SIGN_SCENARIO_JUPITERZ_WITH_DIFFERENT_FEE_PAYER } from './mocks/jupiterzWithDifferentFeePayer';
import { MOCK_EXECUTION_SCENARIOS } from './mocks/scenarios';
import { Signer } from './Signer';

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

describe('Signer', () => {
  const mockScope = Network.Mainnet;
  let mockConnection: SolanaConnection;

  let signer: Signer;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockConnection = createMockConnection();
    signer = new Signer(mockConnection, logger);
  });

  // Note the ".each" here
  describe.each(MOCK_EXECUTION_SCENARIOS)('scenarios', (scenario) => {
    const {
      name,
      scope,
      fromAccount,
      transactionMessageBase64Encoded,
      getMultipleAccountsResponse,
      signedTransaction,
      signature,
    } = scenario;

    beforeEach(async () => {
      jest.clearAllMocks();

      signer = new Signer(mockConnection, logger);

      jest.spyOn(mockConnection, 'getRpc').mockReturnValue({
        ...mockConnection.getRpc(mockScope),
        getMultipleAccounts: jest.fn().mockReturnValue({
          send: jest
            .fn()
            .mockResolvedValue(getMultipleAccountsResponse?.result),
        }),
      });
    });

    describe('partiallySignBase64String', () => {
      describe('when the base64 string represents a transaction message', () => {
        it(`Scenario ${name}: signs a transaction message successfully`, async () => {
          const result = await signer.partiallySignBase64String(
            transactionMessageBase64Encoded,
            fromAccount,
            scope,
          );

          const resultSignature = getSignatureFromTransaction(result);

          expect(result).toStrictEqual(signedTransaction);
          expect(resultSignature).toBe(signature);
        });

        it(`Scenario ${name}: adds if missing a fee payer, a lifetimeConstraint, a compute unit limit and a compute unit price`, async () => {
          const { messageBytes } = await signer.partiallySignBase64String(
            transactionMessageBase64Encoded,
            fromAccount,
            scope,
          );
          const transactionMessageAfterSigning =
            await fromBytesToCompilableTransactionMessage(
              messageBytes,
              mockConnection.getRpc(scope),
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
    });
  });

  describe('when the fee payer is different from the account', () => {
    it('signs the transaction message successfully', async () => {
      const { scope, transactionRequestBase64Encoded, userAccount } =
        MOCK_SIGN_SCENARIO_JUPITERZ_WITH_DIFFERENT_FEE_PAYER;

      const partiallySignedTransaction = await signer.partiallySignBase64String(
        transactionRequestBase64Encoded,
        userAccount,
        scope,
      );

      expect(partiallySignedTransaction).toStrictEqual({
        lifetimeConstraint: {
          blockhash: '8o7LFQ8aJ1eZkB1ShjnwzwnfkptjbRoD8gXPkib7K1DR',
          lastValidBlockHeight: 18446744073709551615n,
        },
        messageBytes: new Uint8Array([
          128, 2, 0, 6, 12, 166, 175, 172, 132, 2, 105, 14, 33, 122, 105, 220,
          7, 50, 189, 98, 255, 64, 29, 138, 160, 54, 67, 17, 144, 23, 120, 198,
          47, 124, 254, 220, 189, 153, 176, 2, 143, 157, 158, 175, 50, 134, 226,
          145, 237, 10, 87, 130, 63, 185, 200, 241, 76, 205, 92, 21, 136, 75,
          157, 88, 79, 89, 248, 223, 116, 15, 102, 248, 21, 53, 113, 144, 71,
          137, 127, 26, 38, 205, 4, 248, 209, 38, 217, 101, 67, 105, 42, 24, 55,
          43, 166, 48, 148, 104, 82, 164, 117, 48, 36, 129, 80, 117, 87, 70, 77,
          249, 251, 108, 166, 221, 92, 72, 25, 62, 193, 83, 16, 86, 187, 56, 36,
          212, 5, 67, 0, 96, 91, 209, 153, 132, 236, 176, 69, 168, 106, 118,
          244, 164, 143, 111, 220, 64, 42, 101, 164, 63, 70, 9, 95, 49, 228,
          192, 29, 10, 64, 248, 0, 215, 209, 158, 155, 14, 37, 7, 136, 203, 142,
          76, 71, 239, 255, 180, 111, 163, 36, 124, 167, 121, 83, 255, 163, 42,
          243, 187, 206, 39, 92, 25, 109, 6, 96, 240, 240, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 74, 88, 73, 251, 114, 163, 187, 233, 31, 220, 91, 14, 106, 87,
          246, 60, 90, 28, 180, 91, 32, 103, 166, 237, 12, 172, 211, 99, 149,
          200, 161, 2, 3, 6, 70, 111, 229, 33, 23, 50, 255, 236, 173, 186, 114,
          195, 155, 231, 188, 140, 229, 187, 197, 247, 18, 107, 44, 67, 155, 58,
          64, 0, 0, 0, 198, 250, 122, 243, 190, 219, 173, 58, 61, 101, 243, 106,
          171, 201, 116, 49, 177, 187, 228, 194, 210, 246, 224, 228, 124, 166,
          2, 3, 69, 47, 93, 97, 6, 155, 136, 87, 254, 171, 129, 132, 251, 104,
          127, 99, 70, 24, 192, 53, 218, 196, 57, 220, 26, 235, 59, 85, 152,
          160, 240, 0, 0, 0, 0, 1, 6, 221, 246, 225, 215, 101, 161, 147, 217,
          203, 225, 70, 206, 235, 121, 172, 28, 180, 133, 237, 95, 91, 55, 145,
          58, 140, 245, 133, 126, 255, 0, 169, 115, 209, 175, 103, 12, 170, 169,
          61, 216, 128, 84, 178, 158, 117, 225, 255, 22, 37, 225, 41, 247, 26,
          101, 28, 81, 187, 145, 38, 13, 50, 65, 0, 3, 8, 0, 9, 3, 57, 41, 0, 0,
          0, 0, 0, 0, 8, 0, 5, 2, 126, 144, 0, 0, 7, 12, 1, 0, 4, 2, 7, 5, 9,
          11, 10, 11, 6, 3, 35, 168, 96, 183, 163, 92, 10, 40, 160, 64, 66, 15,
          0, 0, 0, 0, 0, 151, 90, 69, 0, 0, 0, 0, 0, 20, 154, 210, 104, 0, 0, 0,
          0, 2, 0, 0, 0,
        ]),
        signatures: {
          CDg3bPoM21fSXEzrXWHWyJR33JHX6xaYboq5p7s4uo48: null,
          BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP: new Uint8Array([
            21, 3, 51, 147, 54, 231, 170, 228, 92, 92, 247, 188, 98, 138, 98,
            136, 235, 184, 108, 14, 188, 100, 77, 157, 190, 84, 23, 137, 255,
            140, 87, 97, 211, 1, 26, 226, 180, 23, 184, 123, 0, 87, 202, 186,
            32, 95, 120, 125, 33, 74, 148, 160, 87, 80, 246, 228, 105, 28, 129,
            56, 232, 165, 79, 0,
          ]),
        },
      });
    });
  });
});
