import { installSnap } from '@metamask/snaps-jest';

import {
  SolanaCaip19Tokens,
  SolanaCaip2Networks,
  SolanaInternalRpcMethods,
} from '../../core/constants/solana';
import { MOCK_SOLANA_RPC_GET_BALANCE_RESPONSE } from '../../core/services/mocks/mockSolanaRpcResponses';
import { MOCK_SOLANA_KEYRING_ACCOUNT_0 } from '../../core/test/mocks/solana-keyring-accounts';
import type { MockSolanaRpc } from '../../core/test/mocks/startMockSolanaRpc';
import { startMockSolanaRpc } from '../../core/test/mocks/startMockSolanaRpc';
import { TEST_ORIGIN } from '../../core/test/utils';
import { SendForm } from './views/SendForm/SendForm';
import {
  type SendContext,
  SendCurrency,
  SendFormNames,
} from './views/SendForm/types';

const solanaKeyringAccounts = [MOCK_SOLANA_KEYRING_ACCOUNT_0];

const mockContext: SendContext = {
  accounts: solanaKeyringAccounts,
  scope: SolanaCaip2Networks.Localnet,
  fromAccountId: '0',
  amount: '2.67566',
  toAddress: 'FvS1p2dQnhWNrHyuVpJRU5mkYRkSTrubXHs4XrAn3PGo',
  fee: '0.000005',
  validation: {},
  currencySymbol: SendCurrency.SOL,
  balances: {
    '0': {
      amount: '0.123456789',
      unit: SendCurrency.SOL,
    },
  },
  tokenPrices: {
    [SolanaCaip19Tokens.SOL]: {
      symbol: 'SOL',
      caip19Id: SolanaCaip19Tokens.SOL,
      address: 'So11111111111111111111111111111111111111112',
      decimals: 9,
      price: 261,
    },
  },
  locale: 'en',
  transaction: null,
};

describe('Send', () => {
  let mockSolanaRpc: MockSolanaRpc;

  beforeAll(() => {
    mockSolanaRpc = startMockSolanaRpc();
  });

  afterAll(() => {
    mockSolanaRpc.shutdown();
  });

  it.skip('renders the send form', async () => {
    const { mockResolvedResult } = mockSolanaRpc;
    const { request, mockJsonRpc } = await installSnap();

    mockJsonRpc({
      method: 'snap_manageState',
      result: { keyringAccounts: solanaKeyringAccounts },
    });

    mockResolvedResult({
      method: 'getBalance',
      result: MOCK_SOLANA_RPC_GET_BALANCE_RESPONSE.result,
    });

    const response = request({
      origin: TEST_ORIGIN,
      method: SolanaInternalRpcMethods.StartSendTransactionFlow,
      params: {
        scope: SolanaCaip2Networks.Localnet, // Routes the call to the mock RPC server running locally
        account: '0',
      },
    });

    const screen = await response.getInterface();

    expect(screen).toRender(<SendForm context={mockContext} />);

    await screen.selectFromSelector(SendFormNames.SourceAccountSelector, '0');

    expect(screen).toRender(<SendForm context={mockContext} />);
  });

  it('fails when wrong params are given', async () => {
    const { request } = await installSnap();

    const response = await request({
      origin: TEST_ORIGIN,
      method: SolanaInternalRpcMethods.StartSendTransactionFlow,
      params: {
        scope: 'wrong scope',
        account: '0',
      },
    });

    expect(response).toRespondWithError({
      code: expect.any(Number),
      message: expect.stringMatching(/At path: scope/u),
      stack: expect.any(String),
    });
  });
});
