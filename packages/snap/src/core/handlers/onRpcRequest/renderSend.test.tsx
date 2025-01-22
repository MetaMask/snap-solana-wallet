/* eslint-disable @typescript-eslint/naming-convention */
import { installSnap } from '@metamask/snaps-jest';

import { Send } from '../../../features/send/Send';
import {
  type SendContext,
  SendCurrencyType,
  SendFormNames,
} from '../../../features/send/types';
import { TransactionConfirmationNames } from '../../../features/send/views/TransactionConfirmation/TransactionConfirmation';
import {
  Caip19Id,
  Network,
  SOL_IMAGE_URL,
  SOL_SYMBOL,
} from '../../constants/solana';
import {
  MOCK_SOLANA_RPC_GET_BALANCE_RESPONSE,
  MOCK_SOLANA_RPC_GET_FEE_FOR_MESSAGE_RESPONSE,
  MOCK_SOLANA_RPC_GET_LATEST_BLOCKHASH_RESPONSE,
  MOCK_SOLANA_RPC_GET_TOKEN_ACCOUNTS_BY_OWNER_RESPONSE,
  MOCK_SOLANA_RPC_SEND_TRANSACTION_RESPONSE,
  MOCK_SOLANA_RPC_SIMULATE_TRANSACTION_RESPONSE,
} from '../../services/mocks/mockSolanaRpcResponses';
import { SOL_IMAGE_SVG } from '../../test/mocks/solana-image-svg';
import {
  MOCK_SOLANA_KEYRING_ACCOUNT_0,
  MOCK_SOLANA_KEYRING_ACCOUNT_1,
} from '../../test/mocks/solana-keyring-accounts';
import type { MockSolanaRpc } from '../../test/mocks/startMockSolanaRpc';
import { startMockSolanaRpc } from '../../test/mocks/startMockSolanaRpc';
import { TEST_ORIGIN } from '../../test/utils';
import { DEFAULT_SEND_CONTEXT } from './renderSend';
import { RpcRequestMethod } from './types';

const solanaKeyringAccounts = [
  MOCK_SOLANA_KEYRING_ACCOUNT_0,
  MOCK_SOLANA_KEYRING_ACCOUNT_1,
];

const solanaAccountBalances = {
  [Caip19Id.SolLocalnet]: {
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
  tokenCaipId: Caip19Id.SolLocalnet,
  assets: [
    Caip19Id.SolLocalnet,
    'solana:123456789abcdef/token:address1',
    'solana:123456789abcdef/token:address2',
  ],
  balances: {
    [MOCK_SOLANA_KEYRING_ACCOUNT_0.id]: solanaAccountBalances,
    [MOCK_SOLANA_KEYRING_ACCOUNT_1.id]: solanaAccountBalances,
  },
  tokenPrices: {
    [Caip19Id.SolLocalnet]: {
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
    [Caip19Id.SolLocalnet]: {
      name: 'Solana',
      symbol: 'SOL',
      iconUrl: SOL_IMAGE_URL,
      imageSvg: SOL_IMAGE_SVG,
      decimals: 9,
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
    server?.get(
      `/v2/chains/:chainIdInCaip2/spot-prices/:tokenAddress`,
      (_: any, res: any) => {
        return res.json({
          price: 200,
        });
      },
    );

    server?.get('/api/v0/fungibles/assets', (_: any, res: any) => {
      return res.json({
        fungibles: [
          {
            fungible_id: 'solana-localnet.slip44:501',
            symbol: 'SOL',
            name: 'Solana',
            decimals: 9,
            previews: {
              image_small_url: SOL_IMAGE_URL,
            },
          },
        ],
      });
    });

    const { request, mockJsonRpc } = await installSnap();

    mockJsonRpc({
      method: 'snap_manageState',
      result: {
        keyringAccounts: {
          [MOCK_SOLANA_KEYRING_ACCOUNT_0.id]: MOCK_SOLANA_KEYRING_ACCOUNT_0,
          [MOCK_SOLANA_KEYRING_ACCOUNT_1.id]: MOCK_SOLANA_KEYRING_ACCOUNT_1,
        },
      },
    });

    mockJsonRpc({
      method: 'snap_getPreferences',
      result: { locale: 'en', currency: 'usd' },
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

    const response = request({
      origin: TEST_ORIGIN,
      method: RpcRequestMethod.StartSendTransactionFlow,
      params: {
        scope: Network.Localnet, // Routes the call to the mock RPC server running locally
        account: MOCK_SOLANA_KEYRING_ACCOUNT_0.id,
      },
    });

    const screen1BeforeUpdate = await response.getInterface();
    await screen1BeforeUpdate.waitForUpdate();
    await screen1BeforeUpdate.waitForUpdate();
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

    const screen3 = await response.getInterface();

    const updatedContext3: SendContext = {
      ...updatedContext2,
      amount: '0.001',
    };

    expect(screen3).toRender(<Send context={updatedContext3} />);

    await screen3.clickElement(SendFormNames.SendButton);

    const screen4 = await response.getInterface();

    const updatedContext4: SendContext = {
      ...updatedContext3,
      stage: 'transaction-confirmation',
    };

    expect(screen4).toRender(<Send context={updatedContext4} />);

    await screen4.clickElement(TransactionConfirmationNames.ConfirmButton);

    const screen5 = await response.getInterface();

    const updatedContext5: SendContext = {
      ...updatedContext4,
      stage: 'transaction-success',
      transaction: {
        result: 'success',
        signature: MOCK_SOLANA_RPC_SEND_TRANSACTION_RESPONSE.result.signature,
      },
    };

    expect(screen5).toRender(<Send context={updatedContext5} />);
  });

  it('fails when wrong params are given', async () => {
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
});
