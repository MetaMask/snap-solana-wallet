import { installSnap } from '@metamask/snaps-jest';

import {
  SolanaCaip2Networks,
  SolanaInternalRpcMethods,
} from '../../core/constants/solana';
import { TEST_ORIGIN } from '../../core/test/utils';
import { SendForm } from './components/SendForm/SendForm';
import { SendFormNames } from './types/form';

const solanaKeyringAccounts = [
  {
    id: '123',
    address: '123',
    index: 0,
    methods: [],
    options: {},
    type: 'solana:data-account' as const,
  },
];

const mockContext = {
  accounts: solanaKeyringAccounts,
  scope: SolanaCaip2Networks.Devnet,
  selectedAccountId: '123',
  validation: {},
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
        account: '123',
      },
    });

    const screen = await response.getInterface();

    expect(screen).toRender(<SendForm context={mockContext} />);

    await screen.selectFromSelector(SendFormNames.AccountSelector, '123');

    expect(screen).toRender(<SendForm context={mockContext} />);
  });

  it('fails when wrong params are given', async () => {
    const { request } = await installSnap();

    const response = await request({
      origin: TEST_ORIGIN,
      method: SolanaInternalRpcMethods.StartSendTransactionFlow,
      params: {
        scope: 'wrong scope',
        account: '123',
      },
    });

    expect(response).toRespondWithError({
      code: expect.any(Number),
      message: expect.stringMatching(/At path: scope/u),
      stack: expect.any(String),
    });
  });
});
