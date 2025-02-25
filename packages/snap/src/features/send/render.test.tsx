/* eslint-disable @typescript-eslint/naming-convention */
import { installSnap } from '@metamask/snaps-jest';

import {
  KnownCaip19Id,
  Network,
  SOL_IMAGE_URL,
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
import { SOL_IMAGE_SVG } from '../../core/test/mocks/solana-image-svg';
import {
  MOCK_SEED_PHRASE,
  MOCK_SOLANA_KEYRING_ACCOUNT_0,
  MOCK_SOLANA_KEYRING_ACCOUNT_1,
} from '../../core/test/mocks/solana-keyring-accounts';
import type { MockSolanaRpc } from '../../core/test/mocks/startMockSolanaRpc';
import { startMockSolanaRpc } from '../../core/test/mocks/startMockSolanaRpc';
import { EXPECTED_NATIVE_SOL_TRANSFER_DATA } from '../../core/test/mocks/transactions-data/native-sol-transfer';
import { TEST_ORIGIN } from '../../core/test/utils';
import { DEFAULT_SEND_CONTEXT } from './render';
import { Send } from './Send';
import { type SendContext, SendCurrencyType, SendFormNames } from './types';
import { TransactionConfirmationNames } from './views/TransactionConfirmation/TransactionConfirmation';

const solanaKeyringAccounts = [
  MOCK_SOLANA_KEYRING_ACCOUNT_0,
  MOCK_SOLANA_KEYRING_ACCOUNT_1,
];

const solanaAccountBalances = {
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
  tokenPrices: {
    [KnownCaip19Id.SolLocalnet]: {
      price: 200,
    },
    'solana:123456789abcdef/token:address1': {
      price: 200,
    },
    'solana:123456789abcdef/token:address2': {
      price: 200,
    },
  },
  tokenMetadata: {
    [KnownCaip19Id.SolLocalnet]: {
      name: 'Solana',
      symbol: 'SOL',
      iconUrl: SOL_IMAGE_URL,
      imageSvg: SOL_IMAGE_SVG,
      fungible: true,
      units: [
        {
          name: 'Solana',
          symbol: 'SOL',
          decimals: 9,
        },
      ],
    },
  },
};

describe('Send', () => {
  let mockSolanaRpc: MockSolanaRpc;

  beforeAll(() => {
    mockSolanaRpc = startMockSolanaRpc();
  });

  afterAll(() => {
    mockSolanaRpc.shutdown();
  });

  it('renders the send form', async () => {
    const { mockResolvedResult, server } = mockSolanaRpc;

    // temporary mock for the token prices
    // FIXME: when we have a better way to handle external requests
    server?.get(`/v3/spot-prices`, (_: any, res: any) => {
      return res.json({
        [KnownCaip19Id.SolLocalnet]: {
          usd: 200,
        },
        'solana:123456789abcdef/token:address1': {
          usd: 200,
        },
        'solana:123456789abcdef/token:address2': {
          usd: 200,
        },
      });
    });

    const { request, mockJsonRpc } = await installSnap({
      options: { secretRecoveryPhrase: MOCK_SEED_PHRASE },
    });

    mockJsonRpc({
      method: 'snap_manageState',
      result: {
        keyringAccounts: {
          [MOCK_SOLANA_KEYRING_ACCOUNT_0.id]: MOCK_SOLANA_KEYRING_ACCOUNT_0,
          [MOCK_SOLANA_KEYRING_ACCOUNT_1.id]: MOCK_SOLANA_KEYRING_ACCOUNT_1,
        },
        assets: {
          [MOCK_SOLANA_KEYRING_ACCOUNT_0.id]: solanaAccountBalances,
          [MOCK_SOLANA_KEYRING_ACCOUNT_1.id]: solanaAccountBalances,
        },
        metadata: {
          [KnownCaip19Id.SolLocalnet]: {
            assetId: KnownCaip19Id.SolLocalnet,
            name: 'Solana',
            symbol: 'SOL',
            iconUrl: SOL_IMAGE_URL,
            imageSvg: SOL_IMAGE_SVG,
            decimals: 9,
          },
        },
      },
    });

    mockJsonRpc({
      method: 'snap_getPreferences',
      result: { locale: 'en', currency: 'usd' },
    });

    mockJsonRpc({
      method: 'snap_manageAccounts',
      result: {
        [MOCK_SOLANA_KEYRING_ACCOUNT_0.id]: MOCK_SOLANA_KEYRING_ACCOUNT_0,
        [MOCK_SOLANA_KEYRING_ACCOUNT_1.id]: MOCK_SOLANA_KEYRING_ACCOUNT_1,
      },
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

    const response = request({
      origin: TEST_ORIGIN,
      method: RpcRequestMethod.StartSendTransactionFlow,
      params: {
        scope: Network.Localnet, // Routes the call to the mock RPC server running locally
        account: MOCK_SOLANA_KEYRING_ACCOUNT_0.id,
      },
    });

    const screen1 = await response.getInterface();

    const updatedContext1: SendContext = mockContext;

    expect(screen1).toRender(<Send context={updatedContext1} />);

    await screen1.typeInField(
      SendFormNames.DestinationAccountInput,
      MOCK_SOLANA_KEYRING_ACCOUNT_1.address,
    );

    // two rerenders are happening here
    await response.getInterface();
    const screen2 = await response.getInterface();

    const updatedContext2: SendContext = {
      ...updatedContext1,
      toAddress: MOCK_SOLANA_KEYRING_ACCOUNT_1.address,
    };

    expect(screen2).toRender(<Send context={updatedContext2} />);

    await screen2.typeInField(SendFormNames.AmountInput, '0.001');

    await screen2.waitForUpdate();

    const screen3 = await response.getInterface();

    const updatedContext3: SendContext = {
      ...updatedContext2,
      amount: '0.001',
      transactionMessage: 'some-base64-encoded-message',
    };

    expect(screen3).toRender(<Send context={updatedContext3} />);

    await screen3.clickElement(SendFormNames.SendButton);

    const screen4 = await response.getInterface();

    const updatedContext4: SendContext = {
      ...updatedContext3,
      stage: 'transaction-confirmation',
      feeEstimatedInSol: '0.000015',
    };

    expect(screen4).toRender(<Send context={updatedContext4} />);

    await screen4.clickElement(TransactionConfirmationNames.ConfirmButton);

    const screen5 = await response.getInterface();

    const updatedContext5: SendContext = {
      ...updatedContext4,
      stage: 'transaction-success',
      feePaidInSol: '0.000015',
      transaction: {
        result: 'success',
        signature: MOCK_SOLANA_RPC_SEND_TRANSACTION_RESPONSE.result.signature,
      },
    };

    expect(screen5).toRender(<Send context={updatedContext5} />);
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
