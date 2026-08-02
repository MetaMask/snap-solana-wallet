import type { AssetsProviderMessenger } from '@metamask-previews/snap-networks-utils';
import type { Asset } from '@metamask/assets-controller';
import {
  findAssociatedTokenPda,
  TOKEN_PROGRAM_ADDRESS,
} from '@solana-program/token';
import { address as asAddress } from '@solana/kit';

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
  let mockMessenger: AssetsProviderMessenger;

  const accountId = MOCK_SOLANA_KEYRING_ACCOUNT_0.id;
  const accountAddress = MOCK_SOLANA_KEYRING_ACCOUNT_0.address;
  const solAssetId = KnownCaip19Id.SolMainnet;
  const usdcAssetId = KnownCaip19Id.UsdcMainnet;
  const scope = Network.Mainnet;

  beforeEach(async () => {
    jest.clearAllMocks();

    mockCall = jest.fn();
    mockMessenger = { call: mockCall };
    adapter = new CoreAssetsAdapter(mockMessenger);
  });

  describe('getAccountAssetByID', () => {
    it('calls AssetsController:getAccountAssetByID and maps native SOL', async () => {
      const mockAsset = createMockAsset(solAssetId);
      mockCall.mockResolvedValue(mockAsset);

      const result = await adapter.getAccountAssetByID(
        accountId,
        solAssetId,
        accountAddress,
      );

      expect(mockCall).toHaveBeenCalledWith(
        'AssetsController:getAccountAssetByID',
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

      const result = await adapter.getAccountAssetByID(
        accountId,
        solAssetId,
        accountAddress,
      );

      expect(result).toBeNull();
    });

    it('falls back when controller metadata fields are missing', async () => {
      const mockAsset = createMockAsset(solAssetId, {
        metadata: {
          type: 'native',
          symbol: undefined as unknown as string,
          name: 'Solana',
          decimals: undefined as unknown as number,
        },
      });
      mockCall.mockResolvedValue(mockAsset);

      const result = await adapter.getAccountAssetByID(
        accountId,
        solAssetId,
        accountAddress,
      );

      expect(result).toMatchObject({
        symbol: 'UNKNOWN',
        decimals: 0,
        rawAmount: '1000000000',
        uiAmount: '1000000000',
      });
    });
  });

  describe('getAccountAssetsByIDs', () => {
    it('calls getAccountAssetsByIDs once and returns keyed results with null gaps', async () => {
      const mockSolAsset = createMockAsset(solAssetId);
      mockCall.mockResolvedValue({
        [solAssetId]: mockSolAsset,
      });

      const missingAssetId = KnownCaip19Id.Ai16zMainnet;
      const result = await adapter.getAccountAssetsByIDs(
        accountId,
        [solAssetId, missingAssetId, usdcAssetId],
        accountAddress,
      );

      expect(mockCall).toHaveBeenCalledTimes(1);
      expect(mockCall).toHaveBeenCalledWith(
        'AssetsController:getAccountAssetsByIDs',
        accountId,
        [solAssetId, missingAssetId, usdcAssetId],
      );
      expect(result).toStrictEqual({
        [solAssetId]: {
          assetType: solAssetId,
          keyringAccountId: accountId,
          network: Network.Mainnet,
          address: accountAddress,
          symbol: 'SOL',
          decimals: 9,
          rawAmount: '1000000000',
          uiAmount: '1',
        },
        [missingAssetId]: null,
        [usdcAssetId]: null,
      });
    });

    it('returns null for snap-owned NFT IDs without calling the provider', async () => {
      const nftAssetId = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/nft:abc123';

      const result = await adapter.getAccountAssetsByIDs(
        accountId,
        [nftAssetId],
        accountAddress,
      );

      expect(mockCall).not.toHaveBeenCalled();
      expect(result).toStrictEqual({ [nftAssetId]: null });
    });
  });

  describe('getAccountAssetsByScope', () => {
    it('calls getAccountAssetsByScope once and maps supported assets', async () => {
      const mockSolAsset = createMockAsset(solAssetId);
      const mockUsdcAsset = createMockAsset(usdcAssetId, {
        balance: { amount: '1234560' },
      });
      mockCall.mockResolvedValue({
        [solAssetId]: mockSolAsset,
        [usdcAssetId]: mockUsdcAsset,
      });

      const [expectedUsdcPubkey] = await findAssociatedTokenPda({
        mint: asAddress('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
        owner: asAddress(accountAddress),
        tokenProgram: TOKEN_PROGRAM_ADDRESS,
      });

      const result = await adapter.getAccountAssetsByScope(
        scope,
        accountId,
        accountAddress,
      );

      expect(mockCall).toHaveBeenCalledTimes(1);
      expect(mockCall).toHaveBeenCalledWith(
        'AssetsController:getAccountAssetsByScope',
        accountId,
        scope,
      );
      expect(result).toHaveLength(2);
      expect(result).toStrictEqual(
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

    it('skips NFT assets returned by the provider', async () => {
      const nftAssetId = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/nft:abc123';
      mockCall.mockResolvedValue({
        [solAssetId]: createMockAsset(solAssetId),
        [nftAssetId]: createMockAsset(nftAssetId, {
          metadata: {
            type: 'nft',
            symbol: 'NFT',
            name: 'NFT',
            decimals: 0,
          },
        }),
      });

      const result = await adapter.getAccountAssetsByScope(
        scope,
        accountId,
        accountAddress,
      );

      expect(result).toHaveLength(1);
      expect(result[0]?.assetType).toBe(solAssetId);
    });
  });
});
