/* eslint-disable @typescript-eslint/naming-convention */
import type { CaipAssetType } from '@metamask/keyring-api';
import { getMockAccount, installSnap } from '@metamask/snaps-jest';

import type { SpotPrices } from '../../core/clients/price-api/types';
import {
  KnownCaip19Id,
  Network,
  SOL_SYMBOL,
} from '../../core/constants/solana';
import { RpcRequestMethod } from '../../core/handlers/onRpcRequest/types';
import {
  MOCK_SOLANA_RPC_GET_BALANCE_RESPONSE,
  MOCK_SOLANA_RPC_GET_FEE_FOR_MESSAGE_RESPONSE,
  MOCK_SOLANA_RPC_GET_LATEST_BLOCKHASH_RESPONSE,
  MOCK_SOLANA_RPC_GET_MULTIPLE_ACCOUNTS_RESPONSE,
  MOCK_SOLANA_RPC_GET_TOKEN_ACCOUNTS_BY_OWNER_RESPONSE,
  MOCK_SOLANA_RPC_SEND_TRANSACTION_RESPONSE,
  MOCK_SOLANA_RPC_SIMULATE_TRANSACTION_RESPONSE,
} from '../../core/services/mocks/mockSolanaRpcResponses';
import {
  MOCK_SEED_PHRASE,
  MOCK_SOLANA_KEYRING_ACCOUNT_0,
  MOCK_SOLANA_KEYRING_ACCOUNT_1,
} from '../../core/test/mocks/solana-keyring-accounts';
import type { MockSolanaRpc } from '../../core/test/mocks/startMockSolanaRpc';
import { startMockSolanaRpc } from '../../core/test/mocks/startMockSolanaRpc';
import { EXPECTED_NATIVE_SOL_TRANSFER_DATA } from '../../core/test/mocks/transactions-data/native-sol-transfer';
import { TEST_ORIGIN } from '../../core/test/utils';
import type { Preferences } from '../../core/types/snap';
import { DEFAULT_SEND_CONTEXT } from './render';
import { type SendContext, SendCurrencyType, SendFormNames } from './types';

const solanaKeyringAccounts = [
  MOCK_SOLANA_KEYRING_ACCOUNT_0,
  MOCK_SOLANA_KEYRING_ACCOUNT_1,
];

const solanaAccountBalances: Record<string, { amount: string; unit: string }> =
  {
    [KnownCaip19Id.SolLocalnet]: {
      amount: '0.123456789',
      unit: SOL_SYMBOL,
    },
    'solana:123456789abcdef/token:address1': {
      amount: '0.123456789',
      unit: '',
    },
    'solana:123456789abcdef/token:address2': {
      amount: '0.123456789',
      unit: '',
    },
  };

const mockSpotPrices: SpotPrices = {
  [KnownCaip19Id.SolLocalnet]: {
    id: 'solana',
    price: 200,
    marketCap: 60217502031.67665,
    allTimeHigh: 271.90599356377726,
    allTimeLow: 0.46425554356391946,
    totalVolume: 3389485617.517553,
    high1d: 120.28162239575909,
    low1d: 114.6267638476733,
    circulatingSupply: 512506275.4700137,
    dilutedMarketCap: 70208307228.42435,
    marketCapPercentChange1d: 1.82897,
    priceChange1d: 2.03,
    pricePercentChange1h: -0.7015657267954617,
    pricePercentChange1d: 1.6270441732346845,
    pricePercentChange7d: -10.985589910714582,
    pricePercentChange14d: 2.557473792001135,
    pricePercentChange30d: -11.519171371325216,
    pricePercentChange200d: -4.453777067234332,
    pricePercentChange1y: -35.331458644625535,
    bondingCurveProgressPercent: null,
    liquidity: null,
    totalSupply: null,
    holderCount: null,
    isMutable: null,
  },
  'solana:123456789abcdef/token:address1': {
    id: 'euro-coin',
    price: 200,
    marketCap: 142095635.08509836,
    allTimeHigh: 1.2514850885107882,
    allTimeLow: 0.04899146959823566,
    totalVolume: 25199808.258576106,
    high1d: 1.0048961747745884,
    low1d: 0.9993340188256516,
    circulatingSupply: 142084788.4864096,
    dilutedMarketCap: 142095635.08509836,
    marketCapPercentChange1d: 2.2575,
    priceChange1d: -0.002559725137667668,
    pricePercentChange1h: 0.03324277835545184,
    pricePercentChange1d: -0.23674527641785267,
    pricePercentChange7d: -0.2372037121786562,
    pricePercentChange14d: -1.230607529415818,
    pricePercentChange30d: 4.034620460890957,
    pricePercentChange200d: -2.4622235894139086,
    pricePercentChange1y: 0.2685816973195049,
    bondingCurveProgressPercent: null,
    liquidity: null,
    totalSupply: null,
    holderCount: null,
    isMutable: null,
  },
  'solana:123456789abcdef/token:address2': {
    id: 'usd-coin',
    price: 200,
    marketCap: 55688170578.59265,
    allTimeHigh: 1.084620410042683,
    allTimeLow: 0.8136015803527613,
    totalVolume: 8880279668.334307,
    high1d: 0.9270204293335238,
    low1d: 0.9267951620175918,
    circulatingSupply: 60073257677.05562,
    dilutedMarketCap: 55717659417.21691,
    marketCapPercentChange1d: 0.02765,
    priceChange1d: 0.00012002,
    pricePercentChange1h: 0.005951260480466856,
    pricePercentChange1d: 0.012003855299833856,
    pricePercentChange7d: 0.010535714950044883,
    pricePercentChange14d: 0.013896106834960937,
    pricePercentChange30d: 0.009428708838368462,
    pricePercentChange200d: -0.03983945503023834,
    pricePercentChange1y: 0.0011388468382004923,
    bondingCurveProgressPercent: null,
    liquidity: null,
    totalSupply: null,
    holderCount: null,
    isMutable: null,
  },
};

const mockContext: SendContext = {
  ...DEFAULT_SEND_CONTEXT,
  accounts: solanaKeyringAccounts,
  fromAccountId: MOCK_SOLANA_KEYRING_ACCOUNT_0.id,
  scope: Network.Localnet,
  currencyType: SendCurrencyType.TOKEN,
  tokenCaipId: KnownCaip19Id.SolLocalnet,
  assets: [
    KnownCaip19Id.SolLocalnet,
    'solana:123456789abcdef/token:address1',
    'solana:123456789abcdef/token:address2',
  ],
  balances: {
    [MOCK_SOLANA_KEYRING_ACCOUNT_0.id]: solanaAccountBalances,
    [MOCK_SOLANA_KEYRING_ACCOUNT_1.id]: solanaAccountBalances,
  },
  tokenPrices: mockSpotPrices,
  loading: false,
};

describe('Send', () => {
  let mockSolanaRpc: MockSolanaRpc;

  beforeAll(() => {
    mockSolanaRpc = startMockSolanaRpc();
  });

  afterAll(() => {
    mockSolanaRpc.shutdown();
  });

  it('renders the send form successfully', async () => {
    const { mockResolvedResult, server } = mockSolanaRpc;

    // temporary mock for the token prices
    // FIXME: when we have a better way to handle external requests
    server?.get(`/v3/spot-prices`, (_: any, res: any) => {
      return res.json(mockSpotPrices);
    });

    const initialState = {
      keyringAccounts: {
        [MOCK_SOLANA_KEYRING_ACCOUNT_0.id]: {
          ...MOCK_SOLANA_KEYRING_ACCOUNT_0,
          entropySource: 'default',
        },
        [MOCK_SOLANA_KEYRING_ACCOUNT_1.id]: {
          ...MOCK_SOLANA_KEYRING_ACCOUNT_1,
          entropySource: 'alternative',
        },
      },
      assets: {
        [MOCK_SOLANA_KEYRING_ACCOUNT_0.id]: solanaAccountBalances,
        [MOCK_SOLANA_KEYRING_ACCOUNT_1.id]: solanaAccountBalances,
      },
    };

    const mockPreferences: Preferences = {
      locale: 'en',
      currency: 'usd',
      hideBalances: false,
      useSecurityAlerts: true,
      useExternalPricingData: true,
      simulateOnChainActions: true,
      useTokenDetection: true,
      batchCheckBalances: true,
      displayNftMedia: true,
      useNftDetection: true,
    };

    const { request, mockJsonRpc } = await installSnap({
      options: {
        ...mockPreferences,
        secretRecoveryPhrase: MOCK_SEED_PHRASE,
        unencryptedState: initialState,
        accounts: [
          getMockAccount({
            address: MOCK_SOLANA_KEYRING_ACCOUNT_0.address,
            selected: true,
            assets: Object.keys(solanaAccountBalances) as CaipAssetType[],
            scopes: [Network.Localnet],
          }),
          getMockAccount({
            address: MOCK_SOLANA_KEYRING_ACCOUNT_1.address,
            selected: false,
            assets: Object.keys(solanaAccountBalances) as CaipAssetType[],
            scopes: [Network.Localnet],
          }),
        ],
        assets: {
          [KnownCaip19Id.SolLocalnet]: {
            symbol: 'SOL',
            name: 'Solana',
          },
          'solana:123456789abcdef/token:address1': {
            symbol: 'EURO-COIN',
            name: 'Euro Coin',
          },
          'solana:123456789abcdef/token:address2': {
            symbol: 'USDC',
            name: 'USDC',
          },
        },
      },
    });

    mockJsonRpc({
      method: 'snap_scheduleBackgroundEvent',
      result: {},
    });

    mockResolvedResult({
      method: 'getLatestBlockhash',
      result: MOCK_SOLANA_RPC_GET_LATEST_BLOCKHASH_RESPONSE.result,
    });

    mockResolvedResult({
      method: 'sendTransaction',
      result: MOCK_SOLANA_RPC_SEND_TRANSACTION_RESPONSE.result,
    });

    mockResolvedResult({
      method: 'getTokenAccountsByOwner',
      result: MOCK_SOLANA_RPC_GET_TOKEN_ACCOUNTS_BY_OWNER_RESPONSE.result,
    });

    mockResolvedResult({
      method: 'getFeeForMessage',
      result: MOCK_SOLANA_RPC_GET_FEE_FOR_MESSAGE_RESPONSE.result,
    });

    mockResolvedResult({
      method: 'getBalance',
      result: MOCK_SOLANA_RPC_GET_BALANCE_RESPONSE.result,
    });

    mockResolvedResult({
      method: 'simulateTransaction',
      result: MOCK_SOLANA_RPC_SIMULATE_TRANSACTION_RESPONSE.result,
    });

    mockResolvedResult({
      method: 'getMultipleAccounts',
      result: MOCK_SOLANA_RPC_GET_MULTIPLE_ACCOUNTS_RESPONSE.result,
    });

    mockResolvedResult({
      method: 'getTransaction',
      result: {
        transaction: EXPECTED_NATIVE_SOL_TRANSFER_DATA.transaction,
      } as any,
    });

    mockResolvedResult({
      method: 'getMinimumBalanceForRentExemption',
      result: 890880, // 890880 lamports = 0.00089088 SOL
    });

    const dialogPromise = request({
      origin: TEST_ORIGIN,
      method: RpcRequestMethod.StartSendTransactionFlow,
      params: {
        scope: Network.Localnet, // Routes the call to the mock RPC server running locally
        account: MOCK_SOLANA_KEYRING_ACCOUNT_1.id,
      },
    });

    await expect(dialogPromise).resolves.toBeDefined();
  });

  it('handles different send context states correctly', async () => {
    // Test initial context state
    const initialContext: SendContext = {
      ...mockContext,
      scope: Network.Localnet,
      fromAccountId: MOCK_SOLANA_KEYRING_ACCOUNT_0.id,
      tokenCaipId: KnownCaip19Id.SolLocalnet,
      stage: 'send-form',
      loading: false,
    };

    expect(initialContext.scope).toBe(Network.Localnet);
    expect(initialContext.fromAccountId).toBe(MOCK_SOLANA_KEYRING_ACCOUNT_0.id);
    expect(initialContext.stage).toBe('send-form');
    expect(initialContext.loading).toBe(false);
    expect(initialContext.amount).toBe('');
    expect(initialContext.destinationAddressOrDomain).toBeNull();
    expect(initialContext.toAddress).toBeNull();

    // Test context with destination address
    const contextWithDestination: SendContext = {
      ...initialContext,
      destinationAddressOrDomain: MOCK_SOLANA_KEYRING_ACCOUNT_1.address,
      toAddress: MOCK_SOLANA_KEYRING_ACCOUNT_1.address,
    };

    expect(contextWithDestination.destinationAddressOrDomain).toBe(
      MOCK_SOLANA_KEYRING_ACCOUNT_1.address,
    );
    expect(contextWithDestination.toAddress).toBe(
      MOCK_SOLANA_KEYRING_ACCOUNT_1.address,
    );

    // Test context with amount
    const contextWithAmount: SendContext = {
      ...contextWithDestination,
      amount: '0.001',
      transactionMessage: 'some-base64-encoded-message',
    };

    expect(contextWithAmount.amount).toBe('0.001');
    expect(contextWithAmount.transactionMessage).toBe(
      'some-base64-encoded-message',
    );

    // Test context with validation errors
    const contextWithValidation: SendContext = {
      ...contextWithAmount,
      validation: {
        [SendFormNames.DestinationAccountInput]: {
          message: 'Invalid address format',
          value: 'invalid-address',
        },
        [SendFormNames.AmountInput]: {
          message: 'Insufficient balance',
          value: '1000',
        },
      },
    };

    expect(
      contextWithValidation.validation[SendFormNames.DestinationAccountInput]
        ?.message,
    ).toBe('Invalid address format');
    expect(
      contextWithValidation.validation[SendFormNames.AmountInput]?.message,
    ).toBe('Insufficient balance');

    // Test context with error state
    const contextWithError: SendContext = {
      ...contextWithAmount,
      error: {
        title: 'send.simulationTitleError',
        message: 'send.simulationMessageError',
      },
    };

    expect(contextWithError.error?.title).toBe('send.simulationTitleError');
    expect(contextWithError.error?.message).toBe('send.simulationMessageError');

    // Test context with loading state
    const contextWithLoading: SendContext = {
      ...initialContext,
      loading: true,
      buildingTransaction: true,
    };

    expect(contextWithLoading.loading).toBe(true);
    expect(contextWithLoading.buildingTransaction).toBe(true);

    // Test context with confirmation stage
    const contextWithConfirmation: SendContext = {
      ...contextWithAmount,
      stage: 'transaction-confirmation',
      feeEstimatedInSol: '0.000005',
    };

    expect(contextWithConfirmation.stage).toBe('transaction-confirmation');
    expect(contextWithConfirmation.feeEstimatedInSol).toBe('0.000005');

    // Test context with success stage
    const contextWithSuccess: SendContext = {
      ...contextWithConfirmation,
      stage: 'transaction-success',
      feePaidInSol: '0.000005',
      transaction: {
        result: 'success',
        signature: MOCK_SOLANA_RPC_SEND_TRANSACTION_RESPONSE.result.signature,
      },
    };

    expect(contextWithSuccess.stage).toBe('transaction-success');
    expect(contextWithSuccess.feePaidInSol).toBe('0.000005');
    expect(contextWithSuccess.transaction?.result).toBe('success');
    expect(contextWithSuccess.transaction?.signature).toBe(
      MOCK_SOLANA_RPC_SEND_TRANSACTION_RESPONSE.result.signature,
    );
  });

  it('handles different currency types correctly', async () => {
    // Test TOKEN currency type
    const tokenContext: SendContext = {
      ...mockContext,
      currencyType: SendCurrencyType.TOKEN,
    };

    expect(tokenContext.currencyType).toBe(SendCurrencyType.TOKEN);

    // Test FIAT currency type
    const fiatContext: SendContext = {
      ...mockContext,
      currencyType: SendCurrencyType.FIAT,
    };

    expect(fiatContext.currencyType).toBe(SendCurrencyType.FIAT);
  });

  it('handles different token price fetch statuses correctly', async () => {
    // Test fetched status
    const fetchedContext: SendContext = {
      ...mockContext,
      tokenPricesFetchStatus: 'fetched',
    };

    expect(fetchedContext.tokenPricesFetchStatus).toBe('fetched');

    // Test error status
    const errorContext: SendContext = {
      ...mockContext,
      tokenPricesFetchStatus: 'error',
    };

    expect(errorContext.tokenPricesFetchStatus).toBe('error');

    // Test loading status
    const loadingContext: SendContext = {
      ...mockContext,
      tokenPricesFetchStatus: 'fetching',
    };

    expect(loadingContext.tokenPricesFetchStatus).toBe('fetching');
  });

  it('handles different domain resolution statuses correctly', async () => {
    // Test resolved status
    const resolvedContext: SendContext = {
      ...mockContext,
      destinationAddressOrDomain: 'example.sol',
      domainResolutionStatus: 'fetched',
      toAddress: MOCK_SOLANA_KEYRING_ACCOUNT_1.address,
    };

    expect(resolvedContext.domainResolutionStatus).toBe('fetched');
    expect(resolvedContext.toAddress).toBe(
      MOCK_SOLANA_KEYRING_ACCOUNT_1.address,
    );

    // Test resolving status
    const resolvingContext: SendContext = {
      ...mockContext,
      destinationAddressOrDomain: 'example.sol',
      domainResolutionStatus: 'fetching',
    };

    expect(resolvingContext.domainResolutionStatus).toBe('fetching');

    // Test error status
    const errorContext: SendContext = {
      ...mockContext,
      destinationAddressOrDomain: 'example.sol',
      domainResolutionStatus: 'error',
    };

    expect(errorContext.domainResolutionStatus).toBe('error');
  });

  it('fails when wrong scope', async () => {
    const { request } = await installSnap();

    const response = await request({
      origin: TEST_ORIGIN,
      method: RpcRequestMethod.StartSendTransactionFlow,
      params: {
        scope: 'wrong scope',
        account: MOCK_SOLANA_KEYRING_ACCOUNT_0.id,
      },
    });

    expect(response).toRespondWithError({
      code: expect.any(Number),
      message: expect.stringMatching(/At path: scope/u),
      stack: expect.any(String),
    });
  });

  it('fails when account is not a uuid', async () => {
    const { request } = await installSnap();

    const response = await request({
      origin: TEST_ORIGIN,
      method: RpcRequestMethod.StartSendTransactionFlow,
      params: {
        scope: Network.Localnet,
        account: 'not-a-uuid',
      },
    });

    expect(response).toRespondWithError({
      code: expect.any(Number),
      message: expect.stringMatching(/At path: account/u),
      stack: expect.any(String),
    });
  });
});
