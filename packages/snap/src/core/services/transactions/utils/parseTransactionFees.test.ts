import { KnownCaip19Id, Network } from '../../../constants/solana';
import { EXPECTED_NATIVE_SOL_TRANSFER_DATA } from '../../../test/mocks/transactions-data/native-sol-transfer';
import { EXPECTED_SEND_USDC_TRANSFER_DATA } from '../../../test/mocks/transactions-data/send-usdc-transfer';
import { parseTransactionFees } from './parseTransactionFees';

describe('parseTransactionFees', () => {
  it('should parse transaction fees on native solana transfers', () => {
    const result = parseTransactionFees({
      scope: Network.Localnet,
      transactionData: EXPECTED_NATIVE_SOL_TRANSFER_DATA,
    });

    expect(result).toStrictEqual([
      {
        asset: {
          amount: '0.000005',
          fungible: true,
          type: KnownCaip19Id.SolLocalnet,
          unit: 'SOL',
        },
        type: 'base',
      },
    ]);
  });

  it('should parse transaction fees on SPL transfers', () => {
    const result = parseTransactionFees({
      scope: Network.Localnet,
      transactionData: EXPECTED_SEND_USDC_TRANSFER_DATA,
    });

    expect(result).toStrictEqual([
      {
        asset: {
          amount: '0.000005',
          fungible: true,
          type: KnownCaip19Id.SolLocalnet,
          unit: 'SOL',
        },
        type: 'base',
      },
    ]);
  });
});
