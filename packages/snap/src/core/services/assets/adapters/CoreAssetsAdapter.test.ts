import type { Asset } from '@metamask/assets-controller';
import { findAssociatedTokenPda, TOKEN_PROGRAM_ADDRESS } from '@solana-program/token';
import { address as asAddress } from '@solana/kit';

import type { CoreMessengerCaller } from '../../../../types/core-messenger';
import { KnownCaip19Id, Network } from '../../../constants/solana';
import { MOCK_SOLANA_KEYRING_ACCOUNT_0 } from '../../../test/mocks/solana-keyring-accounts';
import { CoreAssetsAdapter } from './CoreAssetsAdapter';

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

describe('CoreAssetsAdapter', () => {
  let adapter: CoreAssetsAdapter;
  let mockCall: jest.Mock;
  let mockCoreMessenger: CoreMessengerCaller;

  const accountId = MOCK_SOLANA_KEYRING_ACCOUNT_0.id;
  const accountAddress = MOCK_SOLANA_KEYRING_ACCOUNT_0.address;
  const solAssetId = KnownCaip19Id.SolMainnet;
  const usdcAssetId = KnownCaip19Id.UsdcMainnet;
  const chainIds = [Network.Mainnet];

  beforeEach(async () => {
    jest.clearAllMocks();

    mockCall = jest.fn();
    mockCoreMessenger = { call: mockCall };
    adapter = new CoreAssetsAdapter(mockCoreMessenger);
  });

  describe('getAccountAsset', () => {
    it('calls AssetsController:getAsset and maps native SOL', async () => {
      const mockAsset = createMockAsset(solAssetId);
      mockCall.mockResolvedValue(mockAsset);

      const result = await adapter.getAccountAsset(
        accountId,
        solAssetId,
        accountAddress,
      );

      expect(mockCall).toHaveBeenCalledWith(
        'AssetsController:getAsset',
        accountId,
        solAssetId,
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

    it('returns null when controller returns undefined', async () => {
      mockCall.mockResolvedValue(undefined);

      const result = await adapter.getAccountAsset(
        accountId,
        solAssetId,
        accountAddress,
      );

      expect(result).toBeNull();
    });
  });

  describe('getAccountAssets', () => {
    it('calls AssetsController:getAssets once and maps all entries', async () => {
      const mockSolAsset = createMockAsset(solAssetId);
      const mockUsdcAsset = createMockAsset(usdcAssetId, {
        balance: { amount: '1234560' },
      });
      mockCall.mockResolvedValue({
        [accountId]: {
          [solAssetId]: mockSolAsset,
          [usdcAssetId]: mockUsdcAsset,
        },
      });

      const [expectedUsdcPubkey] = await findAssociatedTokenPda({
        mint: asAddress('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
        owner: asAddress(accountAddress),
        tokenProgram: TOKEN_PROGRAM_ADDRESS,
      });

      const result = await adapter.getAccountAssets(
        accountId,
        accountAddress,
        chainIds,
      );

      expect(mockCall).toHaveBeenCalledTimes(1);
      expect(mockCall).toHaveBeenCalledWith(
        'AssetsController:getAssets',
        [{ id: accountId }],
        { chainIds },
      );
      expect(result).toHaveLength(2);
      expect(result).toEqual(
        expect.arrayContaining([
          {
            assetType: solAssetId,
            keyringAccountId: accountId,
            network: Network.Mainnet,
            address: accountAddress,
            symbol: 'SOL',
            decimals: 9,
            rawAmount: '1000000000',
            uiAmount: '1',
          },
          {
            assetType: usdcAssetId,
            keyringAccountId: accountId,
            network: Network.Mainnet,
            mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
            pubkey: expectedUsdcPubkey,
            symbol: 'USDC',
            decimals: 6,
            rawAmount: '1234560',
            uiAmount: '1.23456',
          },
        ]),
      );
    });
  });

  describe('getAccountAssetsByIds', () => {
    it('calls getAssets once and returns ordered array with null gaps', async () => {
      const mockSolAsset = createMockAsset(solAssetId);
      mockCall.mockResolvedValue({
        [accountId]: {
          [solAssetId]: mockSolAsset,
        },
      });

      const missingAssetId = KnownCaip19Id.Ai16zMainnet;
      const result = await adapter.getAccountAssetsByIds(
        accountId,
        [solAssetId, missingAssetId, usdcAssetId],
        accountAddress,
        chainIds,
      );

      expect(mockCall).toHaveBeenCalledTimes(1);
      expect(mockCall).toHaveBeenCalledWith(
        'AssetsController:getAssets',
        [{ id: accountId }],
        { chainIds },
      );
      expect(result).toHaveLength(3);
      expect(result[0]).toStrictEqual({
        assetType: solAssetId,
        keyringAccountId: accountId,
        network: Network.Mainnet,
        address: accountAddress,
        symbol: 'SOL',
        decimals: 9,
        rawAmount: '1000000000',
        uiAmount: '1',
      });
      expect(result[1]).toBeNull();
      expect(result[2]).toBeNull();
    });
  });
});
