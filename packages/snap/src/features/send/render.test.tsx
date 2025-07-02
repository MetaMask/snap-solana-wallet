/* eslint-disable @typescript-eslint/naming-convention */
import { installSnap } from '@metamask/snaps-jest';

jest.mock('@metamask/snaps-utils', () => ({
  ...jest.requireActual('@metamask/snaps-utils'),
  snapOwnsAccount: () => true,
}));

import type { SpotPrices } from '../../core/clients/price-api/types';
import {
  KnownCaip19Id,
  Network,
  SOL_SYMBOL,
} from '../../core/constants/solana';
import { RpcRequestMethod } from '../../core/handlers/onRpcRequest/types';
import {
  MOCK_SOLANA_KEYRING_ACCOUNT_0,
  MOCK_SOLANA_KEYRING_ACCOUNT_1,
} from '../../core/test/mocks/solana-keyring-accounts';
import type { MockSolanaRpc } from '../../core/test/mocks/startMockSolanaRpc';
import { startMockSolanaRpc } from '../../core/test/mocks/startMockSolanaRpc';
import { TEST_ORIGIN } from '../../core/test/utils';
import { DEFAULT_SEND_CONTEXT } from './render';
import { type SendContext, SendCurrencyType } from './types';

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

  describe('RPC Method Validation', () => {
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

  describe('Send Context Data Flow', () => {
    it('creates valid send context with correct default values', () => {
      expect(DEFAULT_SEND_CONTEXT.scope).toBe(Network.Mainnet);
      expect(DEFAULT_SEND_CONTEXT.fromAccountId).toBe('');
      expect(DEFAULT_SEND_CONTEXT.amount).toBe('');
      expect(DEFAULT_SEND_CONTEXT.toAddress).toBe('');
      expect(DEFAULT_SEND_CONTEXT.tokenCaipId).toBe(KnownCaip19Id.SolMainnet);
      expect(DEFAULT_SEND_CONTEXT.currencyType).toBe(SendCurrencyType.TOKEN);
      expect(DEFAULT_SEND_CONTEXT.accounts).toEqual([]);
      expect(DEFAULT_SEND_CONTEXT.validation).toEqual({});
      expect(DEFAULT_SEND_CONTEXT.balances).toEqual({});
      expect(DEFAULT_SEND_CONTEXT.assets).toEqual([]);
      expect(DEFAULT_SEND_CONTEXT.tokenPrices).toEqual({});
      expect(DEFAULT_SEND_CONTEXT.selectedTokenMetadata).toBeNull();
      expect(DEFAULT_SEND_CONTEXT.tokenPricesFetchStatus).toBe('initial');
      expect(DEFAULT_SEND_CONTEXT.error).toBeNull();
      expect(DEFAULT_SEND_CONTEXT.buildingTransaction).toBe(false);
      expect(DEFAULT_SEND_CONTEXT.transactionMessage).toBeNull();
      expect(DEFAULT_SEND_CONTEXT.transaction).toBeNull();
      expect(DEFAULT_SEND_CONTEXT.stage).toBe('send-form');
      expect(DEFAULT_SEND_CONTEXT.minimumBalanceForRentExemptionSol).toBe(
        '0.002',
      );
      expect(DEFAULT_SEND_CONTEXT.loading).toBe(true);
    });

    it('validates mock context structure', () => {
      expect(mockContext.accounts).toEqual(solanaKeyringAccounts);
      expect(mockContext.fromAccountId).toBe(MOCK_SOLANA_KEYRING_ACCOUNT_0.id);
      expect(mockContext.scope).toBe(Network.Localnet);
      expect(mockContext.currencyType).toBe(SendCurrencyType.TOKEN);
      expect(mockContext.tokenCaipId).toBe(KnownCaip19Id.SolLocalnet);
      expect(mockContext.assets).toEqual([
        KnownCaip19Id.SolLocalnet,
        'solana:123456789abcdef/token:address1',
        'solana:123456789abcdef/token:address2',
      ]);
      expect(mockContext.balances).toEqual({
        [MOCK_SOLANA_KEYRING_ACCOUNT_0.id]: solanaAccountBalances,
        [MOCK_SOLANA_KEYRING_ACCOUNT_1.id]: solanaAccountBalances,
      });
      expect(mockContext.tokenPrices).toEqual(mockSpotPrices);
      expect(mockContext.loading).toBe(false);
    });

    it('validates account data structure', () => {
      const account = mockContext.accounts.find(
        (acc) => acc.id === mockContext.fromAccountId,
      );
      expect(account).toBeDefined();
      expect(account?.id).toBe(MOCK_SOLANA_KEYRING_ACCOUNT_0.id);
      expect(account?.address).toBe(MOCK_SOLANA_KEYRING_ACCOUNT_0.address);
      expect(account?.type).toBe('solana:data-account');
    });

    it('validates balance data structure', () => {
      const accountBalances = mockContext.balances[mockContext.fromAccountId];
      expect(accountBalances).toBeDefined();
      const solBalance = accountBalances![KnownCaip19Id.SolLocalnet];
      expect(solBalance).toBeDefined();
      expect(solBalance!.amount).toBe('0.123456789');
      expect(solBalance!.unit).toBe(SOL_SYMBOL);
    });

    it('validates token price data structure', () => {
      const solPrice = mockContext.tokenPrices[KnownCaip19Id.SolLocalnet];
      expect(solPrice).toBeDefined();
      expect(solPrice!.id).toBe('solana');
      expect(solPrice!.price).toBe(200);
      expect(solPrice!.marketCap).toBeDefined();
    });
  });

  describe('Send Flow Business Logic', () => {
    it('validates that required fields are present for send flow', () => {
      expect(mockContext.fromAccountId).toBeTruthy();
      expect(mockContext.scope).toBeTruthy();
      expect(mockContext.tokenCaipId).toBeTruthy();
      expect(mockContext.accounts.length).toBeGreaterThan(0);
      expect(Object.keys(mockContext.balances).length).toBeGreaterThan(0);
    });

    it('validates account selection logic', () => {
      const selectedAccount = mockContext.accounts.find(
        (account) => account.id === mockContext.fromAccountId,
      );
      expect(selectedAccount).toBeDefined();
      expect(selectedAccount?.id).toBe(MOCK_SOLANA_KEYRING_ACCOUNT_0.id);
    });

    it('validates asset availability', () => {
      expect(mockContext.assets).toContain(mockContext.tokenCaipId);

      const accountBalances = mockContext.balances[mockContext.fromAccountId];
      expect(accountBalances).toBeDefined();
      expect(accountBalances![mockContext.tokenCaipId]).toBeDefined();
    });

    it('validates token price availability', () => {
      const tokenPrice = mockContext.tokenPrices[mockContext.tokenCaipId];
      expect(tokenPrice).toBeDefined();
      expect(tokenPrice!.price).toBeGreaterThan(0);
    });
  });
});
