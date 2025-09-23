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

  let signer: Signer;

  beforeEach(async () => {
    jest.clearAllMocks();
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
        getLatestBlockhash: () => mockRpcResponse,
        getFeeForMessage: () => mockRpcResponse,
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
});
