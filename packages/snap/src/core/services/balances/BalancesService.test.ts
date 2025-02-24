import {
  KnownCaip19Id,
  Network,
  SolanaCaip19Tokens,
} from '../../constants/solana';
import { SOLANA_MOCK_TOKEN_METADATA } from '../../test/mocks/solana-assets';
import { MOCK_SOLANA_KEYRING_ACCOUNT_1 } from '../../test/mocks/solana-keyring-accounts';
import logger from '../../utils/logger';
import { AssetsService } from '../assets/AssetsService';
import type { SolanaConnection } from '../connection/SolanaConnection';
import { EncryptedState } from '../encrypted-state/EncryptedState';
import { createMockConnection } from '../mocks/mockConnection';
import type { TokenMetadataService } from '../token-metadata/TokenMetadata';
import { BalancesService } from './BalancesService';

describe('BalancesService', () => {
  let mockConnection: SolanaConnection;
  let balancesService: BalancesService;
  let mockTokenMetadataService: TokenMetadataService;

  beforeEach(() => {
    mockConnection = createMockConnection();

    const state = new EncryptedState();

    mockTokenMetadataService = {
      getTokensMetadata: jest
        .fn()
        .mockResolvedValue(SOLANA_MOCK_TOKEN_METADATA),
    } as unknown as TokenMetadataService;

    const mockAssetsService = new AssetsService({
      connection: mockConnection,
      logger,
    });

    balancesService = new BalancesService(
      mockAssetsService,
      mockTokenMetadataService,
      state,
    );

    (globalThis as any).snap = {
      request: jest.fn(),
    };
  });

  describe('getAccountBalances', () => {
    it('gets account balance', async () => {
      const accountBalance = await balancesService.getAccountBalances(
        MOCK_SOLANA_KEYRING_ACCOUNT_1,
        [KnownCaip19Id.SolLocalnet],
      );
      expect(accountBalance).toStrictEqual({
        [KnownCaip19Id.SolLocalnet]: {
          amount: '0.123456789',
          unit: 'SOL',
        },
      });
    });

    it('gets account and token balances', async () => {
      const accountBalance = await balancesService.getAccountBalances(
        MOCK_SOLANA_KEYRING_ACCOUNT_1,
        [
          `${Network.Localnet}/${SolanaCaip19Tokens.SOL}`,
          `${Network.Localnet}/token:address1`,
          `${Network.Localnet}/token:address2`,
        ],
      );
      expect(accountBalance).toStrictEqual({
        [`${Network.Localnet}/${SolanaCaip19Tokens.SOL}`]: {
          amount: '0.123456789',
          unit: 'SOL',
        },
        [`${Network.Localnet}/token:address1`]: {
          amount: '0.123456789',
          unit: 'MOCK1',
        },
        [`${Network.Localnet}/token:address2`]: {
          amount: '0.987654321',
          unit: 'MOCK2',
        },
      });
    });

    it('throws an error if balance fails to be retrieved', async () => {
      const mockSend = jest
        .fn()
        .mockRejectedValueOnce(new Error('Error getting assets'));
      const mockGetBalance = jest.fn().mockReturnValue({ send: mockSend });
      jest.spyOn(mockConnection, 'getRpc').mockReturnValue({
        getBalance: mockGetBalance,
        getTokenAccountsByOwner: mockGetBalance,
      } as any);

      await expect(
        balancesService.getAccountBalances(MOCK_SOLANA_KEYRING_ACCOUNT_1, [
          KnownCaip19Id.SolMainnet,
        ]),
      ).rejects.toThrow('Error getting assets');
    });
  });

  describe('updateBalancesPostTransactions', () => {
    it.todo(
      'updates the balances of the accounts after a set of transactions have been executed',
    );
  });
});
