import { KnownCaip19Id, Network } from '../../../core/constants/solana';
import {
  MOCK_SOLANA_KEYRING_ACCOUNT_0,
  MOCK_SOLANA_KEYRING_ACCOUNT_1,
} from '../../../core/test/mocks/solana-keyring-accounts';
import type { AssetEntity } from '../../../entities';
import { getBalancesInScope } from './getBalancesInScope';

describe('getBalancesInScope', () => {
  const mockAssetEntities = [
    // Account 0
    // Native SOL, Zero balance - ✅
    {
      assetType: KnownCaip19Id.SolMainnet,
      keyringAccountId: MOCK_SOLANA_KEYRING_ACCOUNT_0.id,
      network: Network.Mainnet,
      symbol: 'SOL',
      decimals: 9,
      rawAmount: '0',
      uiAmount: '0',
    },
    // Native SOL, Different scope - ❌
    {
      assetType: KnownCaip19Id.SolDevnet,
      keyringAccountId: MOCK_SOLANA_KEYRING_ACCOUNT_0.id,
      network: Network.Devnet,
      symbol: 'SOL',
      decimals: 9,
      rawAmount: '1000000',
      uiAmount: '1',
    },
    // SPL token, Non-zero balance - ✅
    {
      assetType: KnownCaip19Id.UsdcMainnet,
      keyringAccountId: MOCK_SOLANA_KEYRING_ACCOUNT_0.id,
      network: Network.Mainnet,
      symbol: 'USDC',
      decimals: 6,
      rawAmount: '1000000',
      uiAmount: '1',
    },

    // Account 1
    // SPL token, Non-zero balance, Different scope - ❌
    {
      assetType: KnownCaip19Id.UsdcDevnet,
      keyringAccountId: MOCK_SOLANA_KEYRING_ACCOUNT_1.id,
      network: Network.Devnet,
      decimals: 6,
      rawAmount: '1000000',
      symbol: 'USDC',
    },
    // SPL token, Zero balance - ❌
    {
      assetType: KnownCaip19Id.EurcMainnet,
      keyringAccountId: MOCK_SOLANA_KEYRING_ACCOUNT_1.id,
      network: Network.Mainnet,
      decimals: 6,
      rawAmount: '0',
      symbol: 'EURC',
    },
    // SPL token, Zero balance, Different scope - ❌
    {
      assetType: KnownCaip19Id.EurcDevnet,
      keyringAccountId: MOCK_SOLANA_KEYRING_ACCOUNT_1.id,
      network: Network.Devnet,
      decimals: 6,
      rawAmount: '1000000',
      symbol: 'EURC',
    },
  ] as AssetEntity[];

  it('returns balances for the given scope without 0 balances', () => {
    const result = getBalancesInScope(Network.Mainnet, mockAssetEntities);

    expect(result).toStrictEqual({
      [MOCK_SOLANA_KEYRING_ACCOUNT_0.id]: {
        [KnownCaip19Id.SolMainnet]: {
          amount: '0',
          unit: 'SOL',
        },
        [KnownCaip19Id.UsdcMainnet]: {
          amount: '1',
          unit: 'USDC',
        },
      },
    });
  });

  it('should handle accounts with no tokens', () => {
    const result = getBalancesInScope(Network.Mainnet, []);

    expect(result).toStrictEqual({});
  });

  it('should handle empty balances', () => {
    const result = getBalancesInScope(Network.Mainnet, []);

    expect(result).toStrictEqual({});
  });
});
