/* eslint-disable jest/prefer-strict-equal */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { SolMethod } from '@metamask/keyring-api';
import { type Json } from '@metamask/snaps-sdk';

import { Caip19Id, Network, SolanaCaip19Tokens } from '../../constants/solana';
import {
  SOLANA_MOCK_SPL_TOKENS,
  SOLANA_MOCK_TOKEN,
  SOLANA_MOCK_TOKEN_METADATA,
} from '../../test/mocks/solana-assets';
import {
  MOCK_SOLANA_KEYRING_ACCOUNT_0,
  MOCK_SOLANA_KEYRING_ACCOUNT_1,
  MOCK_SOLANA_KEYRING_ACCOUNT_2,
  MOCK_SOLANA_KEYRING_ACCOUNT_3,
  MOCK_SOLANA_KEYRING_ACCOUNT_4,
  MOCK_SOLANA_KEYRING_ACCOUNT_5,
  MOCK_SOLANA_KEYRING_ACCOUNTS,
} from '../../test/mocks/solana-keyring-accounts';
import { deriveSolanaPrivateKey } from '../../utils/deriveSolanaPrivateKey';
import logger from '../../utils/logger';
import { AssetsService } from '../assets/Assets';
import type { ConfigProvider } from '../config';
import type { Config } from '../config/ConfigProvider';
import type { SolanaConnection } from '../connection/SolanaConnection';
import type { EncryptedStateValue } from '../encrypted-state/EncryptedState';
import { EncryptedSolanaState } from '../encrypted-state/EncryptedState';
import type { TransactionHelper } from '../execution/TransactionHelper';
import { createMockConnection } from '../mocks/mockConnection';
import type { StateValue } from '../state/State';
import { SolanaState } from '../state/State';
import type { TokenMetadataService } from '../token-metadata/TokenMetadata';
import { TransactionsService } from '../transactions/Transactions';
import type { WalletStandardService } from '../wallet-standard/WalletStandardService';
import { SolanaKeyring } from './Keyring';

jest.mock('@metamask/keyring-snap-sdk', () => ({
  ...jest.requireActual('@metamask/keyring-snap-sdk'),
  emitSnapKeyringEvent: jest.fn().mockResolvedValue(null),
}));

jest.mock('../../utils/deriveSolanaPrivateKey', () => ({
  deriveSolanaPrivateKey: jest.fn().mockImplementation((index) => {
    const account = MOCK_SOLANA_KEYRING_ACCOUNTS[index]!;
    if (!account) {
      throw new Error('[deriveSolanaAddress] Not enough mocked indices');
    }
    return new Uint8Array(account.privateKeyBytesAsNum);
  }),
}));

const NON_EXISTENT_ACCOUNT_ID = '123e4567-e89b-12d3-a456-426614174009';

describe('SolanaKeyring', () => {
  let keyring: SolanaKeyring;
  let mockStateValue: StateValue & EncryptedStateValue;
  let mockConfigProvider: ConfigProvider;
  let mockConnection: SolanaConnection;
  let mockTransactionHelper: TransactionHelper;
  let mockTokenMetadataService: TokenMetadataService;
  let mockWalletStandardService: WalletStandardService;

  beforeEach(() => {
    mockConnection = createMockConnection();

    const state = new SolanaState();
    const encryptedState = new EncryptedSolanaState();

    mockConfigProvider = {
      get: jest.fn().mockReturnValue({
        activeNetworks: [Network.Localnet],
      }),
    } as unknown as ConfigProvider;

    mockTokenMetadataService = {
      getMultipleTokenMetadata: jest.fn().mockResolvedValue({}),
    } as unknown as TokenMetadataService;

    const transactionsService = new TransactionsService({
      logger,
      connection: mockConnection,
      configProvider: mockConfigProvider,
      tokenMetadataService: mockTokenMetadataService,
    });

    const assetsService = new AssetsService({
      connection: mockConnection,
      logger,
    });

    mockTransactionHelper = {
      getLatestBlockhash: jest.fn(),
      getComputeUnitEstimate: jest.fn(),
      sendTransaction: jest.fn(),
      base64DecodeTransaction: jest.fn(),
    } as unknown as TransactionHelper;

    mockTokenMetadataService = {
      getMultipleTokenMetadata: jest
        .fn()
        .mockResolvedValue(SOLANA_MOCK_TOKEN_METADATA),
    } as unknown as TokenMetadataService;

    mockWalletStandardService = {
      resolveAccountAddress: jest.fn(),
    } as unknown as WalletStandardService;

    keyring = new SolanaKeyring({
      state,
      encryptedState,
      configProvider: mockConfigProvider,
      transactionsService,
      assetsService,
      tokenMetadataService: mockTokenMetadataService,
      transactionHelper: mockTransactionHelper,
      walletStandardService: mockWalletStandardService,
      logger,
    });

    // To simplify the mocking of individual tests, we initialize the state in happy path with all mock accounts
    mockStateValue = {
      keyringAccounts: MOCK_SOLANA_KEYRING_ACCOUNTS.reduce(
        (acc, account) => ({
          ...acc,
          [account.id]: account,
        }),
        {},
      ),
      mapInterfaceNameToId: {},
      isFetchingAssets: false,
      assets: {},
      isFetchingTransactions: false,
      transactions: {},
    };

    /**
     * Mock the snap_manageState method to control the state
     */
    const snap = {
      request: jest
        .fn()
        .mockImplementation(
          async ({
            method,
            params,
          }: {
            method: string;
            params: { operation: string; newState: Record<string, Json> };
          }) => {
            switch (method) {
              case 'snap_manageState':
                switch (params.operation) {
                  case 'get':
                    return mockStateValue;
                  case 'update':
                    mockStateValue = params.newState as EncryptedStateValue &
                      StateValue;
                    return null;
                  case 'clear':
                    mockStateValue = {} as EncryptedStateValue & StateValue;
                    return null;
                  default:
                    throw new Error(`Unknown operation: ${params.operation}`);
                }
              default:
                throw new Error(`Unknown method: ${method}`);
            }
          },
        ),
    };
    (globalThis as any).snap = snap;
  });

  describe('listAccounts', () => {
    it('lists accounts from the state', async () => {
      const accounts = await keyring.listAccounts();
      expect(accounts).toHaveLength(MOCK_SOLANA_KEYRING_ACCOUNTS.length);
      expect(accounts).toContainEqual(MOCK_SOLANA_KEYRING_ACCOUNT_0);
      expect(accounts).toContainEqual(MOCK_SOLANA_KEYRING_ACCOUNT_1);
      expect(accounts).toContainEqual(MOCK_SOLANA_KEYRING_ACCOUNT_2);
      expect(accounts).toContainEqual(MOCK_SOLANA_KEYRING_ACCOUNT_3);
      expect(accounts).toContainEqual(MOCK_SOLANA_KEYRING_ACCOUNT_4);
      expect(accounts).toContainEqual(MOCK_SOLANA_KEYRING_ACCOUNT_5);
    });

    it('returns empty array if no accounts are found', async () => {
      (snap.request as jest.Mock).mockReturnValueOnce(null);

      const accounts = await keyring.listAccounts();
      expect(accounts).toStrictEqual([]);
    });

    it('throws an error if state fails to be retrieved', async () => {
      (snap.request as jest.Mock).mockRejectedValueOnce(
        new Error('State error'),
      );

      await expect(keyring.listAccounts()).rejects.toThrow(
        'Error listing accounts',
      );
    });
  });

  describe('listAccountAssets', () => {
    it('lists account assets', async () => {
      const assets = await keyring.listAccountAssets(
        MOCK_SOLANA_KEYRING_ACCOUNT_0.id,
      );
      expect(assets).toStrictEqual([
        SOLANA_MOCK_TOKEN.address,
        ...SOLANA_MOCK_SPL_TOKENS.map((token) => token.address),
      ]);
    });

    it('throws and error if the account provided is not a uuid', async () => {
      await expect(
        keyring.listAccountAssets('non-existent-id'),
      ).rejects.toThrow(/Expected a string matching/u);
    });

    it('throws an error if account is not found', async () => {
      await expect(
        keyring.listAccountAssets(NON_EXISTENT_ACCOUNT_ID),
      ).rejects.toThrow(`Account "${NON_EXISTENT_ACCOUNT_ID}" not found`);
    });

    it('returns empty if no active networks', async () => {
      jest
        .spyOn(mockConfigProvider, 'get')
        .mockReturnValue({ activeNetworks: [] } as unknown as Config);

      const assets = await keyring.listAccountAssets(
        MOCK_SOLANA_KEYRING_ACCOUNT_0.id,
      );
      expect(assets).toStrictEqual([]);
    });
  });

  describe('getAccount', () => {
    it('gets account by id', async () => {
      const account = await keyring.getAccount(
        MOCK_SOLANA_KEYRING_ACCOUNT_1.id,
      );
      expect(account).toStrictEqual(MOCK_SOLANA_KEYRING_ACCOUNT_1);
    });

    it('throws and error if the account provided is not a uuid', async () => {
      await expect(keyring.getAccount('non-existent-id')).rejects.toThrow(
        /Expected a string matching/u,
      );
    });

    it('returns undefined if account is not found', async () => {
      await expect(keyring.getAccount(NON_EXISTENT_ACCOUNT_ID)).rejects.toThrow(
        `Account "${NON_EXISTENT_ACCOUNT_ID}" not found`,
      );
    });

    it('throws an error if state fails to be retrieved', async () => {
      (snap.request as jest.Mock).mockRejectedValueOnce(
        new Error('State error'),
      );

      await expect(
        keyring.getAccount(MOCK_SOLANA_KEYRING_ACCOUNT_1.id),
      ).rejects.toThrow('State error');
    });
  });

  describe('getAccountOrThrow', () => {
    it('throws an error if account is not found', async () => {
      await expect(
        keyring.getAccountOrThrow(NON_EXISTENT_ACCOUNT_ID),
      ).rejects.toThrow(`Account "${NON_EXISTENT_ACCOUNT_ID}" not found`);
    });
  });

  describe('createAccount', () => {
    it('creates new accounts with increasing indices', async () => {
      mockStateValue = {
        keyringAccounts: {},
        mapInterfaceNameToId: {},
        isFetchingTransactions: false,
        transactions: {},
        isFetchingAssets: false,
        assets: {},
      };

      const firstAccount = await keyring.createAccount();
      const secondAccount = await keyring.createAccount();
      const thirdAccount = await keyring.createAccount();

      expect(firstAccount).toEqual({
        ...MOCK_SOLANA_KEYRING_ACCOUNT_0,
        id: expect.any(String),
      });
      expect(secondAccount).toEqual({
        ...MOCK_SOLANA_KEYRING_ACCOUNT_1,
        id: expect.any(String),
      });
      expect(thirdAccount).toEqual({
        ...MOCK_SOLANA_KEYRING_ACCOUNT_2,
        id: expect.any(String),
      });
    });

    it('recreates accounts with missing indices, in order', async () => {
      mockStateValue = {
        keyringAccounts: {},
        mapInterfaceNameToId: {},
        isFetchingTransactions: false,
        transactions: {},
        isFetchingAssets: false,
        assets: {},
      };

      const firstAccount = await keyring.createAccount();
      const secondAccount = await keyring.createAccount();
      const thirdAccount = await keyring.createAccount();
      const fourthAccount = await keyring.createAccount();
      const fifthAccount = await keyring.createAccount();

      delete mockStateValue.keyringAccounts[secondAccount.id];
      delete mockStateValue.keyringAccounts[fourthAccount.id];

      const regeneratedSecondAccount = await keyring.createAccount();
      const regeneratedFourthAccount = await keyring.createAccount();
      const sixthAccount = await keyring.createAccount();

      /**
       * Accounts are created in order
       */
      expect(firstAccount).toEqual({
        ...MOCK_SOLANA_KEYRING_ACCOUNT_0,
        id: expect.any(String),
      });
      expect(secondAccount).toEqual({
        ...MOCK_SOLANA_KEYRING_ACCOUNT_1,
        id: expect.any(String),
      });
      expect(thirdAccount).toEqual({
        ...MOCK_SOLANA_KEYRING_ACCOUNT_2,
        id: expect.any(String),
      });
      expect(fourthAccount).toEqual({
        ...MOCK_SOLANA_KEYRING_ACCOUNT_3,
        id: expect.any(String),
      });
      expect(fifthAccount).toEqual({
        ...MOCK_SOLANA_KEYRING_ACCOUNT_4,
        id: expect.any(String),
      });
      expect(sixthAccount).toEqual({
        ...MOCK_SOLANA_KEYRING_ACCOUNT_5,
        id: expect.any(String),
      });

      /**
       * Regenerated accounts should pick up the missing indices
       */
      expect(regeneratedSecondAccount).toEqual({
        ...MOCK_SOLANA_KEYRING_ACCOUNT_1,
        id: expect.any(String),
      });
      expect(regeneratedFourthAccount).toEqual({
        ...MOCK_SOLANA_KEYRING_ACCOUNT_3,
        id: expect.any(String),
      });
    });

    it('throws when deriving address fails', async () => {
      jest.mocked(deriveSolanaPrivateKey).mockImplementation(async () => {
        return Promise.reject(new Error('Error deriving address'));
      });

      await expect(keyring.createAccount()).rejects.toThrow(
        'Error creating account',
      );
    });

    it('throws an error if state fails to be retrieved', async () => {
      (snap.request as jest.Mock).mockRejectedValueOnce(
        new Error('State error'),
      );

      await expect(keyring.createAccount()).rejects.toThrow(
        'Error creating account',
      );
    });
  });

  describe('deleteAccount', () => {
    it('deletes an account', async () => {
      const accountBeforeDeletion = await keyring.getAccount(
        MOCK_SOLANA_KEYRING_ACCOUNT_1.id,
      );
      expect(accountBeforeDeletion).toBeDefined();

      await keyring.deleteAccount(MOCK_SOLANA_KEYRING_ACCOUNT_1.id);

      await expect(
        keyring.getAccount(MOCK_SOLANA_KEYRING_ACCOUNT_1.id),
      ).rejects.toThrow(
        `Account "${MOCK_SOLANA_KEYRING_ACCOUNT_1.id}" not found`,
      );
    });

    it('throws an error if account provided is not a uuid', async () => {
      await expect(keyring.deleteAccount('non-existent-id')).rejects.toThrow(
        /Expected a string matching/u,
      );
    });

    it('throws an error if state fails to be retrieved', async () => {
      (snap.request as jest.Mock).mockRejectedValueOnce(
        new Error('State error'),
      );

      await expect(
        keyring.deleteAccount(MOCK_SOLANA_KEYRING_ACCOUNT_1.id),
      ).rejects.toThrow('State error');
    });
  });

  describe('filterAccountChains', () => {
    it.todo('filters account chains');
  });

  describe('updateAccount', () => {
    it.todo('updates an account');
  });

  describe('getAccountBalances', () => {
    it('gets account balance', async () => {
      const accountBalance = await keyring.getAccountBalances(
        MOCK_SOLANA_KEYRING_ACCOUNT_1.id,
        [Caip19Id.SolLocalnet],
      );
      expect(accountBalance).toStrictEqual({
        [Caip19Id.SolLocalnet]: {
          amount: '0.123456789',
          unit: 'SOL',
        },
      });
    });

    it('gets account and token balances', async () => {
      const accountBalance = await keyring.getAccountBalances(
        MOCK_SOLANA_KEYRING_ACCOUNT_1.id,
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
        keyring.getAccountBalances(MOCK_SOLANA_KEYRING_ACCOUNT_1.id, [
          Caip19Id.SolMainnet,
        ]),
      ).rejects.toThrow('Error getting assets');
    });
  });

  describe('handleSubmitRequest', () => {
    describe('when method is SendAndConfirmTransaction', () => {
      it('throws error when params are invalid', async () => {
        const request = {
          id: 'some-id',
          scope: Network.Devnet,
          account: MOCK_SOLANA_KEYRING_ACCOUNT_4.id,
          request: {
            method: SolMethod.SendAndConfirmTransaction,
            params: {
              base64EncodedTransactionMessage: undefined as unknown as string,
            },
          },
        };

        await expect(keyring.submitRequest(request)).rejects.toThrow(
          'At path: base64EncodedTransactionMessage -- Expected a string, but received: undefined',
        );
      });

      it('calls the transaction helper to send and confirm a transaction', async () => {
        jest
          .spyOn(keyring, 'getAccount')
          .mockResolvedValue(MOCK_SOLANA_KEYRING_ACCOUNT_4);

        jest
          .spyOn(mockTransactionHelper, 'sendTransaction')
          .mockResolvedValue('someSignature');

        const request = {
          id: 'some-id',
          scope: Network.Devnet,
          account: MOCK_SOLANA_KEYRING_ACCOUNT_4.id,
          request: {
            method: SolMethod.SendAndConfirmTransaction,
            params: {
              base64EncodedTransactionMessage:
                'someBase64EncodedTransactionMessage',
            },
          },
        };

        const response = await keyring.submitRequest(request);

        expect(response).toStrictEqual({
          pending: false,
          result: {
            signature: 'someSignature',
          },
        });
      });
    });

    it('throws an error if the method is not supported', async () => {
      const request = {
        id: 'some-id',
        scope: Network.Devnet,
        account: MOCK_SOLANA_KEYRING_ACCOUNT_3.id,
        request: {
          method: 'unsupportedMethod' as SolMethod,
          params: {},
        },
      };

      await expect(keyring.submitRequest(request)).rejects.toThrow(
        /but received: "unsupportedMethod"/u,
      );
    });

    it('throws error when account is not found', async () => {
      jest.spyOn(keyring as any, 'getAccount').mockResolvedValue(undefined);

      const request = {
        id: 'some-id',
        scope: Network.Devnet,
        account: NON_EXISTENT_ACCOUNT_ID,
        request: {
          method: SolMethod.SendAndConfirmTransaction,
          params: {
            base64EncodedTransactionMessage:
              'someBase64EncodedTransactionMessage',
          },
        },
      };

      await expect(keyring.submitRequest(request)).rejects.toThrow(
        `Account "${NON_EXISTENT_ACCOUNT_ID}" not found`,
      );
    });
  });
});
