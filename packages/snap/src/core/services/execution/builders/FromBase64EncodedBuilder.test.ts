import type { Blockhash, CompilableTransactionMessage } from '@solana/web3.js';

import { Network } from '../../../constants/solana';
import type { TransactionHelper } from '../TransactionHelper';
import { FromBase64EncodedBuilder } from './FromBase64EncodedBuilder';

describe('FromBase64EncodedBuilder', () => {
  let mockTransactionHelper: TransactionHelper;
  let builder: FromBase64EncodedBuilder;

  beforeEach(() => {
    mockTransactionHelper = {
      base64DecodeTransaction: jest.fn(),
      getLatestBlockhash: jest.fn(),
    } as unknown as TransactionHelper;

    builder = new FromBase64EncodedBuilder(mockTransactionHelper);
  });

  it('builds a transaction message from base64 encoded transaction', async () => {
    const base64Transaction = 'mock-base64-string';
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
});
