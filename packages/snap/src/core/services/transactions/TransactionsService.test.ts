import { KeyringEvent } from '@metamask/keyring-api';
import { emitSnapKeyringEvent } from '@metamask/keyring-snap-sdk';
import { address as asAddress } from '@solana/kit';

import { Network } from '../../constants/solana';
import {
  MOCK_SOLANA_KEYRING_ACCOUNT_0,
  MOCK_SOLANA_KEYRING_ACCOUNT_1,
} from '../../test/mocks/solana-keyring-accounts';
import type { MockSolanaRpc } from '../../test/mocks/startMockSolanaRpc';
import { startMockSolanaRpc } from '../../test/mocks/startMockSolanaRpc';
import { MOCK_GET_SIGNATURES_FOR_ADDRESS } from '../../test/mocks/transactions';
import { ADDRESS_1_TRANSACTION_1_DATA } from '../../test/mocks/transactions-data/address-1/transaction-1';
import { ADDRESS_1_TRANSACTION_2_DATA } from '../../test/mocks/transactions-data/address-1/transaction-2';
import { ADDRESS_1_TRANSACTION_3_DATA } from '../../test/mocks/transactions-data/address-1/transaction-3';
import { ADDRESS_1_TRANSACTION_4_DATA } from '../../test/mocks/transactions-data/address-1/transaction-4';
import { ADDRESS_2_TRANSACTION_1_DATA } from '../../test/mocks/transactions-data/address-2/transaction-1';
import { ADDRESS_2_TRANSACTION_2_DATA } from '../../test/mocks/transactions-data/address-2/transaction-2';
import { ADDRESS_2_TRANSACTION_3_DATA } from '../../test/mocks/transactions-data/address-2/transaction-3';
import { ADDRESS_2_TRANSACTION_4_DATA } from '../../test/mocks/transactions-data/address-2/transaction-4';
import { ConfigProvider } from '../config';
import { SolanaConnection } from '../connection/SolanaConnection';
import { mockLogger } from '../mocks/logger';
import { InMemoryState } from '../state/InMemoryState';
import type { IStateManager } from '../state/IStateManager';
import {
  DEFAULT_UNENCRYPTED_STATE,
  type UnencryptedStateValue,
} from '../state/State';
import type { TokenMetadataService } from '../token-metadata/TokenMetadata';
import { TransactionsService } from './TransactionsService';

jest.mock('@metamask/keyring-snap-sdk', () => ({
  emitSnapKeyringEvent: jest.fn(),
}));

describe('TransactionsService', () => {
  let mockSolanaRpc: MockSolanaRpc;
  let mockState: IStateManager<UnencryptedStateValue>;
  let mockConfigProvider: ConfigProvider;
  let mockTokenMetadataService: TokenMetadataService;
  let service: TransactionsService;

  beforeAll(() => {
    mockSolanaRpc = startMockSolanaRpc();
  });

  afterAll(() => {
    mockSolanaRpc.shutdown();
  });

  beforeEach(() => {
    mockConfigProvider = new ConfigProvider();
    const connection = new SolanaConnection(mockConfigProvider);

    mockTokenMetadataService = {
      getTokensMetadata: jest.fn(),
    } as unknown as TokenMetadataService;

    mockState = new InMemoryState(DEFAULT_UNENCRYPTED_STATE);

    service = new TransactionsService({
      connection,
      logger: mockLogger,
      tokenMetadataService: mockTokenMetadataService,
      state: mockState,
      configProvider: mockConfigProvider,
    });

    const snap = {
      request: jest.fn(),
    };
    (globalThis as any).snap = snap;
  });

  describe('fetchLatestSignatures', () => {
    it('should fetch and return signatures for the given address', async () => {
      const { mockResolvedResultOnce } = mockSolanaRpc;

      mockResolvedResultOnce({
        method: 'getSignaturesForAddress',
        result: MOCK_GET_SIGNATURES_FOR_ADDRESS,
      });

      const result = await service.fetchLatestSignatures(
        Network.Localnet,
        asAddress('BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP'),
        10,
      );

      expect(result).toStrictEqual([
        '3B7H4E2ih3Tcas6um1izEBZagVfLoxSUfZSKkSNSu7mh4nAy7ZafaEgKhH4d1NBY2MMRWgyPX2LcMbKYwphR8dRq',
        '3Zj5XkvE1Uec1frjue6SK2ND2cqhKPvPkZ1ZFPwo2v9iL4NX4b4WWG1wPNEQdnJJU8sVx7MMHjSH1HxoR21vEjoV',
        '2qfNzGs15dt999rt1AUJ7D1oPQaukMPPmHR2u5ZmDo4cVtr1Pr2Dax4Jo7ryTpM8jxjtXLi5NHy4uyr68MVh5my6',
        '54Lz5p2zQNU6ngvyGtpeMYEdGoHG2D7ByPS2n3Wa4QNHzqTZ46sUemk1PxSrM6UieQ2i15XiRrTuxZyiPkg8V1vW',
        '2a5UXcyb6Gz8DH5MdumBvoGQiHLjTKfPcKrAGcsPrVSUjM9NRVUB1TuL1sNEj59nKBzfLm3Z2RvtsnCGZHa7KXPB',
        'yftYXx1xSmLiMeJ2mGkpZd7Xd13mtW7juWcRnihMhDz1zAeCrq5rPrw7WoCkhEcfUL7MwYCti9Q8bWRdJKZuris',
        '24pkWA6oUqtKs1nqx4ZFqW3DoeNcVHC57s1azr63EzaXsDNJAkejmyjB7QonVqvm3cC8cVtbN11jSWTu1xUurQZ9',
        '27kCW7f9RCWDkQSqSDrwvbJ3d8mgaFmLLu7GsVujJnp55ue8mQNHvphoVEEF32mXUWZSagdXNraZ7zszBENgAY7T',
        '5XpBS9D4bBhc4F69SJd3th19Xe8qhqPyJ3MKWhRLF3tbeHTbSLZSM9UUztJc7pLTASUd2jNR67y2W3Q6LogUnai7',
        '5iFQpCwAgiXebzuKxLfhePscR9EYRvRNRSx2Mbj12ed36zNkGmQMkg7ekFXjh88R3p75D6uNK45hgRxC6FyUDnhE',
      ]);
    });
  });

  describe('refreshTransactions', () => {
    beforeEach(() => {
      jest.spyOn(service, 'fetchLatestSignatures').mockResolvedValue([]);
      jest
        .spyOn(service, 'getTransactionsDataFromSignatures')
        .mockResolvedValue([]);
    });

    describe('when no accounts are passed', () => {
      it('skips the run', async () => {
        const setSpy = jest.spyOn(mockState, 'setKey');

        await service.refreshTransactions([]);

        expect(service.fetchLatestSignatures).not.toHaveBeenCalled();
        expect(setSpy).not.toHaveBeenCalled();
      });
    });

    describe('when there are transactions to be fetched', () => {
      it('fetches and stores new transactions for all accounts', async () => {
        const firstAccount = MOCK_SOLANA_KEYRING_ACCOUNT_0;
        const secondAccount = MOCK_SOLANA_KEYRING_ACCOUNT_1;

        const signature1 =
          ADDRESS_1_TRANSACTION_1_DATA.transaction.signatures[0];
        const signature2 =
          ADDRESS_1_TRANSACTION_2_DATA.transaction.signatures[0];
        const signature3 =
          ADDRESS_1_TRANSACTION_3_DATA.transaction.signatures[0];
        const signature4 =
          ADDRESS_1_TRANSACTION_4_DATA.transaction.signatures[0];
        const signature5 =
          ADDRESS_2_TRANSACTION_1_DATA.transaction.signatures[0];
        const signature6 =
          ADDRESS_2_TRANSACTION_2_DATA.transaction.signatures[0];
        const signature7 =
          ADDRESS_2_TRANSACTION_3_DATA.transaction.signatures[0];
        const signature8 =
          ADDRESS_2_TRANSACTION_4_DATA.transaction.signatures[0];

        // Store signatures by account and network for clearer test structure
        const MOCKED_NEW_SIGNATURES: any = {
          [Network.Mainnet]: {
            [firstAccount.address]: [signature1, signature2],
            [secondAccount.address]: [signature5, signature6],
          },
          [Network.Devnet]: {
            [firstAccount.address]: [signature3, signature4],
            [secondAccount.address]: [signature7, signature8],
          },
        };

        const MOCKED_TRANSACTIONS: any = {
          [Network.Mainnet]: [
            ADDRESS_1_TRANSACTION_1_DATA,
            ADDRESS_1_TRANSACTION_2_DATA,
            ADDRESS_2_TRANSACTION_1_DATA,
            ADDRESS_2_TRANSACTION_2_DATA,
          ],
          [Network.Devnet]: [
            ADDRESS_1_TRANSACTION_3_DATA,
            ADDRESS_1_TRANSACTION_4_DATA,
            ADDRESS_2_TRANSACTION_3_DATA,
            ADDRESS_2_TRANSACTION_4_DATA,
          ],
        };

        const initialState = {
          transactions: {
            [firstAccount.id]: [],
            [secondAccount.id]: [],
          },
        } as unknown as UnencryptedStateValue;

        await mockState.setKey('transactions', initialState.transactions);

        const mockAccounts = [firstAccount, secondAccount];

        jest.spyOn(mockConfigProvider, 'get').mockReturnValue({
          transactions: {
            storageLimit: 50,
          },
        } as any);

        jest
          .spyOn(mockTokenMetadataService, 'getTokensMetadata')
          .mockResolvedValue({});

        jest
          .spyOn(service, 'fetchLatestSignatures')
          .mockImplementation(async (scope: Network, address: string) => {
            const signatures = MOCKED_NEW_SIGNATURES[scope][address];
            return Promise.resolve(signatures);
          });

        jest
          .spyOn(service, 'getTransactionsDataFromSignatures')
          .mockImplementation(async ({ scope, signatures }) => {
            const mockedTransactionsInNetwork =
              MOCKED_TRANSACTIONS[scope as string];
            if (!mockedTransactionsInNetwork) {
              return [];
            }
            const filteredData = mockedTransactionsInNetwork.filter((tx: any) =>
              signatures.includes(tx.transaction.signatures[0]),
            );
            return Promise.resolve(filteredData);
          });

        await service.refreshTransactions(mockAccounts);

        const expectedSignatureCalls = [
          [Network.Mainnet, firstAccount.address, 50],
          [Network.Mainnet, secondAccount.address, 50],
          [Network.Devnet, firstAccount.address, 50],
          [Network.Devnet, secondAccount.address, 50],
        ];

        const actualSignatureCalls = (
          service.fetchLatestSignatures as jest.Mock
        ).mock.calls;

        expect(actualSignatureCalls).toHaveLength(
          expectedSignatureCalls.length,
        );
        expectedSignatureCalls.forEach((expectedCall) => {
          expect(actualSignatureCalls).toContainEqual(expectedCall);
        });

        const expectedDataCalls = [
          {
            scope: Network.Mainnet,
            signatures: [signature1, signature2, signature5, signature6],
          },
          {
            scope: Network.Devnet,
            signatures: [signature3, signature4, signature7, signature8],
          },
        ];

        const actualDataCalls = (
          service.getTransactionsDataFromSignatures as jest.Mock
        ).mock.calls.map(([arg]) => arg);

        expect(actualDataCalls).toHaveLength(expectedDataCalls.length);
        expectedDataCalls.forEach((expectedCall) => {
          expect(actualDataCalls).toContainEqual(
            expect.objectContaining(expectedCall),
          );
        });

        // Verify final state
        const finalState = await mockState.get();
        const firstAccountTxs = finalState.transactions[firstAccount.id] ?? [];
        const secondAccountTxs =
          finalState.transactions[secondAccount.id] ?? [];

        // Verify all transactions are present
        expect(firstAccountTxs).toHaveLength(4);
        expect(secondAccountTxs).toHaveLength(4);

        const expectedFirstAccountSignatures = [
          signature1,
          signature2,
          signature3,
          signature4,
        ];
        const expectedSecondAccountSignatures = [
          signature5,
          signature6,
          signature7,
          signature8,
        ];

        expectedFirstAccountSignatures.forEach((signature) => {
          expect(firstAccountTxs.map((tx: { id: string }) => tx.id)).toContain(
            signature,
          );
        });

        expectedSecondAccountSignatures.forEach((signature) => {
          expect(secondAccountTxs.map((tx: { id: string }) => tx.id)).toContain(
            signature,
          );
        });

        expect(emitSnapKeyringEvent).toHaveBeenCalledWith(
          expect.anything(),
          KeyringEvent.AccountTransactionsUpdated,
          {
            transactions: expect.objectContaining({
              [firstAccount.id]: expect.arrayContaining([
                expect.objectContaining({
                  id: signature1,
                }),
                expect.objectContaining({
                  id: signature2,
                }),
                expect.objectContaining({
                  id: signature3,
                }),
                expect.objectContaining({
                  id: signature4,
                }),
              ]),
              [secondAccount.id]: expect.arrayContaining([
                expect.objectContaining({
                  id: signature5,
                }),
                expect.objectContaining({
                  id: signature6,
                }),
                expect.objectContaining({
                  id: signature7,
                }),
                expect.objectContaining({
                  id: signature8,
                }),
              ]),
            }),
          },
        );
      });

      it('does not fetch and store transactions that are already saved', async () => {
        const firstAccount = MOCK_SOLANA_KEYRING_ACCOUNT_0;
        const secondAccount = MOCK_SOLANA_KEYRING_ACCOUNT_1;

        const signature1 =
          ADDRESS_1_TRANSACTION_1_DATA.transaction.signatures[0];
        const signature2 =
          ADDRESS_1_TRANSACTION_2_DATA.transaction.signatures[0];
        const signature3 =
          ADDRESS_1_TRANSACTION_3_DATA.transaction.signatures[0];
        const signature4 =
          ADDRESS_1_TRANSACTION_4_DATA.transaction.signatures[0];
        const signature5 =
          ADDRESS_2_TRANSACTION_1_DATA.transaction.signatures[0];
        const signature6 =
          ADDRESS_2_TRANSACTION_2_DATA.transaction.signatures[0];
        const signature7 =
          ADDRESS_2_TRANSACTION_3_DATA.transaction.signatures[0];
        const signature8 =
          ADDRESS_2_TRANSACTION_4_DATA.transaction.signatures[0];

        // Store signatures by account and network for clearer test structure
        const mockedSignatures: any = {
          [Network.Mainnet]: {
            [firstAccount.address]: [signature1, signature2],
            [secondAccount.address]: [signature5, signature6],
          },
          [Network.Devnet]: {
            [firstAccount.address]: [signature3, signature4],
            [secondAccount.address]: [signature7, signature8],
          },
        };

        const mockedTransactions: any = {
          [Network.Mainnet]: [
            ADDRESS_1_TRANSACTION_1_DATA,
            ADDRESS_1_TRANSACTION_2_DATA,
            ADDRESS_2_TRANSACTION_1_DATA,
            ADDRESS_2_TRANSACTION_2_DATA,
          ],
          [Network.Devnet]: [
            ADDRESS_1_TRANSACTION_3_DATA,
            ADDRESS_1_TRANSACTION_4_DATA,
            ADDRESS_2_TRANSACTION_3_DATA,
            ADDRESS_2_TRANSACTION_4_DATA,
          ],
        };

        // Initial state with some transactions already saved
        const initialState = {
          transactions: {
            [firstAccount.id]: [
              {
                id: signature1,
                account: firstAccount.address,
              },
              {
                id: signature2,
                account: firstAccount.address,
              },
            ],
            [secondAccount.id]: [
              {
                id: signature5,
                account: secondAccount.address,
              },
              {
                id: signature6,
                account: secondAccount.address,
              },
            ],
          },
        } as unknown as UnencryptedStateValue;

        await mockState.setKey('transactions', initialState.transactions);

        const mockAccounts = [firstAccount, secondAccount];

        jest.spyOn(mockConfigProvider, 'get').mockReturnValue({
          transactions: {
            storageLimit: 50,
          },
        } as any);

        jest
          .spyOn(mockTokenMetadataService, 'getTokensMetadata')
          .mockResolvedValue({});

        jest
          .spyOn(service, 'fetchLatestSignatures')
          .mockImplementation(async (scope: Network, address: string) => {
            const signatures = mockedSignatures[scope][address];
            return Promise.resolve(signatures);
          });

        jest
          .spyOn(service, 'getTransactionsDataFromSignatures')
          .mockImplementation(async ({ scope, signatures }) => {
            const mockedTransactionsInNetwork =
              mockedTransactions[scope as string];
            if (!mockedTransactionsInNetwork) {
              return [];
            }
            const filteredData = mockedTransactionsInNetwork.filter((tx: any) =>
              signatures.includes(tx.transaction.signatures[0]),
            );
            return Promise.resolve(filteredData);
          });

        const setKeySpy = jest.spyOn(mockState, 'setKey');

        await service.refreshTransactions(mockAccounts);

        expect(setKeySpy).toHaveBeenCalledTimes(1);

        const expectedSignatureCalls = [
          [Network.Mainnet, firstAccount.address, 50],
          [Network.Mainnet, secondAccount.address, 50],
          [Network.Devnet, firstAccount.address, 50],
          [Network.Devnet, secondAccount.address, 50],
        ];

        const actualSignatureCalls = (
          service.fetchLatestSignatures as jest.Mock
        ).mock.calls;

        expect(actualSignatureCalls).toHaveLength(
          expectedSignatureCalls.length,
        );
        expectedSignatureCalls.forEach((expectedCall) => {
          expect(actualSignatureCalls).toContainEqual(expectedCall);
        });

        // Verify only new transactions are fetched
        const expectedDataCalls = [
          {
            scope: Network.Devnet,
            signatures: [signature3, signature4, signature7, signature8],
          },
        ];

        const actualDataCalls = (
          service.getTransactionsDataFromSignatures as jest.Mock
        ).mock.calls.map(([arg]) => arg);

        expect(actualDataCalls).toHaveLength(expectedDataCalls.length);
        expectedDataCalls.forEach((expectedCall) => {
          expect(actualDataCalls).toContainEqual(
            expect.objectContaining(expectedCall),
          );
        });

        // Verify final state
        const finalState = await mockState.get();
        const firstAccountTxs = finalState.transactions[firstAccount.id] ?? [];
        const secondAccountTxs =
          finalState.transactions[secondAccount.id] ?? [];

        // Verify all transactions are present (both old and new)
        expect(firstAccountTxs).toHaveLength(4);
        expect(secondAccountTxs).toHaveLength(4);

        const expectedFirstAccountSignatures = [
          signature1,
          signature2,
          signature3,
          signature4,
        ];
        const expectedSecondAccountSignatures = [
          signature5,
          signature6,
          signature7,
          signature8,
        ];

        expectedFirstAccountSignatures.forEach((signature) => {
          expect(firstAccountTxs.map((tx: { id: string }) => tx.id)).toContain(
            signature,
          );
        });

        expectedSecondAccountSignatures.forEach((signature) => {
          expect(secondAccountTxs.map((tx: { id: string }) => tx.id)).toContain(
            signature,
          );
        });

        expect(emitSnapKeyringEvent).toHaveBeenCalledWith(
          expect.anything(),
          KeyringEvent.AccountTransactionsUpdated,
          {
            transactions: expect.objectContaining({
              [firstAccount.id]: expect.arrayContaining([
                expect.objectContaining({
                  id: signature3,
                }),
                expect.objectContaining({
                  id: signature4,
                }),
              ]),
              [secondAccount.id]: expect.arrayContaining([
                expect.objectContaining({
                  id: signature8,
                }),
              ]),
            }),
          },
        );
      });
    });
  });
});
