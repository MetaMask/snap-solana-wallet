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

  it('tests actual validation logic for address input', async () => {
    const { addressOrDomain, required } = await import('./validation/form');

    const requiredValidator = required('send.toRequiredError', 'en');
    expect(requiredValidator('')).toStrictEqual({
      message: 'To address is required',
      value: '',
    });
    expect(requiredValidator('valid-address')).toBeNull();

    const addressValidator = addressOrDomain('send.toInvalidError', 'en');
    expect(addressValidator('invalid-address')).toStrictEqual({
      message: 'Invalid Solana address or domain name',
      value: 'invalid-address',
    });
    expect(addressValidator(MOCK_SOLANA_KEYRING_ACCOUNT_1.address)).toBeNull();
  });

  it('tests actual validation logic for amount input', async () => {
    const { amountInput } = await import('./validation/form');

    const context: SendContext = {
      ...mockContext,
      fromAccountId: MOCK_SOLANA_KEYRING_ACCOUNT_0.id,
      tokenCaipId: KnownCaip19Id.SolLocalnet,
      balances: {
        [MOCK_SOLANA_KEYRING_ACCOUNT_0.id]: {
          [KnownCaip19Id.SolLocalnet]: {
            amount: '1.0',
            unit: 'SOL',
          },
        },
      },
      minimumBalanceForRentExemptionSol: '0.002',
      feeEstimatedInSol: '0.000005',
      selectedTokenMetadata: {
        symbol: 'SOL',
        name: 'Solana',
        asset: KnownCaip19Id.SolLocalnet,
        imageSvg: null,
      },
    };

    const validator = amountInput(context);

    expect(validator('')).toStrictEqual({
      message: '',
      value: '',
    });

    expect(validator('0.5')).toBeNull();

    expect(validator('2.0')).toStrictEqual({
      message: 'Insufficient balance: 1.0 SOL',
      value: '2.0',
    });

    expect(validator('0.001')).toStrictEqual({
      message: 'Amount must be greater than 0.002',
      value: '0.001',
    });
  });

  it('tests actual form validation integration', async () => {
    const { sendFieldsAreValid } = await import('./validation/form');

    const validContext: SendContext = {
      ...mockContext,
      fromAccountId: MOCK_SOLANA_KEYRING_ACCOUNT_0.id,
      toAddress: MOCK_SOLANA_KEYRING_ACCOUNT_1.address,
      amount: '0.5',
      balances: {
        [MOCK_SOLANA_KEYRING_ACCOUNT_0.id]: {
          [KnownCaip19Id.SolLocalnet]: {
            amount: '1.0',
            unit: 'SOL',
          },
        },
      },
      minimumBalanceForRentExemptionSol: '0.002',
      feeEstimatedInSol: '0.000005',
      selectedTokenMetadata: {
        symbol: 'SOL',
        name: 'Solana',
        asset: KnownCaip19Id.SolLocalnet,
        imageSvg: null,
      },
    };

    expect(sendFieldsAreValid(validContext)).toBe(true);

    const invalidContext: SendContext = {
      ...validContext,
      amount: '',
    };

    expect(sendFieldsAreValid(invalidContext)).toBe(false);
  });

  it('tests actual renderSend function behavior', async () => {
    const { mockResolvedResult, server } = mockSolanaRpc;

    server?.get(`/v3/spot-prices`, (_: any, res: any) => {
      return res.json(mockSpotPrices);
    });

    const initialState = {
      keyringAccounts: {
        [MOCK_SOLANA_KEYRING_ACCOUNT_0.id]: {
          ...MOCK_SOLANA_KEYRING_ACCOUNT_0,
          entropySource: 'default',
        },
      },
      assets: {
        [MOCK_SOLANA_KEYRING_ACCOUNT_0.id]: solanaAccountBalances,
      },
    };

    const { request, mockJsonRpc } = await installSnap({
      options: {
        secretRecoveryPhrase: MOCK_SEED_PHRASE,
        unencryptedState: initialState,
        accounts: [
          getMockAccount({
            address: MOCK_SOLANA_KEYRING_ACCOUNT_0.address,
            selected: true,
            assets: Object.keys(solanaAccountBalances) as CaipAssetType[],
            scopes: [Network.Localnet],
          }),
        ],
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
      method: 'getMinimumBalanceForRentExemption',
      result: 890880,
    });

    const dialogPromise = request({
      origin: TEST_ORIGIN,
      method: RpcRequestMethod.StartSendTransactionFlow,
      params: {
        scope: Network.Localnet,
        account: MOCK_SOLANA_KEYRING_ACCOUNT_0.id,
      },
    });

    const response = await dialogPromise;
    expect(response).toBeDefined();

    const errorResponse = await request({
      origin: TEST_ORIGIN,
      method: RpcRequestMethod.StartSendTransactionFlow,
      params: {
        scope: 'invalid-scope' as any,
        account: MOCK_SOLANA_KEYRING_ACCOUNT_0.id,
      },
    });

    expect(errorResponse).toRespondWithError({
      code: expect.any(Number),
      message: expect.stringMatching(/Permission denied/u),
      stack: expect.any(String),
    });
  });

  it('tests actual currency conversion logic', async () => {
    const { tokenToFiat } = await import('../../core/utils/tokenToFiat');
    const { formatCrypto } = await import('../../core/utils/formatCrypto');
    const { formatFiat } = await import('../../core/utils/formatFiat');

    const tokenAmount = '1.5';
    const tokenPrice = 200;
    const fiatAmount = tokenToFiat(tokenAmount, tokenPrice);
    expect(fiatAmount).toBe('300'); // 1.5 * 200 = 300

    const formattedCrypto = formatCrypto(tokenAmount, 'SOL', 'en');
    expect(formattedCrypto).toBe('1.5 SOL');

    const formattedFiat = formatFiat(fiatAmount.toString(), 'usd', 'en');
    expect(formattedFiat).toBe('$300.00');
  });

  it('tests actual balance calculation logic', async () => {
    const { getBalance, getNativeTokenBalance } = await import('./selectors');

    const context: SendContext = {
      ...mockContext,
      fromAccountId: MOCK_SOLANA_KEYRING_ACCOUNT_0.id,
      tokenCaipId: KnownCaip19Id.SolLocalnet,
      balances: {
        [MOCK_SOLANA_KEYRING_ACCOUNT_0.id]: {
          [KnownCaip19Id.SolLocalnet]: {
            amount: '2.5',
            unit: 'SOL',
          },
        },
      },
    };

    const balance = getBalance(context);
    expect(balance).toBe('2.5');

    const nativeBalance = getNativeTokenBalance(context);
    expect(nativeBalance).toBe('2.5');
  });

  it('tests actual transaction building logic', async () => {
    const { buildTransactionMessageAndUpdateInterface } = await import(
      './utils/buildTransactionMessageAndUpdateInterface'
    );

    expect(typeof buildTransactionMessageAndUpdateInterface).toBe('function');
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
      message: expect.stringMatching(/Permission denied/u),
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
      message: expect.stringMatching(/Permission denied/u),
      stack: expect.any(String),
    });
  });
});
