/* eslint-disable no-restricted-globals */
/* eslint-disable jest/prefer-strict-equal */
import type { KeyringRequest } from '@metamask/keyring-api';
import { SolMethod } from '@metamask/keyring-api';
import type { CaipAssetType, JsonRpcRequest } from '@metamask/snaps-sdk';
import { signature } from '@solana/kit';
import { cloneDeep } from 'lodash';

import { KnownCaip19Id, Network } from '../../constants/solana';
import type { AssetsService } from '../../services/assets/AssetsService';
import type { ConfirmationHandler } from '../../services/confirmation/ConfirmationHandler';
import type { IStateManager } from '../../services/state/IStateManager';
import { InMemoryState } from '../../services/state/mocks/InMemoryState';
import type { UnencryptedStateValue } from '../../services/state/State';
import type { TransactionsService } from '../../services/transactions/TransactionsService';
import { MOCK_SIGN_AND_SEND_TRANSACTION_REQUEST } from '../../services/wallet/mocks';
import type { WalletService } from '../../services/wallet/WalletService';
import { SOLANA_MOCK_TOKEN } from '../../test/mocks/solana-assets';
import {
  MOCK_SEED_PHRASE_2_ENTROPY_SOURCE,
  MOCK_SEED_PHRASE_ENTROPY_SOURCE,
  MOCK_SOLANA_KEYRING_ACCOUNT_0,
  MOCK_SOLANA_KEYRING_ACCOUNT_1,
  MOCK_SOLANA_KEYRING_ACCOUNT_2,
  MOCK_SOLANA_KEYRING_ACCOUNT_3,
  MOCK_SOLANA_KEYRING_ACCOUNT_4,
  MOCK_SOLANA_KEYRING_ACCOUNT_5,
  MOCK_SOLANA_KEYRING_ACCOUNTS,
  MOCK_SOLANA_SEED_PHRASE_2_KEYRING_ACCOUNT_0,
  MOCK_SOLANA_SEED_PHRASE_2_KEYRING_ACCOUNT_1,
} from '../../test/mocks/solana-keyring-accounts';
import { getBip32EntropyMock } from '../../test/mocks/utils/getBip32Entropy';
import { getBip32Entropy } from '../../utils/getBip32Entropy';
import logger from '../../utils/logger';
import { SolanaKeyring } from './Keyring';

jest.mock('@metamask/keyring-snap-sdk', () => ({
  ...jest.requireActual('@metamask/keyring-snap-sdk'),
  emitSnapKeyringEvent: jest.fn().mockResolvedValue(null),
}));

jest.mock('../../utils/getBip32Entropy', () => ({
  getBip32Entropy: getBip32EntropyMock,
}));

const NON_EXISTENT_ACCOUNT_ID = '123e4567-e89b-12d3-a456-426614174009';

(globalThis as any).snap = {
  request: jest.fn().mockImplementation(async ({ method }) => {
    if (method === 'snap_listEntropySources') {
      return Promise.resolve([
        { id: MOCK_SEED_PHRASE_ENTROPY_SOURCE, primary: true },
        { id: MOCK_SEED_PHRASE_2_ENTROPY_SOURCE, primary: false },
      ]);
    }

    return Promise.resolve({});
  }),
};

describe('SolanaKeyring', () => {
  let keyring: SolanaKeyring;
  let mockState: IStateManager<UnencryptedStateValue>;
  let mockWalletService: WalletService;
  let mockAssetsService: AssetsService;
  let mockConfirmationHandler: ConfirmationHandler;
  let mockTransactionsService: jest.Mocked<TransactionsService>;

  beforeEach(() => {
    jest.clearAllMocks();

    // To simplify the mocking of individual tests, we initialize the state in happy path with all mock accounts
    mockState = new InMemoryState({
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
    });

    mockAssetsService = {
      listAccountAssets: jest.fn(),
      getAccountBalances: jest.fn(),
    } as unknown as AssetsService;

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

    mockTransactionsService = {
      fetchLatestSignatures: jest.fn(),
    } as unknown as jest.Mocked<TransactionsService>;

    keyring = new SolanaKeyring({
      state: mockState,
      logger,
      transactionsService: mockTransactionsService,
      assetsService: mockAssetsService,
      walletService: mockWalletService,
      confirmationHandler: mockConfirmationHandler,
    });
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
      jest.spyOn(mockState, 'get').mockResolvedValueOnce({
        keyringAccounts: {},
        mapInterfaceNameToId: {},
        assets: {},
        transactions: {},
        metadata: {},
        tokenPrices: {},
      });

      const accounts = await keyring.listAccounts();
      expect(accounts).toStrictEqual([]);
    });

    it('throws an error if state fails to be retrieved', async () => {
      jest
        .spyOn(mockState, 'get')
        .mockRejectedValueOnce(new Error('State error'));

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
      jest
        .spyOn(mockState, 'get')
        .mockRejectedValueOnce(new Error('State error'));

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
    beforeEach(() => {
      mockState = new InMemoryState({
        keyringAccounts: {},
        mapInterfaceNameToId: {},
        assets: {},
        transactions: {},
        metadata: {},
        tokenPrices: {},
      });
      // Start with no accounts
      keyring = new SolanaKeyring({
        state: mockState,
        logger,
        transactionsService: mockTransactionsService,
        assetsService: mockAssetsService,
        walletService: mockWalletService,
        confirmationHandler: mockConfirmationHandler,
      });
    });

    describe('when no parameters are provided', () => {
      it('creates new accounts with increasing indices', async () => {
        const firstAccount = await keyring.createAccount();
        const secondAccount = await keyring.createAccount();
        const thirdAccount = await keyring.createAccount();

        const accounts = Object.values((await mockState.get()).keyringAccounts);
        expect(accounts).toHaveLength(3);

        const accountIndex0 = accounts.find((acc) => acc.index === 0);
        const accountIndex1 = accounts.find((acc) => acc.index === 1);
        const accountIndex2 = accounts.find((acc) => acc.index === 2);

        expect(accountIndex0).toStrictEqual({
          ...MOCK_SOLANA_KEYRING_ACCOUNT_0,
          id: firstAccount.id,
        });
        expect(accountIndex1).toStrictEqual({
          ...MOCK_SOLANA_KEYRING_ACCOUNT_1,
          id: secondAccount.id,
        });
        expect(accountIndex2).toStrictEqual({
          ...MOCK_SOLANA_KEYRING_ACCOUNT_2,
          id: thirdAccount.id,
        });
      });

      it('recreates accounts with missing indices, in order', async () => {
        const firstAccount = await keyring.createAccount();
        const secondAccount = await keyring.createAccount();
        const thirdAccount = await keyring.createAccount();
        const fourthAccount = await keyring.createAccount();
        const fifthAccount = await keyring.createAccount();

        const sixthAccount = await keyring.createAccount({
          entropySource: MOCK_SEED_PHRASE_2_ENTROPY_SOURCE,
        });
        const seventhAccount = await keyring.createAccount({
          entropySource: MOCK_SEED_PHRASE_2_ENTROPY_SOURCE,
        });

        await mockState.update((state) => {
          const updatedState = cloneDeep(state);
          delete updatedState.keyringAccounts[secondAccount.id];
          delete updatedState.keyringAccounts[fourthAccount.id];
          delete updatedState.keyringAccounts[sixthAccount.id];
          return updatedState;
        });

        const regeneratedSecondAccount = await keyring.createAccount();
        const regeneratedFourthAccount = await keyring.createAccount();
        const regeneratedSixthAccount = await keyring.createAccount({
          entropySource: MOCK_SEED_PHRASE_2_ENTROPY_SOURCE,
        });

        const accounts = Object.values((await mockState.get()).keyringAccounts);
        expect(accounts).toHaveLength(7);

        const accountIndex0 = accounts.find(
          (acc) =>
            acc.entropySource === MOCK_SEED_PHRASE_ENTROPY_SOURCE &&
            acc.index === 0,
        );
        const accountIndex1 = accounts.find(
          (acc) =>
            acc.entropySource === MOCK_SEED_PHRASE_ENTROPY_SOURCE &&
            acc.index === 1,
        );
        const accountIndex2 = accounts.find(
          (acc) =>
            acc.entropySource === MOCK_SEED_PHRASE_ENTROPY_SOURCE &&
            acc.index === 2,
        );
        const accountIndex3 = accounts.find(
          (acc) =>
            acc.entropySource === MOCK_SEED_PHRASE_ENTROPY_SOURCE &&
            acc.index === 3,
        );
        const accountIndex4 = accounts.find(
          (acc) =>
            acc.entropySource === MOCK_SEED_PHRASE_ENTROPY_SOURCE &&
            acc.index === 4,
        );
        const accountIndex5 = accounts.find(
          (acc) =>
            acc.entropySource === MOCK_SEED_PHRASE_2_ENTROPY_SOURCE &&
            acc.index === 0,
        );
        const accountIndex6 = accounts.find(
          (acc) =>
            acc.entropySource === MOCK_SEED_PHRASE_2_ENTROPY_SOURCE &&
            acc.index === 1,
        );

        /**
         * Accounts that were created before the deletion
         */
        expect(accountIndex0).toStrictEqual({
          ...MOCK_SOLANA_KEYRING_ACCOUNT_0,
          id: firstAccount.id,
        });
        expect(accountIndex2).toStrictEqual({
          ...MOCK_SOLANA_KEYRING_ACCOUNT_2,
          id: thirdAccount.id,
        });
        expect(accountIndex4).toStrictEqual({
          ...MOCK_SOLANA_KEYRING_ACCOUNT_4,
          id: fifthAccount.id,
        });
        expect(accountIndex6).toStrictEqual({
          ...MOCK_SOLANA_SEED_PHRASE_2_KEYRING_ACCOUNT_1,
          id: seventhAccount.id,
        });

        /**
         * Accounts that were recreated
         */
        expect(accountIndex1).toStrictEqual({
          ...MOCK_SOLANA_KEYRING_ACCOUNT_1,
          id: regeneratedSecondAccount.id,
        });
        expect(accountIndex3).toStrictEqual({
          ...MOCK_SOLANA_KEYRING_ACCOUNT_3,
          id: regeneratedFourthAccount.id,
        });
        expect(accountIndex5).toStrictEqual({
          ...MOCK_SOLANA_SEED_PHRASE_2_KEYRING_ACCOUNT_0,
          id: regeneratedSixthAccount.id,
        });
      });
    });

    describe('when an entropy source is provided', () => {
      it('uses it to create a new account', async () => {
        const entropySource = MOCK_SEED_PHRASE_2_ENTROPY_SOURCE;
        const account = await keyring.createAccount({ entropySource });

        const expectedAccount = {
          id: expect.any(String),
          type: MOCK_SOLANA_SEED_PHRASE_2_KEYRING_ACCOUNT_0.type,
          options: MOCK_SOLANA_SEED_PHRASE_2_KEYRING_ACCOUNT_0.options,
          address: MOCK_SOLANA_SEED_PHRASE_2_KEYRING_ACCOUNT_0.address,
          scopes: MOCK_SOLANA_SEED_PHRASE_2_KEYRING_ACCOUNT_0.scopes,
          methods: MOCK_SOLANA_SEED_PHRASE_2_KEYRING_ACCOUNT_0.methods,
        };

        const expectedStateAccount = {
          ...MOCK_SOLANA_SEED_PHRASE_2_KEYRING_ACCOUNT_0,
          id: expect.any(String),
        };

        expect(account).toBeDefined();
        expect(account).toStrictEqual(expectedAccount);

        expect(
          (await mockState.get()).keyringAccounts[account.id],
        ).toBeDefined();
        expect(
          (await mockState.get()).keyringAccounts[account.id],
        ).toStrictEqual(expectedStateAccount);
      });
    });

    describe('when a derivation path is provided', () => {
      it('uses it to create a new account', async () => {
        const derivationPath = `m/44'/501'/1'/0'`;
        const account = await keyring.createAccount({ derivationPath });

        const expectedAccount = {
          id: expect.any(String),
          type: MOCK_SOLANA_KEYRING_ACCOUNT_1.type,
          options: MOCK_SOLANA_KEYRING_ACCOUNT_1.options,
          address: MOCK_SOLANA_KEYRING_ACCOUNT_1.address,
          scopes: MOCK_SOLANA_KEYRING_ACCOUNT_1.scopes,
          methods: MOCK_SOLANA_KEYRING_ACCOUNT_1.methods,
        };

        const expectedStateAccount = {
          ...MOCK_SOLANA_KEYRING_ACCOUNT_1,
          id: expect.any(String),
        };

        expect(account).toBeDefined();
        expect(account).toEqual(expectedAccount);

        expect(
          (await mockState.get()).keyringAccounts[account.id],
        ).toBeDefined();
        expect(
          (await mockState.get()).keyringAccounts[account.id],
        ).toStrictEqual(expectedStateAccount);
      });

      it('skips creation if the account already exists', async () => {
        const existingAccount = MOCK_SOLANA_KEYRING_ACCOUNT_1;
        jest.spyOn(mockState, 'get').mockResolvedValueOnce({
          keyringAccounts: {
            [existingAccount.id]: existingAccount,
          },
          mapInterfaceNameToId: {},
          assets: {},
          transactions: {},
          metadata: {},
          tokenPrices: {},
        });
        const stateUpdateSpy = jest.spyOn(mockState, 'update');

        const account = await keyring.createAccount({
          derivationPath: existingAccount.derivationPath,
        });

        expect(account).toEqual(existingAccount);
        expect(stateUpdateSpy).not.toHaveBeenCalled();
      });
    });

    describe('when both an entropy source and derivation path are provided', () => {
      it('uses them to create a new account', async () => {
        const entropySource = MOCK_SEED_PHRASE_2_ENTROPY_SOURCE;
        const derivationPath = `m/44'/501'/1'/0'`; // Index 1
        const account = await keyring.createAccount({
          entropySource,
          derivationPath,
        });

        const expectedAccount = {
          id: expect.any(String),
          type: MOCK_SOLANA_SEED_PHRASE_2_KEYRING_ACCOUNT_1.type,
          options: MOCK_SOLANA_SEED_PHRASE_2_KEYRING_ACCOUNT_1.options,
          address: MOCK_SOLANA_SEED_PHRASE_2_KEYRING_ACCOUNT_1.address,
          scopes: MOCK_SOLANA_SEED_PHRASE_2_KEYRING_ACCOUNT_1.scopes,
          methods: MOCK_SOLANA_SEED_PHRASE_2_KEYRING_ACCOUNT_1.methods,
        };

        const expectedStateAccount = {
          ...MOCK_SOLANA_SEED_PHRASE_2_KEYRING_ACCOUNT_1,
          id: expect.any(String),
        };

        expect(account).toBeDefined();
        expect(account).toStrictEqual(expectedAccount);

        expect(
          (await mockState.get()).keyringAccounts[account.id],
        ).toBeDefined();
        expect(
          (await mockState.get()).keyringAccounts[account.id],
        ).toStrictEqual(expectedStateAccount);
      });

      it('skips creation if the account already exists', async () => {
        const existingAccount = MOCK_SOLANA_KEYRING_ACCOUNT_1;
        jest.spyOn(mockState, 'get').mockResolvedValueOnce({
          keyringAccounts: {
            [existingAccount.id]: existingAccount,
          },
          mapInterfaceNameToId: {},
          assets: {},
          transactions: {},
          metadata: {},
          tokenPrices: {},
        });
        const stateUpdateSpy = jest.spyOn(mockState, 'update');
        const account = await keyring.createAccount({
          entropySource: existingAccount.entropySource,
          derivationPath: existingAccount.derivationPath,
        });

        expect(account).toEqual(existingAccount);
        expect(stateUpdateSpy).not.toHaveBeenCalled();
      });
    });

    describe('when an account name suggestion is provided', () => {
      it('uses the name suggestion and tells the client not to display the suggestion dialog', async () => {
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
    });

    it('throws when deriving address fails', async () => {
      jest.mocked(getBip32Entropy).mockImplementationOnce(async () => {
        return Promise.reject(new Error('Error deriving address'));
      });

      await expect(keyring.createAccount()).rejects.toThrow(
        'Error creating account: Error: Error deriving address',
      );
    });

    it('throws an error if state fails to be retrieved', async () => {
      jest
        .spyOn(mockState, 'get')
        .mockRejectedValueOnce(new Error('State error'));

      await expect(keyring.createAccount()).rejects.toThrow(
        'Error creating account: Error listing accounts',
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

    it('throws an error if state fails to be updated', async () => {
      jest
        .spyOn(mockState, 'update')
        .mockRejectedValueOnce(new Error('State error'));

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
      ).rejects.toThrow(
        'At path: assets.1 -- Expected a value of type `CaipAssetType`, but received: `"Bob"`',
      );
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
      const mockScope = Network.Localnet;
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
      const mockScope = Network.Localnet;
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
      jest.spyOn(mockState, 'get').mockResolvedValueOnce({
        keyringAccounts: {
          [MOCK_SOLANA_KEYRING_ACCOUNT_0.id]: {
            ...MOCK_SOLANA_KEYRING_ACCOUNT_0,
            methods: [],
            scopes: [Network.Localnet],
          },
        },
        mapInterfaceNameToId: {},
        assets: {},
        transactions: {},
        metadata: {},
        tokenPrices: {},
      });

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
      jest.spyOn(mockState, 'get').mockResolvedValueOnce({
        keyringAccounts: {
          [MOCK_SOLANA_KEYRING_ACCOUNT_0.id]: {
            ...MOCK_SOLANA_KEYRING_ACCOUNT_0,
            scopes: [],
          },
        },
        mapInterfaceNameToId: {},
        assets: {},
        transactions: {},
        metadata: {},
        tokenPrices: {},
      });

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
      jest.spyOn(mockState, 'get').mockResolvedValueOnce({
        keyringAccounts: {
          [MOCK_SOLANA_KEYRING_ACCOUNT_0.id]: MOCK_SOLANA_KEYRING_ACCOUNT_0,
        },
        mapInterfaceNameToId: {},
        assets: {},
        transactions: {},
        metadata: {},
        tokenPrices: {},
      });

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
        scope: Network.Devnet,
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

    it('throws a UserRejectedRequestError if the confirmation handler returns false', async () => {
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
        scope: Network.Devnet,
      };

      await expect(keyring.submitRequest(request)).rejects.toThrow(
        'User rejected the request.',
      );
    });
  });

  describe('discoverAccounts', () => {
    it('returns an empty array if there is no activity on any of the scopes', async () => {
      mockTransactionsService.fetchLatestSignatures
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const result = await keyring.discoverAccounts(
        [Network.Mainnet, Network.Devnet],
        'test',
        0,
      );

      expect(result).toStrictEqual([]);
    });

    it('returns the discovered accounts when there is activity in any of the scopes', async () => {
      mockTransactionsService.fetchLatestSignatures
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          signature(
            '2qfNzGs15dt999rt1AUJ7D1oPQaukMPPmHR2u5ZmDo4cVtr1Pr2Dax4Jo7ryTpM8jxjtXLi5NHy4uyr68MVh5my6',
          ),
        ]);

      const result = await keyring.discoverAccounts(
        [Network.Mainnet, Network.Devnet],
        'test',
        3,
      );

      expect(result).toStrictEqual([
        {
          type: 'bip44',
          scopes: [Network.Mainnet, Network.Devnet],
          derivationPath: `m/44'/501'/3'/0'`,
        },
      ]);
    });

    it('throws an error if there is an error fetching transactions', async () => {
      mockTransactionsService.fetchLatestSignatures.mockRejectedValue(
        new Error('Network error'),
      );

      await expect(
        keyring.discoverAccounts([Network.Mainnet], 'test', 0),
      ).rejects.toThrow('Network error');
    });

    it('throws an error if no scopes are provided', async () => {
      await expect(keyring.discoverAccounts([], 'test', 0)).rejects.toThrow(
        'At path: scopes -- Expected a nonempty array but received an empty one',
      );
      expect(
        mockTransactionsService.fetchLatestSignatures,
      ).not.toHaveBeenCalled();
    });
  });
});
