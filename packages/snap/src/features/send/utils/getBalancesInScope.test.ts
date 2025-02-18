import { KnownCaip19Id, Network } from '../../../core/constants/solana';
import {
  MOCK_SOLANA_KEYRING_ACCOUNT_0,
  MOCK_SOLANA_KEYRING_ACCOUNT_1,
} from '../../../core/test/mocks/solana-keyring-accounts';
import { getBalancesInScope } from './getBalancesInScope';

describe('getBalancesInScope', () => {
  const mockBalances = {
    [MOCK_SOLANA_KEYRING_ACCOUNT_0.id]: {
      // Native SOL, Zero balance - ✅
      [KnownCaip19Id.SolMainnet]: {
        amount: '0',
        decimals: 9,
        symbol: 'SOL',
      },
      // Native SOL, Different scope - ❌
      [KnownCaip19Id.SolDevnet]: {
        amount: '1000000',
        decimals: 9,
        symbol: 'SOL',
      },
      // SPL token, Non-zero balance - ✅
      [KnownCaip19Id.UsdcMainnet]: {
        amount: '1000000',
        decimals: 6,
        symbol: 'USDC',
      },
    },
    [MOCK_SOLANA_KEYRING_ACCOUNT_1.id]: {
      // SPL token, Non-zero balance, Different scope - ❌
      [KnownCaip19Id.UsdcDevnet]: {
        amount: '1000000',
        decimals: 6,
        symbol: 'USDC',
      },
      // SPL token, Zero balance - ❌
      [KnownCaip19Id.EurcMainnet]: {
        amount: '0',
        decimals: 6,
        symbol: 'EURC',
      },
      // SPL token, Zero balance, Different scope - ❌
      [KnownCaip19Id.EurcDevnet]: {
        amount: '1000000',
        decimals: 6,
        symbol: 'EURC',
      },
    },
  };

  it('returns balances for the given scope without 0 balances', () => {
    const result = getBalancesInScope({
      scope: Network.Mainnet,
      balances: mockBalances as any,
    });

    expect(result).toStrictEqual({
      [MOCK_SOLANA_KEYRING_ACCOUNT_0.id]: {
        [KnownCaip19Id.SolMainnet]: {
          amount: '0',
          decimals: 9,
          symbol: 'SOL',
        },
        [KnownCaip19Id.UsdcMainnet]: {
          amount: '1000000',
          decimals: 6,
          symbol: 'USDC',
        },
      },
      [MOCK_SOLANA_KEYRING_ACCOUNT_1.id]: {},
    });
  });

  it('should handle accounts with no tokens', () => {
    const result = getBalancesInScope({
      scope: Network.Mainnet,
      balances: { [MOCK_SOLANA_KEYRING_ACCOUNT_0.id]: {} },
    });

    expect(result).toStrictEqual({
      [MOCK_SOLANA_KEYRING_ACCOUNT_0.id]: {},
    });
  });

  it('should handle empty balances', () => {
    const result = getBalancesInScope({
      scope: Network.Mainnet,
      balances: {},
    });

    expect(result).toStrictEqual({});
  });
});
