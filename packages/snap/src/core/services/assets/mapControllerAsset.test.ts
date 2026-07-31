import type { Asset } from '@metamask/assets-controller';
import { findAssociatedTokenPda, TOKEN_PROGRAM_ADDRESS } from '@solana-program/token';
import { address as asAddress } from '@solana/kit';

import { KnownCaip19Id, Network } from '../../constants/solana';
import { MOCK_SOLANA_KEYRING_ACCOUNT_0 } from '../../test/mocks/solana-keyring-accounts';
import { mapControllerAsset } from './mapControllerAsset';

function createMockAsset(
  assetId: string,
  overrides: Partial<Asset> = {},
): Asset {
  const chainId = assetId.split('/')[0] as Network;
  return {
    id: assetId as Asset['id'],
    chainId,
    balance: { amount: '1000000000' },
    metadata: {
      type: assetId.endsWith('/slip44:501') ? 'native' : 'spl',
      symbol: assetId.endsWith('/slip44:501') ? 'SOL' : 'USDC',
      name: assetId.endsWith('/slip44:501') ? 'Solana' : 'USD Coin',
      decimals: assetId.endsWith('/slip44:501') ? 9 : 6,
    },
    price: {
      assetPriceType: 'fungible',
      price: 1,
      usdPrice: 1,
      lastUpdated: 0,
    },
    fiatValue: 1,
    ...overrides,
  };
}

describe('mapControllerAsset', () => {
  const accountId = MOCK_SOLANA_KEYRING_ACCOUNT_0.id;
  const accountAddress = MOCK_SOLANA_KEYRING_ACCOUNT_0.address;
  const solAssetId = KnownCaip19Id.SolMainnet;
  const usdcAssetId = KnownCaip19Id.UsdcMainnet;

  it('maps native SOL from controller metadata', async () => {
    const asset = createMockAsset(solAssetId);

    const result = await mapControllerAsset(
      accountId,
      solAssetId,
      accountAddress,
      asset,
    );

    expect(result).toStrictEqual({
      assetType: solAssetId,
      keyringAccountId: accountId,
      network: Network.Mainnet,
      address: accountAddress,
      symbol: 'SOL',
      decimals: 9,
      rawAmount: '1000000000',
      uiAmount: '1',
    });
  });

  it('maps SPL token with derived associated token account pubkey', async () => {
    const asset = createMockAsset(usdcAssetId, {
      balance: { amount: '1234560' },
    });

    const [expectedPubkey] = await findAssociatedTokenPda({
      mint: asAddress('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
      owner: asAddress(accountAddress),
      tokenProgram: TOKEN_PROGRAM_ADDRESS,
    });

    const result = await mapControllerAsset(
      accountId,
      usdcAssetId,
      accountAddress,
      asset,
    );

    expect(result).toStrictEqual({
      assetType: usdcAssetId,
      keyringAccountId: accountId,
      network: Network.Mainnet,
      mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      pubkey: expectedPubkey,
      symbol: 'USDC',
      decimals: 6,
      rawAmount: '1234560',
      uiAmount: '1.23456',
    });
  });

  it('falls back when controller metadata fields are missing', async () => {
    const asset = createMockAsset(solAssetId, {
      metadata: {
        type: 'native',
        symbol: undefined as unknown as string,
        name: 'Solana',
        decimals: undefined as unknown as number,
      },
    });

    const result = await mapControllerAsset(
      accountId,
      solAssetId,
      accountAddress,
      asset,
    );

    expect(result).toMatchObject({
      symbol: 'UNKNOWN',
      decimals: 0,
      rawAmount: '1000000000',
      uiAmount: '1000000000',
    });
  });
});
