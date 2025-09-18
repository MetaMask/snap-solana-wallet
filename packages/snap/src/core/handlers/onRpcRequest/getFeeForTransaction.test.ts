import { InternalError } from '@metamask/snaps-sdk';

import { Network } from '../../constants/solana';
import { MOCK_VALID_SWAP_TRANSACTION } from '../../test/mocks/transactions-data/swap';
import { TEST_ORIGIN } from '../../test/utils';
import { getFeeForTransaction } from './getFeeForTransaction';
import { RpcRequestMethod } from './types';

describe('getFeeForTransaction', () => {
  const createArgs = (transaction: string) => ({
    origin: TEST_ORIGIN,
    request: {
      id: 'test-id',
      method: RpcRequestMethod.GetFeeForTransaction,
      jsonrpc: '2.0' as const,
      params: {
        transaction,
        scope: Network.Localnet,
      },
    },
  });

  it('returns the fee for a transaction', async () => {
    const args = createArgs(MOCK_VALID_SWAP_TRANSACTION);

    const result = await getFeeForTransaction(args);

    expect(result).toMatchObject({
      value: '52788',
    });
  });

  it('throws an error if transaction is not passed', async () => {
    const args = createArgs('');

    await expect(getFeeForTransaction(args)).rejects.toThrow(InternalError);
  });

  it('throws an error if transaction cannot be decoded', async () => {
    const args = createArgs('not-a-transaction');

    await expect(getFeeForTransaction(args)).rejects.toThrow(InternalError);
  });
});
