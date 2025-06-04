import { KnownCaip19Id, Network, Networks } from '../../../domain';
import { EXPECTED_NATIVE_SOL_TRANSFER_DATA } from '../../../test/mocks/transactions-data/native-sol-transfer';
import { EXPECTED_SEND_USDC_TRANSFER_DATA } from '../../../test/mocks/transactions-data/send-usdc-transfer';
import { EXPECTED_SWAP_USDC_TO_COBIE_DATA } from '../../../test/mocks/transactions-data/swap-usdc-to-cobie';
import { parseTransactionFees } from './parseTransactionFees';

describe('parseTransactionFees', () => {
  it('parses transaction fees on native solana transfers', () => {
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

  it('parses transaction fees on SPL transfers', () => {
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

  it('parses transaction fees on swap transactions', () => {
    const result = parseTransactionFees({
      scope: Network.Mainnet,
      transactionData: EXPECTED_SWAP_USDC_TO_COBIE_DATA,
    });

    expect(result).toStrictEqual([
      {
        type: 'base',
        asset: {
          fungible: true,
          type: Networks[Network.Mainnet].nativeToken.caip19Id,
          unit: Networks[Network.Mainnet].nativeToken.symbol,
          amount: '0.000005',
        },
      },
      {
        type: 'priority',
        asset: {
          fungible: true,
          type: Networks[Network.Mainnet].nativeToken.caip19Id,
          unit: Networks[Network.Mainnet].nativeToken.symbol,
          amount: '0.000069798',
        },
      },
    ]);
  });
});
