/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { address as asAddress } from '@solana/kit';

import { Network } from '../../../constants/solana';
import { MOCK_SOLANA_KEYRING_ACCOUNT_0 } from '../../../test/mocks/solana-keyring-accounts';
import { EXPECTED_SPAM_TRANSACTION_DATA } from '../../../test/mocks/transactions-data/spam';
import { EXPECTED_SPAM_TRANSACTION_DATA_2 } from '../../../test/mocks/transactions-data/spam-2';
import { isSpam } from './isSpam';
import { mapRpcTransaction } from './mapRpcTransaction';

describe('isSpam', () => {
  const scope = Network.Mainnet;

  it('returns true if the transaction is a spam transaction - #1', () => {
    const account = {
      ...MOCK_SOLANA_KEYRING_ACCOUNT_0,
      address: asAddress('DAXnAudMEqiD1sS1rFn4ds3pdybRYJd9J58PqCncVVqS'),
    };
    const transaction = mapRpcTransaction({
      transactionData: EXPECTED_SPAM_TRANSACTION_DATA,
      account,
      scope,
    })!;

    const result = isSpam(transaction, account);

    expect(result).toBe(true);
  });

  it('returns true if the transaction is a spam transaction - #2', () => {
    const account = {
      ...MOCK_SOLANA_KEYRING_ACCOUNT_0,
      address: asAddress('FQT9SSwEZ6UUQxsmTzgt5JzjrS4M5zm13M1QiYF8TEo6'),
    };
    const transaction = mapRpcTransaction({
      transactionData: EXPECTED_SPAM_TRANSACTION_DATA_2,
      account,
      scope,
    })!;

    const result = isSpam(transaction, account);

    expect(result).toBe(true);
  });
});
