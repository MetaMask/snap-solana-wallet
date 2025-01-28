import type { CaipAssetType } from '@metamask/keyring-api';

import { Network } from '../constants/solana';
import type { AssetsService } from '../services/assets/Assets';
import { MOCK_SOLANA_KEYRING_ACCOUNTS } from '../test/mocks/solana-keyring-accounts';
import { deriveSolanaPrivateKey } from './deriveSolanaPrivateKey';
import { findExistingAccounts } from './findExistingAccounts';

// Mock the whole module
jest.mock('./deriveSolanaPrivateKey', () => ({
  deriveSolanaPrivateKey: jest.fn().mockImplementation(async (_index) => {
    const privateKeyBytes =
      MOCK_SOLANA_KEYRING_ACCOUNTS[0].privateKeyBytesAsNum;
    return new Uint8Array(privateKeyBytes);
  }),
}));

describe('findExistingAccounts', () => {
  let mockAssetsService: jest.Mocked<AssetsService>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockAssetsService = {
      getNativeAsset: jest.fn(),
    } as unknown as jest.Mocked<AssetsService>;

    // Needs to be reset before each test
    jest.mocked(deriveSolanaPrivateKey).mockImplementation(async () => {
      const privateKeyBytes =
        MOCK_SOLANA_KEYRING_ACCOUNTS[0].privateKeyBytesAsNum;
      return new Uint8Array(privateKeyBytes);
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('finds accounts with non-zero balances', async () => {
    jest
      .spyOn(mockAssetsService, 'getNativeAsset')
      .mockResolvedValueOnce({
        balance: '123456789',
        decimals: 9,
        scope: Network.Mainnet,
        address: MOCK_SOLANA_KEYRING_ACCOUNTS[0].address as CaipAssetType,
        native: true,
      })
      .mockResolvedValue({
        balance: '0',
        decimals: 9,
        scope: Network.Mainnet,
        address: MOCK_SOLANA_KEYRING_ACCOUNTS[0].address as CaipAssetType,
        native: true,
      });

    const existingAccounts = await findExistingAccounts(mockAssetsService);

    expect(existingAccounts).toHaveLength(1);
    expect(existingAccounts[0]).toStrictEqual({
      index: 0,
      address: MOCK_SOLANA_KEYRING_ACCOUNTS[0].address as CaipAssetType,
      balance: 123456789n,
    });
  });

  it('returns empty array when no accounts have balance', async () => {
    jest.spyOn(mockAssetsService, 'getNativeAsset').mockResolvedValue({
      balance: '0',
      decimals: 9,
      scope: Network.Mainnet,
      address: MOCK_SOLANA_KEYRING_ACCOUNTS[0].address as CaipAssetType,
      native: true,
    });

    const existingAccounts = await findExistingAccounts(mockAssetsService);

    expect(existingAccounts).toHaveLength(0);
    expect(mockAssetsService.getNativeAsset).toHaveBeenCalledTimes(5);
  });

  it('stops searching after finding first account with balance', async () => {
    jest.spyOn(mockAssetsService, 'getNativeAsset').mockResolvedValueOnce({
      balance: '123456789',
      decimals: 9,
      scope: Network.Mainnet,
      address: MOCK_SOLANA_KEYRING_ACCOUNTS[0].address as CaipAssetType,
      native: true,
    });

    const existingAccounts = await findExistingAccounts(mockAssetsService);

    expect(existingAccounts).toHaveLength(1);
    expect(mockAssetsService.getNativeAsset).toHaveBeenCalledTimes(1);
    expect(existingAccounts[0]?.balance).toBe(123456789n);
  });

  it('throws error when derivation fails', async () => {
    jest
      .mocked(deriveSolanaPrivateKey)
      .mockRejectedValueOnce(new Error('Error finding existing accounts'));

    await expect(findExistingAccounts(mockAssetsService)).rejects.toThrow(
      'Error finding existing accounts',
    );
  });

  it('throws error when getNativeAsset fails', async () => {
    // We mock the deriveSolanaPrivateKey to succeed first with the same mock data
    jest
      .mocked(deriveSolanaPrivateKey)
      .mockResolvedValueOnce(
        new Uint8Array(MOCK_SOLANA_KEYRING_ACCOUNTS[0].privateKeyBytesAsNum),
      );

    jest
      .spyOn(mockAssetsService, 'getNativeAsset')
      .mockRejectedValueOnce(new Error('Error finding existing accounts'));

    await expect(findExistingAccounts(mockAssetsService)).rejects.toThrow(
      'Error finding existing accounts',
    );
  });
});
