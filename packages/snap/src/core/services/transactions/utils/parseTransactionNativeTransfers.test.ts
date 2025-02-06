import { KnownCaip19Id, Network } from '../../../constants/solana';
import { EXPECTED_NATIVE_SOL_TRANSFER_DATA } from '../../../test/mocks/transactions-data/native-sol-transfer';
import { parseTransactionNativeTransfers } from './parseTransactionNativeTransfers';

describe('parseTransactionNativeTransfers', () => {
  it('should parse native SOL transfers', () => {
    const result = parseTransactionNativeTransfers({
      scope: Network.Localnet,
      transactionData: EXPECTED_NATIVE_SOL_TRANSFER_DATA,
    });

    expect(result).toStrictEqual({
      from: [
        {
          address: 'BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP',
          asset: {
            amount: '0.1',
            fungible: true,
            type: KnownCaip19Id.SolLocalnet,
            unit: 'SOL',
          },
        },
      ],
      to: [
        {
          address: 'FDUGdV6bjhvw5gbirXCvqbTSWK9999kcrZcrHoCQzXJK',
          asset: {
            amount: '0.1',
            fungible: true,
            type: KnownCaip19Id.SolLocalnet,
            unit: 'SOL',
          },
        },
      ],
      fees: [
        {
          asset: {
            amount: '0.000005',
            fungible: true,
            type: KnownCaip19Id.SolLocalnet,
            unit: 'SOL',
          },
          type: 'base',
        },
      ],
    });
  });
});
