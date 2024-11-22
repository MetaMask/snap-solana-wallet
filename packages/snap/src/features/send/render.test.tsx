import { installSnap } from '@metamask/snaps-jest';

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
  scope: SolanaCaip2Networks.Devnet,
  selectedAccountId: '0',
  validation: {},
  showClearButton: false,
  clearToField: false,
  currencySymbol: SendCurrency.SOL,
  balances: {},
  rates: null,
  canReview: false,
  maxBalance: false,
};

describe('Send', () => {
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
        scope: SolanaCaip2Networks.Mainnet,
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
