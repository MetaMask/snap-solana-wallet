import type { Transaction } from '@metamask/keyring-api';

import * as snapContext from '../../../snapContext';
import { Network, Networks } from '../../constants/solana';
import {
  MOCK_SOLANA_KEYRING_ACCOUNT_0,
  MOCK_SOLANA_KEYRING_ACCOUNT_1,
  MOCK_SOLANA_KEYRING_ACCOUNT_3,
  MOCK_SOLANA_KEYRING_ACCOUNT_4,
  MOCK_SOLANA_KEYRING_ACCOUNT_5,
  MOCK_SOLANA_KEYRING_ACCOUNTS,
} from '../../test/mocks/solana-keyring-accounts';
import { onTransactionFinalized } from './onTransactionFinalized';

jest.mock('../../../snapContext', () => ({
  keyring: {
    getAccountOrThrow: jest.fn(),
    listAccounts: jest.fn(),
  },
  analyticsService: {
    trackEventTransactionFinalized: jest.fn(),
  },
  balancesService: {
    updateBalancesPostTransaction: jest.fn(),
  },
  transactionsService: {
    refreshTransactions: jest.fn(),
  },
}));

describe('onTransactionFinalized', () => {
  beforeEach(() => {
    jest
      .spyOn(snapContext.keyring, 'getAccountOrThrow')
      .mockResolvedValue(MOCK_SOLANA_KEYRING_ACCOUNT_0);

    jest
      .spyOn(snapContext.keyring, 'listAccounts')
      .mockResolvedValue([...MOCK_SOLANA_KEYRING_ACCOUNTS]);

    jest
      .spyOn(snapContext.transactionsService, 'refreshTransactions')
      .mockResolvedValue();
  });

  it('should refresh transactions for all accounts that are involved in the transaction', async () => {
    const mockAccountId = MOCK_SOLANA_KEYRING_ACCOUNT_0.id;

    // Assume a very generic transaction with multiple senders and recipients
    const mockTransaction: Transaction = {
      from: [
        {
          address: MOCK_SOLANA_KEYRING_ACCOUNT_0.address,
          asset: {
            fungible: true,
            type: Networks[Network.Testnet].nativeToken.caip19Id,
            unit: Networks[Network.Testnet].nativeToken.symbol,
            amount: '0.1',
          },
        },
        {
          address: MOCK_SOLANA_KEYRING_ACCOUNT_1.address,
          asset: {
            fungible: true,
            type: Networks[Network.Testnet].nativeToken.caip19Id,
            unit: Networks[Network.Testnet].nativeToken.symbol,
            amount: '0.1',
          },
        },
      ],
      to: [
        {
          address: MOCK_SOLANA_KEYRING_ACCOUNT_3.address,
          asset: {
            fungible: true,
            type: Networks[Network.Testnet].nativeToken.caip19Id,
            unit: Networks[Network.Testnet].nativeToken.symbol,
            amount: '0.1',
          },
        },
        {
          address: MOCK_SOLANA_KEYRING_ACCOUNT_4.address,
          asset: {
            fungible: true,
            type: Networks[Network.Testnet].nativeToken.caip19Id,
            unit: Networks[Network.Testnet].nativeToken.symbol,
            amount: '0.1',
          },
        },
        {
          address: MOCK_SOLANA_KEYRING_ACCOUNT_5.address,
          asset: {
            fungible: true,
            type: Networks[Network.Testnet].nativeToken.caip19Id,
            unit: Networks[Network.Testnet].nativeToken.symbol,
            amount: '0.1',
          },
        },
      ],
      type: 'send',
      id: '1',
      events: [],
      chain: Network.Testnet,
      account: MOCK_SOLANA_KEYRING_ACCOUNT_0.id,
      status: 'confirmed',
      timestamp: 1736500242,
      fees: [],
    };

    await onTransactionFinalized({
      request: {
        id: '1',
        jsonrpc: '2.0',
        method: 'onTransactionFinalized',
        params: {
          accountId: mockAccountId,
          transaction: mockTransaction,
        },
      },
    });

    expect(
      snapContext.transactionsService.refreshTransactions,
    ).toHaveBeenCalledWith([
      MOCK_SOLANA_KEYRING_ACCOUNT_0,
      MOCK_SOLANA_KEYRING_ACCOUNT_1,
      MOCK_SOLANA_KEYRING_ACCOUNT_3,
      MOCK_SOLANA_KEYRING_ACCOUNT_4,
      MOCK_SOLANA_KEYRING_ACCOUNT_5,
    ]);
  });

  it('should refresh transactions for the sender only if it is the only account involved in the transaction', async () => {
    const mockAccountId = MOCK_SOLANA_KEYRING_ACCOUNT_0.id;

    // Transaction with only one sender, and one random recipient
    const mockTransaction: Transaction = {
      from: [
        {
          address: MOCK_SOLANA_KEYRING_ACCOUNT_0.address,
          asset: {
            fungible: true,
            type: Networks[Network.Testnet].nativeToken.caip19Id,
            unit: Networks[Network.Testnet].nativeToken.symbol,
            amount: '0.1',
          },
        },
      ],
      to: [
        {
          address: '6LfawjK4CQE7pHApWYA6s6PCH5jfgrcRcV6xE6vtiyjY',
          asset: {
            fungible: true,
            type: Networks[Network.Testnet].nativeToken.caip19Id,
            unit: Networks[Network.Testnet].nativeToken.symbol,
            amount: '0.1',
          },
        },
      ],
      type: 'send',
      id: '1',
      events: [],
      chain: Network.Testnet,
      account: MOCK_SOLANA_KEYRING_ACCOUNT_0.id,
      status: 'confirmed',
      timestamp: 1736500242,
      fees: [],
    };

    await onTransactionFinalized({
      request: {
        id: '1',
        jsonrpc: '2.0',
        method: 'onTransactionFinalized',
        params: {
          accountId: mockAccountId,
          transaction: mockTransaction,
        },
      },
    });

    expect(
      snapContext.transactionsService.refreshTransactions,
    ).toHaveBeenCalledWith([MOCK_SOLANA_KEYRING_ACCOUNT_0]);
  });
});
