/* eslint-disable no-restricted-globals */
/* eslint-disable jest/prefer-strict-equal */
import type { SLIP10PathNode, SupportedCurve } from '@metamask/key-tree';
import { SLIP10Node } from '@metamask/key-tree';
import type { KeyringRequest } from '@metamask/keyring-api';
import { SolMethod } from '@metamask/keyring-api';
import type { CaipAssetType, JsonRpcRequest } from '@metamask/snaps-sdk';
import { type Json } from '@metamask/snaps-sdk';

import { KnownCaip19Id, Network } from '../../constants/solana';
import type { AssetsService } from '../../services/assets/AssetsService';
import type { ConfigProvider } from '../../services/config';
import type { ConfirmationHandler } from '../../services/confirmation/ConfirmationHandler';
import type { SolanaConnection } from '../../services/connection/SolanaConnection';
import type { EncryptedStateValue } from '../../services/encrypted-state/EncryptedState';
import { EncryptedState } from '../../services/encrypted-state/EncryptedState';
import { createMockConnection } from '../../services/mocks/mockConnection';
import { State, type StateValue } from '../../services/state/State';
import type { TokenMetadataService } from '../../services/token-metadata/TokenMetadata';
import { TransactionsService } from '../../services/transactions/TransactionsService';
import { MOCK_SIGN_AND_SEND_TRANSACTION_REQUEST } from '../../services/wallet/mocks';
import type { WalletService } from '../../services/wallet/WalletService';
import {
  SOLANA_MOCK_TOKEN,
  SOLANA_MOCK_TOKEN_METADATA,
} from '../../test/mocks/solana-assets';
import {
  MOCK_SEED_PHRASE_BYTES,
  MOCK_SOLANA_KEYRING_ACCOUNT_0,
  MOCK_SOLANA_KEYRING_ACCOUNT_1,
  MOCK_SOLANA_KEYRING_ACCOUNT_2,
  MOCK_SOLANA_KEYRING_ACCOUNT_3,
  MOCK_SOLANA_KEYRING_ACCOUNT_4,
  MOCK_SOLANA_KEYRING_ACCOUNT_5,
  MOCK_SOLANA_KEYRING_ACCOUNTS,
} from '../../test/mocks/solana-keyring-accounts';
import { getBip32Entropy } from '../../utils/getBip32Entropy';
import logger from '../../utils/logger';
import { SolanaKeyring } from './Keyring';

jest.mock('@metamask/keyring-snap-sdk', () => ({
  ...jest.requireActual('@metamask/keyring-snap-sdk'),
  emitSnapKeyringEvent: jest.fn().mockResolvedValue(null),
}));

jest.mock('../../utils/getBip32Entropy', () => ({
  getBip32Entropy: jest
    .fn()
    .mockImplementation(async (path: string[], curve: SupportedCurve) => {
      return await SLIP10Node.fromDerivationPath({
        derivationPath: [
          MOCK_SEED_PHRASE_BYTES,
          ...path.slice(1).map((node) => `slip10:${node}` as SLIP10PathNode),
        ],
        curve,
      });
    }),
}));

const NON_EXISTENT_ACCOUNT_ID = '123e4567-e89b-12d3-a456-426614174009';

describe('SolanaKeyring', () => {
  let keyring: SolanaKeyring;
  let mockStateValue: EncryptedStateValue & StateValue;
  let mockConfigProvider: ConfigProvider;
  let mockConnection: SolanaConnection;
  let mockTokenMetadataService: TokenMetadataService;
  let mockWalletService: WalletService;
  let mockAssetsService: AssetsService;
  let mockConfirmationHandler: ConfirmationHandler;

  beforeEach(() => {
    jest.clearAllMocks();

    mockConnection = createMockConnection();

    const encryptedState = new EncryptedState();
    const state = new State();

    mockConfigProvider = {
      get: jest.fn().mockReturnValue({
        activeNetworks: [Network.Localnet],
      }),
    } as unknown as ConfigProvider;

    mockTokenMetadataService = {
      getTokensMetadata: jest.fn().mockResolvedValue({}),
    } as unknown as TokenMetadataService;

    const transactionsService = new TransactionsService({
      logger,
      connection: mockConnection,
      tokenMetadataService: mockTokenMetadataService,
      state,
      configProvider: mockConfigProvider,
    });

    mockAssetsService = {
      listAccountAssets: jest.fn(),
      getAccountBalances: jest.fn(),
    } as unknown as AssetsService;

    mockTokenMetadataService = {
      getTokensMetadata: jest
        .fn()
        .mockResolvedValue(SOLANA_MOCK_TOKEN_METADATA),
    } as unknown as TokenMetadataService;

    mockWalletService = {
      resolveAccountAddress: jest.fn(),
      signIn: jest.fn(),
      signTransaction: jest.fn(),
      signMessage: jest.fn(),
      signAndSendTransaction: jest.fn(),
    } as unknown as WalletService;

    mockConfirmationHandler = {
      handleKeyringRequest: jest.fn(),
    } as unknown as ConfirmationHandler;

    keyring = new SolanaKeyring({
      encryptedState,
      state,
      logger,
      transactionsService,
      assetsService: mockAssetsService,
      walletService: mockWalletService,
      confirmationHandler: mockConfirmationHandler,
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
      assets: {},
      transactions: {},
      metadata: {},
      tokenPrices: {},
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
    it('calls the assets service', async () => {
      jest
        .spyOn(mockAssetsService, 'listAccountAssets')
        .mockResolvedValue([SOLANA_MOCK_TOKEN.address]);

      await keyring.listAccountAssets(MOCK_SOLANA_KEYRING_ACCOUNT_0.id);

      expect(mockAssetsService.listAccountAssets).toHaveBeenCalledWith(
        MOCK_SOLANA_KEYRING_ACCOUNT_0,
      );
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
        transactions: {},
        assets: {},
        metadata: {},
        tokenPrices: {},
      };

      const firstAccount = await keyring.createAccount();
      const secondAccount = await keyring.createAccount();
      const thirdAccount = await keyring.createAccount();

      const accounts = Object.values(mockStateValue.keyringAccounts);
      expect(accounts).toHaveLength(3);

      const accountIndex0 = accounts.find((acc) => acc.index === 0);
      const accountIndex1 = accounts.find((acc) => acc.index === 1);
      const accountIndex2 = accounts.find((acc) => acc.index === 2);

      expect(accountIndex0).toEqual({
        ...MOCK_SOLANA_KEYRING_ACCOUNT_0,
        id: firstAccount.id,
      });
      expect(accountIndex1).toEqual({
        ...MOCK_SOLANA_KEYRING_ACCOUNT_1,
        id: secondAccount.id,
      });
      expect(accountIndex2).toEqual({
        ...MOCK_SOLANA_KEYRING_ACCOUNT_2,
        id: thirdAccount.id,
      });
    });

    it('recreates accounts with missing indices, in order', async () => {
      mockStateValue = {
        keyringAccounts: {},
        mapInterfaceNameToId: {},
        transactions: {},
        assets: {},
        metadata: {},
        tokenPrices: {},
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

      const accounts = Object.values(mockStateValue.keyringAccounts);
      expect(accounts).toHaveLength(6);

      const accountIndex0 = accounts.find((acc) => acc.index === 0);
      const accountIndex1 = accounts.find((acc) => acc.index === 1);
      const accountIndex2 = accounts.find((acc) => acc.index === 2);
      const accountIndex3 = accounts.find((acc) => acc.index === 3);
      const accountIndex4 = accounts.find((acc) => acc.index === 4);
      const accountIndex5 = accounts.find((acc) => acc.index === 5);

      expect(accountIndex0).toEqual({
        ...MOCK_SOLANA_KEYRING_ACCOUNT_0,
        id: firstAccount.id,
      });
      expect(accountIndex2).toEqual({
        ...MOCK_SOLANA_KEYRING_ACCOUNT_2,
        id: thirdAccount.id,
      });
      expect(accountIndex4).toEqual({
        ...MOCK_SOLANA_KEYRING_ACCOUNT_4,
        id: fifthAccount.id,
      });

      expect(accountIndex1).toEqual({
        ...MOCK_SOLANA_KEYRING_ACCOUNT_1,
        id: regeneratedSecondAccount.id,
      });
      expect(accountIndex3).toEqual({
        ...MOCK_SOLANA_KEYRING_ACCOUNT_3,
        id: regeneratedFourthAccount.id,
      });

      expect(accountIndex5).toEqual({
        ...MOCK_SOLANA_KEYRING_ACCOUNT_5,
        id: sixthAccount.id,
      });
    });

    it('uses accountNameSuggestion if it is provided, and tells the client not to display the suggestion dialog', async () => {
      const emitEventSpy = jest.spyOn(keyring, 'emitEvent');
      const account = await keyring.createAccount({
        accountNameSuggestion: 'My Cool Account Name',
      });
      expect(emitEventSpy).toHaveBeenCalledWith('notify:accountCreated', {
        accountNameSuggestion: 'My Cool Account Name',
        displayAccountNameSuggestion: false,
        displayConfirmation: false,
        account,
      });
    });

    it('throws when deriving address fails', async () => {
      jest.mocked(getBip32Entropy).mockImplementationOnce(async () => {
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
    it('rejects invalid params', async () => {
      await expect(
        keyring.getAccountBalances(MOCK_SOLANA_KEYRING_ACCOUNT_1.id, [
          KnownCaip19Id.SolMainnet,
          'Bob' as unknown as CaipAssetType,
        ]),
      ).rejects.toThrow(/At path: assets.1 -- Expected a string matching/u);
    });

    it('throws an error if account is not found', async () => {
      await expect(
        keyring.getAccountBalances(NON_EXISTENT_ACCOUNT_ID, [
          KnownCaip19Id.SolMainnet,
        ]),
      ).rejects.toThrow(`Account "${NON_EXISTENT_ACCOUNT_ID}" not found`);
    });

    it('rejects invalid responses', async () => {
      const invalidResponse = {
        Bob: {
          amount: '0.123456789',
          unit: 'SOL',
        },
      };
      jest
        .spyOn(mockAssetsService, 'getAccountBalances')
        .mockResolvedValue(invalidResponse);

      await expect(
        keyring.getAccountBalances(MOCK_SOLANA_KEYRING_ACCOUNT_1.id, [
          KnownCaip19Id.SolMainnet,
        ]),
      ).rejects.toThrow('Invalid Response');
    });
  });

  describe('resolveAccountAddress', () => {
    it('returns resolved address when wallet standard service resolves successfully', async () => {
      const mockScope = Network.Testnet;
      const mockRequest = {
        id: 1,
        jsonrpc: '2.0',
        ...MOCK_SIGN_AND_SEND_TRANSACTION_REQUEST,
      } as unknown as JsonRpcRequest;
      const mockResolvedAddress = `${mockScope}:resolved-address`;

      jest
        .spyOn(mockWalletService, 'resolveAccountAddress')
        .mockResolvedValue(mockResolvedAddress);

      const result = await keyring.resolveAccountAddress(
        mockScope,
        mockRequest,
      );

      expect(result).toStrictEqual({ address: mockResolvedAddress });
      expect(mockWalletService.resolveAccountAddress).toHaveBeenCalledWith(
        MOCK_SOLANA_KEYRING_ACCOUNTS,
        mockScope,
        MOCK_SIGN_AND_SEND_TRANSACTION_REQUEST,
      );
    });

    it('returns null when an error occurs', async () => {
      const mockScope = Network.Testnet;
      const mockRequest = {
        method: 'someMethod',
        params: [],
      } as unknown as JsonRpcRequest;

      jest
        .spyOn(mockWalletService, 'resolveAccountAddress')
        .mockRejectedValue(new Error('Something went wrong'));

      const result = await keyring.resolveAccountAddress(
        mockScope,
        mockRequest,
      );

      expect(result).toBeNull();
    });
  });

  describe('submitRequest', () => {
    it('throws an error if the account does not have the method', async () => {
      const snap = {
        request: jest.fn().mockResolvedValue({
          keyringAccounts: {
            [MOCK_SOLANA_KEYRING_ACCOUNT_0.id]: {
              ...MOCK_SOLANA_KEYRING_ACCOUNT_0,
              methods: [],
              scopes: [Network.Localnet],
            },
          },
        }),
      };

      (globalThis as any).snap = snap;

      await expect(
        keyring.submitRequest({
          account: MOCK_SOLANA_KEYRING_ACCOUNT_0.id,
          id: crypto.randomUUID(),
          request: {
            method: SolMethod.SignAndSendTransaction,
            params: {
              account: {
                address: MOCK_SOLANA_KEYRING_ACCOUNT_0.address,
              },
              transaction: 'SGVsbG8sIHdvcmxkIQ==', // "Hello, world!" in base64
              scope: Network.Localnet,
            },
          },
          scope: Network.Localnet,
        }),
      ).rejects.toThrow(
        `Method "${SolMethod.SignAndSendTransaction}" is not allowed for this account`,
      );
    });

    it('throws an error if the account does not have the scope', async () => {
      const snap = {
        request: jest.fn().mockResolvedValue({
          keyringAccounts: {
            [MOCK_SOLANA_KEYRING_ACCOUNT_0.id]: {
              ...MOCK_SOLANA_KEYRING_ACCOUNT_0,
              scopes: [],
            },
          },
        }),
      };

      (globalThis as any).snap = snap;

      await expect(
        keyring.submitRequest({
          account: MOCK_SOLANA_KEYRING_ACCOUNT_0.id,
          id: crypto.randomUUID(),
          request: {
            method: SolMethod.SignAndSendTransaction,
            params: {
              account: {
                address: MOCK_SOLANA_KEYRING_ACCOUNT_0.address,
              },
              transaction: 'SGVsbG8sIHdvcmxkIQ==', // "Hello, world!" in base64
              scope: Network.Devnet,
            },
          },
          scope: Network.Devnet,
        }),
      ).rejects.toThrow(
        `Scope "${Network.Devnet}" is not allowed for this account`,
      );
    });

    it('throws an error if the scope does not match the request', async () => {
      await expect(
        keyring.submitRequest({
          account: MOCK_SOLANA_KEYRING_ACCOUNT_0.id,
          id: crypto.randomUUID(),
          request: {
            method: SolMethod.SignAndSendTransaction,
            params: {
              account: {
                address: MOCK_SOLANA_KEYRING_ACCOUNT_0.address,
              },
              transaction: 'SGVsbG8sIHdvcmxkIQ==', // "Hello, world!" in base64
              scope: Network.Devnet,
            },
          },
          scope: Network.Mainnet,
        }),
      ).rejects.toThrow(
        `Scope "${Network.Mainnet}" does not match "${Network.Devnet}" in request.params`,
      );
    });

    it('calls the confirmation handler, and calls the wallet service if confirmed', async () => {
      const snap = {
        request: jest.fn().mockResolvedValue({
          keyringAccounts: {
            [MOCK_SOLANA_KEYRING_ACCOUNT_0.id]: MOCK_SOLANA_KEYRING_ACCOUNT_0,
          },
        }),
      };

      (globalThis as any).snap = snap;

      jest
        .spyOn(mockConfirmationHandler, 'handleKeyringRequest')
        .mockResolvedValue(true);

      const request: KeyringRequest = {
        account: MOCK_SOLANA_KEYRING_ACCOUNT_0.id,
        id: crypto.randomUUID(),
        request: {
          method: SolMethod.SignMessage,
          params: {
            account: {
              address: MOCK_SOLANA_KEYRING_ACCOUNT_0.address,
            },
            message: 'SGVsbG8sIHdvcmxkIQ==', // "Hello, world!" in base64
          },
        },
        scope: Network.Testnet,
      };

      await keyring.submitRequest(request);

      expect(mockConfirmationHandler.handleKeyringRequest).toHaveBeenCalledWith(
        request,
        MOCK_SOLANA_KEYRING_ACCOUNT_0,
      );

      expect(mockWalletService.signMessage).toHaveBeenCalledWith(
        MOCK_SOLANA_KEYRING_ACCOUNT_0,
        request,
      );
    });

    it('returns null if the confirmation handler returns false', async () => {
      jest
        .spyOn(mockConfirmationHandler, 'handleKeyringRequest')
        .mockResolvedValue(false);

      const request: KeyringRequest = {
        account: MOCK_SOLANA_KEYRING_ACCOUNT_0.id,
        id: crypto.randomUUID(),
        request: {
          method: SolMethod.SignMessage,
          params: {
            account: {
              address: MOCK_SOLANA_KEYRING_ACCOUNT_0.address,
            },
            message: 'SGVsbG8sIHdvcmxkIQ==', // "Hello, world!" in base64
          },
        },
        scope: Network.Testnet,
      };

      const result = await keyring.submitRequest(request);

      expect(result).toStrictEqual({ pending: false, result: null });
    });
  });
});
