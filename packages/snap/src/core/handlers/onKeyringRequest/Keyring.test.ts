/* eslint-disable no-restricted-globals */
/* eslint-disable jest/prefer-strict-equal */
import type { KeyringRequest } from '@metamask/keyring-api';
import { AccountCreationType, SolMethod } from '@metamask/keyring-api';
import {
  InvalidParamsError,
  SnapError,
  type CaipAssetType,
  type JsonRpcRequest,
} from '@metamask/snaps-sdk';
import { bytesToHex } from '@metamask/utils';
import { signature } from '@solana/kit';
import bs58 from 'bs58';

import type { AssetEntity } from '../../../entities';
import { asStrictKeyringAccount } from '../../../entities';
import { KnownCaip19Id, Network } from '../../constants/solana';
import type {
  AssetsService,
  KeyringAccountMonitor,
  TransactionsService,
} from '../../services';
import type { ConfirmationHandler } from '../../services/confirmation/ConfirmationHandler';
import { InMemoryState } from '../../services/state/InMemoryState';
import type { IStateManager } from '../../services/state/IStateManager';
import {
  DEFAULT_UNENCRYPTED_STATE,
  type UnencryptedStateValue,
} from '../../services/state/State';
import { MOCK_SIGN_AND_SEND_TRANSACTION_REQUEST } from '../../services/wallet/mocks';
import type { WalletService } from '../../services/wallet/WalletService';
import {
  MOCK_ASSET_ENTITIES,
  MOCK_ASSET_ENTITY_0,
  MOCK_ASSET_ENTITY_1,
  MOCK_ASSET_ENTITY_2,
} from '../../test/mocks/asset-entities';
import {
  MOCK_SEED_PHRASE_2_ENTROPY_SOURCE,
  MOCK_SEED_PHRASE_ENTROPY_SOURCE,
  MOCK_SOLANA_KEYRING_ACCOUNT_0,
  MOCK_SOLANA_KEYRING_ACCOUNT_0_PRIVATE_KEY_BYTES,
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
import { trackError } from '../../utils/errors';
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

jest.mock('../../utils/errors', () => ({
  trackError: jest.fn().mockResolvedValue('tracked-error-id'),
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
  let mockKeyringAccountMonitor: KeyringAccountMonitor;

  beforeEach(() => {
    jest.clearAllMocks();

    // To simplify the mocking of individual tests, we initialize the state in happy path with all mock accounts
    mockState = new InMemoryState({
      ...DEFAULT_UNENCRYPTED_STATE,
      keyringAccounts: MOCK_SOLANA_KEYRING_ACCOUNTS.reduce(
        (acc, account) => ({
          ...acc,
          [account.id]: account,
        }),
        {},
      ),
    });

    mockAssetsService = {
      fetch: jest.fn().mockResolvedValue(MOCK_ASSET_ENTITIES),
      saveMany: jest.fn(),
      findByAccount: jest.fn(),
      getNativeAssetTypes: jest
        .fn()
        .mockReturnValue([KnownCaip19Id.SolMainnet]),
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

    mockKeyringAccountMonitor = {
      setMonitoredAccounts: jest.fn(),
    } as unknown as KeyringAccountMonitor;

    keyring = new SolanaKeyring({
      state: mockState,
      logger,
      transactionsService: mockTransactionsService,
      assetsService: mockAssetsService,
      walletService: mockWalletService,
      confirmationHandler: mockConfirmationHandler,
      keyringAccountMonitor: mockKeyringAccountMonitor,
    });
  });

  describe('listAccounts', () => {
    it('lists accounts from the state', async () => {
      const accounts = await keyring.listAccounts();
      expect(accounts).toHaveLength(MOCK_SOLANA_KEYRING_ACCOUNTS.length);
      expect(accounts).toContainEqual(
        asStrictKeyringAccount(MOCK_SOLANA_KEYRING_ACCOUNT_0),
      );
      expect(accounts).toContainEqual(
        asStrictKeyringAccount(MOCK_SOLANA_KEYRING_ACCOUNT_1),
      );
      expect(accounts).toContainEqual(
        asStrictKeyringAccount(MOCK_SOLANA_KEYRING_ACCOUNT_2),
      );
      expect(accounts).toContainEqual(
        asStrictKeyringAccount(MOCK_SOLANA_KEYRING_ACCOUNT_3),
      );
      expect(accounts).toContainEqual(
        asStrictKeyringAccount(MOCK_SOLANA_KEYRING_ACCOUNT_4),
      );
      expect(accounts).toContainEqual(
        asStrictKeyringAccount(MOCK_SOLANA_KEYRING_ACCOUNT_5),
      );
    });

    it('returns empty array if no accounts are found', async () => {
      jest.spyOn(mockState, 'getKey').mockResolvedValueOnce({});

      const accounts = await keyring.listAccounts();
      expect(accounts).toStrictEqual([]);
    });

    it('throws an error if state fails to be retrieved', async () => {
      jest
        .spyOn(mockState, 'getKey')
        .mockRejectedValueOnce(new Error('State error'));

      await expect(keyring.listAccounts()).rejects.toThrow(
        'Error listing accounts',
      );
    });
  });

  describe('getAccountAssets', () => {
    it('calls the assets service', async () => {
      jest
        .spyOn(mockAssetsService, 'findByAccount')
        .mockResolvedValue(MOCK_ASSET_ENTITIES);

      const result = await keyring.getAccountAssets(
        MOCK_SOLANA_KEYRING_ACCOUNT_0.id,
      );

      expect(result).toStrictEqual([
        MOCK_ASSET_ENTITY_0.assetType,
        MOCK_ASSET_ENTITY_1.assetType,
        MOCK_ASSET_ENTITY_2.assetType,
      ]);
    });

    it('removes token assets with zero balance', async () => {
      jest.spyOn(mockAssetsService, 'findByAccount').mockResolvedValue([
        MOCK_ASSET_ENTITY_1, // Token asset with non-zero balance
        { ...MOCK_ASSET_ENTITY_2, rawAmount: '0' }, // Token asset with zero balance
      ]);

      const result = await keyring.getAccountAssets(
        MOCK_SOLANA_KEYRING_ACCOUNT_0.id,
      );

      expect(result).toStrictEqual([MOCK_ASSET_ENTITY_1.assetType]);
    });

    it('keeps the native asset even if it has zero balance', async () => {
      jest.spyOn(mockAssetsService, 'findByAccount').mockResolvedValue([
        { ...MOCK_ASSET_ENTITY_0, rawAmount: '0' }, // Native asset with zero balance
        { ...MOCK_ASSET_ENTITY_1, rawAmount: '0' }, // Token asset with zero balance
      ]);

      const result = await keyring.getAccountAssets(
        MOCK_SOLANA_KEYRING_ACCOUNT_0.id,
      );

      expect(result).toStrictEqual([MOCK_ASSET_ENTITY_0.assetType]);
    });

    it('throws and error if the account provided is not a uuid', async () => {
      await expect(keyring.getAccountAssets('non-existent-id')).rejects.toThrow(
        /Expected a string matching/u,
      );
    });

    it('throws an error if account is not found', async () => {
      await expect(
        keyring.getAccountAssets(NON_EXISTENT_ACCOUNT_ID),
      ).rejects.toThrow(`Account "${NON_EXISTENT_ACCOUNT_ID}" not found`);
    });
  });

  describe('getAccount', () => {
    it('gets account by id', async () => {
      const account = await keyring.getAccount(
        MOCK_SOLANA_KEYRING_ACCOUNT_1.id,
      );
      expect(account).toStrictEqual(
        asStrictKeyringAccount(MOCK_SOLANA_KEYRING_ACCOUNT_1),
      );
    });

    it('throws and error if the account provided is not a uuid', async () => {
      await expect(keyring.getAccount('non-existent-id')).rejects.toThrow(
        /Expected a string matching/u,
      );
    });

    it('throws if account is not found', async () => {
      await expect(keyring.getAccount(NON_EXISTENT_ACCOUNT_ID)).rejects.toThrow(
        `Account "${NON_EXISTENT_ACCOUNT_ID}" not found`,
      );
    });

    it('throws an error if state fails to be retrieved', async () => {
      jest
        .spyOn(mockState, 'getKey')
        .mockRejectedValueOnce(new Error('State error'));

      await expect(
        keyring.getAccount(MOCK_SOLANA_KEYRING_ACCOUNT_1.id),
      ).rejects.toThrow('State error');
    });

    it('wraps state errors in a single SnapError (no double-wrap)', async () => {
      jest
        .spyOn(mockState, 'getKey')
        .mockRejectedValueOnce(new Error('State error'));
      // SnapError's constructor copies the wrapped error's message verbatim,
      // so a single SnapError and a SnapError-of-SnapError look identical at
      // the message level. We instead detect double-wrapping via the log
      // pattern: each wrap site logs 'Error getting account'.
      const errorLogSpy = jest.spyOn(logger, 'error');

      const caught = await keyring
        .getAccount(MOCK_SOLANA_KEYRING_ACCOUNT_1.id)
        .catch((error: unknown) => error);

      expect(caught).toBeInstanceOf(SnapError);
      // The prefixed logger calls the underlying logger as
      // (prefix, errorContext, message), so the human-readable message
      // sits at index 2.
      const errorLogCalls = errorLogSpy.mock.calls.filter(
        (call) => call[2] === 'Error getting account',
      );
      expect(errorLogCalls).toHaveLength(1);
    });
  });

  describe('getAccounts', () => {
    it('returns all accounts from the state', async () => {
      const accounts = await keyring.getAccounts();
      expect(accounts).toHaveLength(MOCK_SOLANA_KEYRING_ACCOUNTS.length);
      expect(accounts).toContainEqual(
        asStrictKeyringAccount(MOCK_SOLANA_KEYRING_ACCOUNT_0),
      );
      expect(accounts).toContainEqual(
        asStrictKeyringAccount(MOCK_SOLANA_KEYRING_ACCOUNT_1),
      );
    });

    it('returns an empty array if no accounts are found', async () => {
      jest.spyOn(mockState, 'getKey').mockResolvedValueOnce({});

      const accounts = await keyring.getAccounts();
      expect(accounts).toStrictEqual([]);
    });

    it('throws a SnapError if state fails to be retrieved', async () => {
      jest
        .spyOn(mockState, 'getKey')
        .mockRejectedValueOnce(new Error('State error'));

      const caught = await keyring
        .getAccounts()
        .catch((error: unknown) => error);

      expect(caught).toBeInstanceOf(SnapError);
      expect((caught as SnapError).message).toBe('Error listing accounts');
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
    beforeEach(async () => {
      await mockState.update((state) => ({
        ...state,
        keyringAccounts: {},
      }));
    });

    describe('when no parameters are provided', () => {
      it('creates new accounts with increasing indices', async () => {
        const firstAccount = await keyring.createAccount();
        const secondAccount = await keyring.createAccount();
        const thirdAccount = await keyring.createAccount();

        const accountsById =
          (await mockState.getKey<UnencryptedStateValue['keyringAccounts']>(
            'keyringAccounts',
          )) ?? {};

        const accounts = Object.values(accountsById);
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

        await mockState.deleteKey(`keyringAccounts.${secondAccount.id}`);
        await mockState.deleteKey(`keyringAccounts.${fourthAccount.id}`);
        await mockState.deleteKey(`keyringAccounts.${sixthAccount.id}`);

        const regeneratedSecondAccount = await keyring.createAccount();
        const regeneratedFourthAccount = await keyring.createAccount();
        const regeneratedSixthAccount = await keyring.createAccount({
          entropySource: MOCK_SEED_PHRASE_2_ENTROPY_SOURCE,
        });

        const accountsById =
          (await mockState.getKey<UnencryptedStateValue['keyringAccounts']>(
            'keyringAccounts',
          )) ?? {};

        const accounts = Object.values(accountsById);
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
          await mockState.getKey(`keyringAccounts[${account.id}]`),
        ).toBeDefined();
        expect(
          await mockState.getKey(`keyringAccounts[${account.id}]`),
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
          await mockState.getKey(`keyringAccounts[${account.id}]`),
        ).toBeDefined();
        expect(
          await mockState.getKey(`keyringAccounts[${account.id}]`),
        ).toStrictEqual(expectedStateAccount);
      });

      it('skips creation if the account already exists', async () => {
        const existingAccount = MOCK_SOLANA_KEYRING_ACCOUNT_1;
        jest.spyOn(mockState, 'getKey').mockResolvedValueOnce({
          [existingAccount.id]: existingAccount,
        });
        const stateUpdateSpy = jest.spyOn(mockState, 'update');

        const account = await keyring.createAccount({
          derivationPath: existingAccount.derivationPath,
        });

        expect(account).toEqual(asStrictKeyringAccount(existingAccount));
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
          await mockState.getKey(`keyringAccounts[${account.id}]`),
        ).toBeDefined();
        expect(
          await mockState.getKey(`keyringAccounts[${account.id}]`),
        ).toStrictEqual(expectedStateAccount);
      });

      it('skips creation if the account already exists', async () => {
        const existingAccount = MOCK_SOLANA_KEYRING_ACCOUNT_1;
        jest.spyOn(mockState, 'getKey').mockResolvedValueOnce({
          [existingAccount.id]: existingAccount,
        });
        const stateUpdateSpy = jest.spyOn(mockState, 'update');
        const account = await keyring.createAccount({
          entropySource: existingAccount.entropySource,
          derivationPath: existingAccount.derivationPath,
        });

        expect(account).toEqual(asStrictKeyringAccount(existingAccount));
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
        .spyOn(mockState, 'getKey')
        .mockRejectedValueOnce(new Error('State error'));

      await expect(keyring.createAccount()).rejects.toThrow(
        'Error creating account: Error listing accounts',
      );
    });

    describe('state consistency', () => {
      it('rolls back the account creation operation if the client fails to be informed', async () => {
        const emitEventSpy = jest.spyOn(keyring, 'emitEvent');
        const mockErrorMessage =
          'Could not digest event KeyringEvent.AccountCreated';
        emitEventSpy.mockRejectedValueOnce(new Error(mockErrorMessage));
        const stateDeleteKeySpy = jest.spyOn(mockState, 'deleteKey');

        await expect(keyring.createAccount()).rejects.toThrow(
          `Error creating account: ${mockErrorMessage}`,
        );

        // We should remove the account from the snap's state to ensure state consistency between the snap and the client
        expect(stateDeleteKeySpy).toHaveBeenCalledTimes(3);
      });
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
      const invalidAsset = {
        ...MOCK_ASSET_ENTITY_0,
        symbol: 4,
      } as unknown as AssetEntity;

      jest
        .spyOn(mockAssetsService, 'findByAccount')
        .mockResolvedValue([invalidAsset]);

      await expect(
        keyring.getAccountBalances(MOCK_SOLANA_KEYRING_ACCOUNT_1.id, [
          KnownCaip19Id.SolMainnet,
        ]),
      ).rejects.toThrow('Invalid Response');
    });

    it('removes token assets with zero balance', async () => {
      jest.spyOn(mockAssetsService, 'findByAccount').mockResolvedValue([
        MOCK_ASSET_ENTITY_1, // Token asset with non-zero balance
        { ...MOCK_ASSET_ENTITY_2, rawAmount: '0' }, // Token asset with zero balance
      ]);

      const result = await keyring.getAccountBalances(
        MOCK_SOLANA_KEYRING_ACCOUNT_0.id,
        [MOCK_ASSET_ENTITY_1.assetType, MOCK_ASSET_ENTITY_2.assetType],
      );

      expect(result).toStrictEqual({
        [MOCK_ASSET_ENTITY_1.assetType]: {
          amount: MOCK_ASSET_ENTITY_1.uiAmount,
          unit: MOCK_ASSET_ENTITY_1.symbol,
        },
      });
    });

    it('keeps the native asset even if it has zero balance', async () => {
      jest.spyOn(mockAssetsService, 'findByAccount').mockResolvedValue([
        { ...MOCK_ASSET_ENTITY_0, rawAmount: '0' }, // Native asset with zero balance
        { ...MOCK_ASSET_ENTITY_1, rawAmount: '0' }, // Token asset with zero balance
      ]);

      const result = await keyring.getAccountBalances(
        MOCK_SOLANA_KEYRING_ACCOUNT_0.id,
        [MOCK_ASSET_ENTITY_0.assetType, MOCK_ASSET_ENTITY_1.assetType],
      );

      expect(result).toStrictEqual({
        [MOCK_ASSET_ENTITY_0.assetType]: {
          amount: MOCK_ASSET_ENTITY_0.uiAmount,
          unit: MOCK_ASSET_ENTITY_0.symbol,
        },
      });
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
        id: 1,
        jsonrpc: '2.0',
        ...MOCK_SIGN_AND_SEND_TRANSACTION_REQUEST,
      } as unknown as JsonRpcRequest;
      const error = new Error('Something went wrong');

      jest
        .spyOn(mockWalletService, 'resolveAccountAddress')
        .mockRejectedValue(error);

      const result = await keyring.resolveAccountAddress(
        mockScope,
        mockRequest,
      );

      expect(result).toBeNull();
      expect(trackError).toHaveBeenCalledWith(error);
    });
  });

  describe('submitRequest', () => {
    it('throws an error if the account does not have the method', async () => {
      const mockAccount = {
        ...MOCK_SOLANA_KEYRING_ACCOUNT_0,
        methods: [],
        scopes: [Network.Localnet],
      };

      jest.spyOn(mockState, 'getKey').mockResolvedValueOnce(mockAccount);

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
          origin: 'https://metamask.io',
        }),
      ).rejects.toThrow(
        `Method "${SolMethod.SignAndSendTransaction}" is not allowed for this account`,
      );
    });

    it('throws an error if the account does not have the scope', async () => {
      const mockAccount = {
        ...MOCK_SOLANA_KEYRING_ACCOUNT_0,
        scopes: [],
      };

      jest.spyOn(mockState, 'getKey').mockResolvedValueOnce(mockAccount);

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
          origin: 'https://metamask.io',
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
          origin: 'https://metamask.io',
        }),
      ).rejects.toThrow(
        `Scope "${Network.Mainnet}" does not match "${Network.Devnet}" in request.params`,
      );
    });

    it('rejects when account address in request does not match signing account', async () => {
      const account = MOCK_SOLANA_KEYRING_ACCOUNT_0;
      const request = {
        account: account.id,
        id: crypto.randomUUID(),
        request: {
          method: SolMethod.SignMessage,
          params: {
            account: {
              address: MOCK_SOLANA_KEYRING_ACCOUNT_3.address,
            },
            message: 'SGVsbG8sIHdvcmxkIQ==', // "Hello, world!" in base64
          },
        },
        scope: Network.Mainnet,
        origin: 'https://metamask.io',
      };
      jest
        .spyOn(mockConfirmationHandler, 'handleKeyringRequest')
        .mockResolvedValue(true);

      await expect(keyring.submitRequest(request)).rejects.toThrow(
        'The requested account and/or method has not been authorized by the user.',
      );
    });

    it('calls the confirmation handler, and calls the wallet service if confirmed', async () => {
      jest
        .spyOn(mockState, 'getKey')
        .mockResolvedValueOnce(MOCK_SOLANA_KEYRING_ACCOUNT_0);

      jest
        .spyOn(mockConfirmationHandler, 'handleKeyringRequest')
        .mockResolvedValue(true);

      const message = 'SGVsbG8sIHdvcmxkIQ=='; // "Hello, world!" in base64

      const request: KeyringRequest = {
        account: MOCK_SOLANA_KEYRING_ACCOUNT_0.id,
        id: crypto.randomUUID(),
        request: {
          method: SolMethod.SignMessage,
          params: {
            account: {
              address: MOCK_SOLANA_KEYRING_ACCOUNT_0.address,
            },
            message,
          },
        },
        scope: Network.Devnet,
        origin: 'https://metamask.io',
      };

      await keyring.submitRequest(request);

      expect(mockConfirmationHandler.handleKeyringRequest).toHaveBeenCalledWith(
        request,
        MOCK_SOLANA_KEYRING_ACCOUNT_0,
      );

      expect(mockWalletService.signMessage).toHaveBeenCalledWith(
        MOCK_SOLANA_KEYRING_ACCOUNT_0,
        message,
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
        origin: 'https://metamask.io',
      };

      await expect(keyring.submitRequest(request)).rejects.toThrow(
        'User rejected the request.',
      );
    });
  });

  describe('createAccounts (bip44:discover)', () => {
    it('returns an empty array and creates nothing when there is no on-chain activity', async () => {
      mockTransactionsService.fetchLatestSignatures.mockResolvedValueOnce([]);

      const result = await keyring.createAccounts({
        type: AccountCreationType.Bip44Discover,
        entropySource: MOCK_SEED_PHRASE_ENTROPY_SOURCE,
        groupIndex: 10,
      });

      expect(result).toStrictEqual([]);
      // SUPPORTED_SCOPES currently declares a single scope (Mainnet).
      expect(
        mockTransactionsService.fetchLatestSignatures,
      ).toHaveBeenCalledTimes(1);
    });

    it('creates and returns the account when there is on-chain activity', async () => {
      mockTransactionsService.fetchLatestSignatures.mockResolvedValueOnce([
        signature(
          '2qfNzGs15dt999rt1AUJ7D1oPQaukMPPmHR2u5ZmDo4cVtr1Pr2Dax4Jo7ryTpM8jxjtXLi5NHy4uyr68MVh5my6',
        ),
      ]);

      const result = await keyring.createAccounts({
        type: AccountCreationType.Bip44Discover,
        entropySource: MOCK_SEED_PHRASE_ENTROPY_SOURCE,
        groupIndex: 10,
      });

      expect(result).toHaveLength(1);
    });

    it('throws an error if there is an error fetching transactions', async () => {
      mockTransactionsService.fetchLatestSignatures.mockRejectedValue(
        new Error('Network error'),
      );

      await expect(
        keyring.createAccounts({
          type: AccountCreationType.Bip44Discover,
          entropySource: MOCK_SEED_PHRASE_ENTROPY_SOURCE,
          groupIndex: 10,
        }),
      ).rejects.toThrow('Network error');
    });
  });

  describe('setSelectedAccounts', () => {
    it('sets the monitored accounts', async () => {
      const accountIds = MOCK_SOLANA_KEYRING_ACCOUNTS.map(
        (account) => account.id,
      );
      await keyring.setSelectedAccounts(accountIds);

      expect(
        mockKeyringAccountMonitor.setMonitoredAccounts,
      ).toHaveBeenCalledWith(accountIds);
    });

    it('rejects if an account id is not valid', async () => {
      await expect(
        keyring.setSelectedAccounts([
          MOCK_SOLANA_KEYRING_ACCOUNT_0.id,
          'not-a-uuid',
        ]),
      ).rejects.toThrow(InvalidParamsError);
    });

    it('rejects if an account id is not part of existing accounts', async () => {
      await expect(
        keyring.setSelectedAccounts([
          MOCK_SOLANA_KEYRING_ACCOUNT_0.id,
          NON_EXISTENT_ACCOUNT_ID,
        ]),
      ).rejects.toThrow(InvalidParamsError);

      expect(
        mockKeyringAccountMonitor.setMonitoredAccounts,
      ).not.toHaveBeenCalled();
    });
  });

  describe('exportAccount', () => {
    /**
     * Solana wallets accept the 64-byte secret key (seed[32] || publicKey[32]).
     * The publicKey is the base58-decoded account address.
     */
    const expectedSecretKey = new Uint8Array(64);
    expectedSecretKey.set(MOCK_SOLANA_KEYRING_ACCOUNT_0_PRIVATE_KEY_BYTES, 0);
    expectedSecretKey.set(
      bs58.decode(MOCK_SOLANA_KEYRING_ACCOUNT_0.address),
      32,
    );

    it('exports the account private key as base58', async () => {
      const result = await keyring.exportAccount(
        MOCK_SOLANA_KEYRING_ACCOUNT_0.id,
        { type: 'private-key', encoding: 'base58' },
      );

      expect(result).toStrictEqual({
        type: 'private-key',
        encoding: 'base58',
        privateKey: bs58.encode(expectedSecretKey),
      });
    });

    it('exports the account private key as hexadecimal', async () => {
      const result = await keyring.exportAccount(
        MOCK_SOLANA_KEYRING_ACCOUNT_0.id,
        { type: 'private-key', encoding: 'hexadecimal' },
      );

      expect(result).toStrictEqual({
        type: 'private-key',
        encoding: 'hexadecimal',
        privateKey: bytesToHex(expectedSecretKey),
      });
    });

    it('encodes the 64-byte secret key (seed || publicKey)', async () => {
      const result = await keyring.exportAccount(
        MOCK_SOLANA_KEYRING_ACCOUNT_0.id,
        { type: 'private-key', encoding: 'base58' },
      );

      const decoded = bs58.decode(result.privateKey);
      expect(decoded).toHaveLength(64);
      expect(decoded.slice(0, 32)).toStrictEqual(
        MOCK_SOLANA_KEYRING_ACCOUNT_0_PRIVATE_KEY_BYTES,
      );
      expect(decoded.slice(32)).toStrictEqual(
        bs58.decode(MOCK_SOLANA_KEYRING_ACCOUNT_0.address),
      );
    });

    it('throws if the account id is not a uuid', async () => {
      await expect(
        keyring.exportAccount('not-a-uuid', {
          type: 'private-key',
          encoding: 'base58',
        }),
      ).rejects.toThrow(/Expected a string matching/u);
    });

    it('throws if the account is not found', async () => {
      await expect(
        keyring.exportAccount(NON_EXISTENT_ACCOUNT_ID, {
          type: 'private-key',
          encoding: 'base58',
        }),
      ).rejects.toThrow(`Account "${NON_EXISTENT_ACCOUNT_ID}" not found`);
    });

    it('rejects an unsupported encoding', async () => {
      await expect(
        keyring.exportAccount(MOCK_SOLANA_KEYRING_ACCOUNT_0.id, {
          type: 'private-key',
          encoding: 'utf-8' as unknown as 'base58',
        }),
      ).rejects.toThrow(/Expected/u);
    });

    it('rejects an unsupported export type', async () => {
      await expect(
        keyring.exportAccount(MOCK_SOLANA_KEYRING_ACCOUNT_0.id, {
          type: 'mnemonic' as unknown as 'private-key',
          encoding: 'base58',
        }),
      ).rejects.toThrow(/Expected/u);
    });
  });
});
