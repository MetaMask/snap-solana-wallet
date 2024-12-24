import {
  SolanaCaip19Tokens,
  SOL_SYMBOL,
  SolanaCaip2Networks,
  SOL_IMAGE_URL,
} from '../constants/solana';
import { SOLANA_MOCK_SPL_TOKENS } from '../test/mocks/solana-assets';
import { MOCK_SOLANA_KEYRING_ACCOUNT_1 } from '../test/mocks/solana-keyring-accounts';
import logger from '../utils/logger';
import { AssetsService } from './assets';
import type { SolanaConnection } from './connection';
import { createMockConnection } from './mocks/mockConnection';
import { MOCK_SOLANA_RPC_GET_TOKEN_ACCOUNTS_BY_OWNER_RESPONSE } from './mocks/mockSolanaRpcResponses';

jest.mock('./connection');
jest.mock('../utils/logger');

describe('AssetsService', () => {
  let assetsService: AssetsService;
  let mockConnection: SolanaConnection;

  beforeEach(() => {
    mockConnection = createMockConnection();

    assetsService = new AssetsService({
      connection: mockConnection,
      logger,
    });
  });

  describe('discoverTokens', () => {
    it('discovers tokens with non-zero balance', async () => {
      const { address } = MOCK_SOLANA_KEYRING_ACCOUNT_1;
      const scope = SolanaCaip2Networks.Localnet;

      const mockSend = jest.fn().mockReturnValue({
        value: [
          ...MOCK_SOLANA_RPC_GET_TOKEN_ACCOUNTS_BY_OWNER_RESPONSE.result.value,
          // adding a 0 balance token to the response in purpose
          // to test the filtering of zero balance tokens
          {
            account: {
              data: {
                parsed: {
                  info: {
                    mint: 'tokenAddress1',
                    tokenAmount: {
                      amount: '0',
                      decimals: 6,
                    },
                  },
                },
              },
            },
          },
        ],
      });

      const mockGetTokenAccountsByOwner = jest
        .fn()
        .mockReturnValue({ send: mockSend });
      jest.spyOn(mockConnection, 'getRpc').mockReturnValue({
        getTokenAccountsByOwner: mockGetTokenAccountsByOwner,
      } as any);

      const tokens = await assetsService.discoverTokens(address, scope);

      expect(tokens).toStrictEqual(
        SOLANA_MOCK_SPL_TOKENS.map(({ metadata, ...token }) => token),
      );
    });

    it('throws an error if the RPC call fails', async () => {
      const { address } = MOCK_SOLANA_KEYRING_ACCOUNT_1;
      const scope = SolanaCaip2Networks.Localnet;

      const mockSend = jest.fn().mockRejectedValue(new Error('Network error'));
      const mockGetTokenAccountsByOwner = jest
        .fn()
        .mockReturnValue({ send: mockSend });
      jest.spyOn(mockConnection, 'getRpc').mockReturnValue({
        getTokenAccountsByOwner: mockGetTokenAccountsByOwner,
      } as any);

      await expect(
        assetsService.discoverTokens(address, scope),
      ).rejects.toThrow('Network error');
    });
  });

  describe('getNativeAsset', () => {
    it('gets native asset', async () => {
      const { address } = MOCK_SOLANA_KEYRING_ACCOUNT_1;
      const scope = SolanaCaip2Networks.Localnet;

      const nativeAsset = await assetsService.getNativeAsset(address, scope);

      expect(nativeAsset).toStrictEqual({
        scope,
        address: `${scope}/${SolanaCaip19Tokens.SOL}`,
        balance: '123456789',
        decimals: 9,
        native: true,
        metadata: {
          symbol: SOL_SYMBOL,
          name: 'Solana',
          iconUrl: SOL_IMAGE_URL,
        },
      });
    });

    it('throws an error if the RPC call fails', async () => {
      const { address } = MOCK_SOLANA_KEYRING_ACCOUNT_1;
      const scope = SolanaCaip2Networks.Localnet;

      const mockSend = jest.fn().mockRejectedValue(new Error('Network error'));
      jest.spyOn(mockConnection, 'getRpc').mockReturnValue({
        getBalance: jest.fn().mockReturnValue({ send: mockSend }),
      } as any);

      await expect(
        assetsService.getNativeAsset(address, scope),
      ).rejects.toThrow('Network error');
    });
  });
});
