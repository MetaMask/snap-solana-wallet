import type { Blockhash, CompilableTransactionMessage } from '@solana/web3.js';

import { Network } from '../../../constants/solana';
import { MOCK_EXECUTION_SCENARIO_SEND_SOL } from '../mocks/scenarios/sendSol';
import type { TransactionHelper } from '../TransactionHelper';
import { FromBase64EncodedBuilder } from './FromBase64EncodedBuilder';

describe('FromBase64EncodedBuilder', () => {
  let mockTransactionHelper: TransactionHelper;
  let builder: FromBase64EncodedBuilder;

  beforeEach(() => {
    mockTransactionHelper = {
      base64DecodeTransaction: jest.fn(),
      getLatestBlockhash: jest.fn(),
      base64EncodeTransactionMessageFromBase64EncodedTransaction: jest.fn(),
    } as unknown as TransactionHelper;

    builder = new FromBase64EncodedBuilder(mockTransactionHelper);
  });

  it('builds a transaction message from base64 encoded transaction', async () => {
    const base64Transaction =
      MOCK_EXECUTION_SCENARIO_SEND_SOL.transactionMessageBase64Encoded;
    const network = Network.Mainnet;
    const mockTransactionMessage = {} as CompilableTransactionMessage;
    const mockBlockhash = 'mock-blockhash' as Blockhash;
    const expectedResult = {
      ...mockTransactionMessage,
      lifetimeConstraint: {
        blockhash: mockBlockhash,
        lastValidBlockHeight: expect.any(BigInt),
      },
    };

    jest
      .spyOn(mockTransactionHelper, 'base64DecodeTransaction')
      .mockResolvedValue(mockTransactionMessage);

    jest.spyOn(mockTransactionHelper, 'getLatestBlockhash').mockResolvedValue({
      blockhash: mockBlockhash,
      lastValidBlockHeight: 1000n,
    });

    const result = await builder.buildTransactionMessage(
      base64Transaction,
      network,
    );

    expect(result).toStrictEqual(expectedResult);
    expect(mockTransactionHelper.base64DecodeTransaction).toHaveBeenCalledWith(
      base64Transaction,
      network,
    );
    expect(mockTransactionHelper.getLatestBlockhash).toHaveBeenCalledWith(
      network,
    );
  });

  it('builds a transaction message from base64 encoded transaction message', async () => {
    const base64Transaction = 'mock-base64-transaction-message';
    const network = Network.Mainnet;
    const mockTransactionMessage = {} as CompilableTransactionMessage;
    const mockBlockhash = 'mock-blockhash' as Blockhash;
    const expectedResult = {
      ...mockTransactionMessage,
      lifetimeConstraint: {
        blockhash: mockBlockhash,
        lastValidBlockHeight: expect.any(BigInt),
      },
    };

    jest
      .spyOn(mockTransactionHelper, 'base64DecodeTransaction')
      .mockResolvedValue(mockTransactionMessage);

    jest.spyOn(mockTransactionHelper, 'getLatestBlockhash').mockResolvedValue({
      blockhash: mockBlockhash,
      lastValidBlockHeight: 1000n,
    });

    const result = await builder.buildTransactionMessage(
      base64Transaction,
      network,
    );

    expect(result).toStrictEqual(expectedResult);
    expect(mockTransactionHelper.base64DecodeTransaction).toHaveBeenCalledWith(
      base64Transaction,
      network,
    );
    expect(mockTransactionHelper.getLatestBlockhash).toHaveBeenCalledWith(
      network,
    );
  });

  it('builds a transaction message from base64 encoded transaction when initial decode fails', async () => {
    const base64Transaction = 'mock-base64-transaction';
    const network = Network.Mainnet;
    const mockTransactionMessage = {} as CompilableTransactionMessage;
    const mockBlockhash = 'mock-blockhash' as Blockhash;
    const mockEncodedTransactionMessage = 'mock-encoded-transaction-message';
    const expectedResult = {
      ...mockTransactionMessage,
      lifetimeConstraint: {
        blockhash: mockBlockhash,
        lastValidBlockHeight: expect.any(BigInt),
      },
    };

    jest
      .spyOn(mockTransactionHelper, 'base64DecodeTransaction')
      .mockRejectedValueOnce(new Error('Decode failed'))
      .mockResolvedValueOnce(mockTransactionMessage);

    jest
      .spyOn(
        mockTransactionHelper,
        'base64EncodeTransactionMessageFromBase64EncodedTransaction',
      )
      .mockResolvedValue(mockEncodedTransactionMessage);

    jest.spyOn(mockTransactionHelper, 'getLatestBlockhash').mockResolvedValue({
      blockhash: mockBlockhash,
      lastValidBlockHeight: 1000n,
    });

    const result = await builder.buildTransactionMessage(
      base64Transaction,
      network,
    );

    expect(result).toStrictEqual(expectedResult);
    expect(
      mockTransactionHelper.base64EncodeTransactionMessageFromBase64EncodedTransaction,
    ).toHaveBeenCalledWith(base64Transaction);
    expect(mockTransactionHelper.base64DecodeTransaction).toHaveBeenCalledWith(
      mockEncodedTransactionMessage,
      network,
    );
    expect(mockTransactionHelper.getLatestBlockhash).toHaveBeenCalledWith(
      network,
    );
  });
});
