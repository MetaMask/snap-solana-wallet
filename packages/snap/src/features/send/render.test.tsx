import { installSnap } from '@metamask/snaps-jest';
import express from 'express';

import {
  SolanaCaip2Networks,
  SolanaInternalRpcMethods,
} from '../../core/constants/solana';
import { MOCK_SOLANA_KEYRING_ACCOUNT_0 } from '../../core/test/mocks/solana-keyring-accounts';
import { TEST_ORIGIN } from '../../core/test/utils';
import { SendForm } from './components/SendForm/SendForm';
import { SendFormNames } from './types/form';
import { type SendContext, SendCurrency } from './types/send';

const solanaKeyringAccounts = [MOCK_SOLANA_KEYRING_ACCOUNT_0];

const mockContext: SendContext = {
  accounts: solanaKeyringAccounts,
  scope: SolanaCaip2Networks.Localnet,
  selectedAccountId: '0',
  validation: {},
  showClearButton: false,
  clearToField: false,
  currencySymbol: SendCurrency.SOL,
  balances: {
    '0': {
      amount: '0.123456789',
      unit: SendCurrency.SOL,
    },
  },
  rates: {
    conversionDate: Date.now(),
    conversionRate: 261,
    currency: SendCurrency.FIAT,
    usdConversionRate: 1,
  },
  canReview: false,
  maxBalance: false,
};

describe('Send', () => {
  let app: express.Application;
  let server: ReturnType<typeof app.listen>;

  beforeEach(() => {
    app = express();
    const port = 8899;

    app.post('/', (req, res) => {
      res.json({
        jsonrpc: '2.0',
        result: {
          context: {
            apiVersion: '1.18.22',
            slot: 302900219,
          },
          value: 123456789,
        },
        id: '0',
      });
    });

    server = app.listen(port, () => {
      console.log(`Mock Solana RPC listening on port ${port}`);
    });
  });

  afterEach(() => {
    server.close();
  });

  it('renders the send form', async () => {
    const { request, mockJsonRpc } = await installSnap();

    mockJsonRpc({
      method: 'snap_manageState',
      result: { keyringAccounts: solanaKeyringAccounts },
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

    await screen.selectFromSelector(SendFormNames.AccountSelector, '0');

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
