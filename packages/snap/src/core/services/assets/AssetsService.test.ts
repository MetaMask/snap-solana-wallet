import { Network } from '../../constants/solana';
import {
  SOLANA_MOCK_SPL_TOKENS,
  SOLANA_MOCK_TOKEN,
} from '../../test/mocks/solana-assets';
import { MOCK_SOLANA_KEYRING_ACCOUNT_1 } from '../../test/mocks/solana-keyring-accounts';
import logger from '../../utils/logger';
import type { SolanaConnection } from '../connection';
import { createMockConnection } from '../mocks/mockConnection';
import { MOCK_SOLANA_RPC_GET_TOKEN_ACCOUNTS_BY_OWNER_RESPONSE } from '../mocks/mockSolanaRpcResponses';
import { AssetsService } from './AssetsService';

jest.mock('../connection/SolanaConnection');
jest.mock('../../utils/logger');

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
      const scope = Network.Localnet;

      const mockSend = jest.fn().mockReturnValue({
        context: {
          slot: 302900219n,
        },
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
                    owner: 'owner1',
                    isNative: false,
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

      expect(tokens).toStrictEqual([
        ...SOLANA_MOCK_SPL_TOKENS,
        {
          address: 'solana:123456789abcdef/token:tokenAddress1',
          balance: '0',
          decimals: 6,
          native: false,
          scope: Network.Localnet,
        },
      ]);
    });

    it('throws an error if the RPC call fails', async () => {
      const { address } = MOCK_SOLANA_KEYRING_ACCOUNT_1;
      const scope = Network.Localnet;

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

    it('throws an error if the response from the RPC is not valid', async () => {
      const { address } = MOCK_SOLANA_KEYRING_ACCOUNT_1;
      const scope = Network.Localnet;

      const mockResponse = {
        context: {
          slot: 302900219n,
        },
        value: [
          {
            account: {
              data: {
                parsed: null, // Missing parsed data
              },
            },
          },
        ],
      };

      const mockSend = jest.fn().mockReturnValue(mockResponse);
      jest.spyOn(mockConnection, 'getRpc').mockReturnValue({
        getTokenAccountsByOwner: jest.fn().mockReturnValue({ send: mockSend }),
      } as any);

      await expect(
        assetsService.discoverTokens(address, scope),
      ).rejects.toThrow(
        'At path: value.0.account.data.parsed -- Expected an object, but received: null',
      );
    });
  });

  describe('getNativeAsset', () => {
    it('gets native asset', async () => {
      const { address } = MOCK_SOLANA_KEYRING_ACCOUNT_1;
      const scope = Network.Localnet;

      const nativeAsset = await assetsService.getNativeAsset(address, scope);

      expect(nativeAsset).toStrictEqual(SOLANA_MOCK_TOKEN);
    });

    it('throws an error if the RPC call fails', async () => {
      const { address } = MOCK_SOLANA_KEYRING_ACCOUNT_1;
      const scope = Network.Localnet;

      const mockSend = jest.fn().mockRejectedValue(new Error('Network error'));
      jest.spyOn(mockConnection, 'getRpc').mockReturnValue({
        getBalance: jest.fn().mockReturnValue({ send: mockSend }),
      } as any);

      await expect(
        assetsService.getNativeAsset(address, scope),
      ).rejects.toThrow('Network error');
    });

    it('throws an error if the response from the RPC is not valid', async () => {
      const { address } = MOCK_SOLANA_KEYRING_ACCOUNT_1;
      const scope = Network.Localnet;

      const mockResponse = {
        context: {
          slot: 4, // not a bigint
        },
        value: 12345n,
      };
      const mockSend = jest.fn().mockReturnValue(mockResponse);
      jest.spyOn(mockConnection, 'getRpc').mockReturnValue({
        getBalance: jest.fn().mockReturnValue({ send: mockSend }),
      } as any);

      await expect(
        assetsService.getNativeAsset(address, scope),
      ).rejects.toThrow(
        'At path: context.slot -- Expected a value of type `bigint`, but received: `4`',
      );
    });
  });
});
