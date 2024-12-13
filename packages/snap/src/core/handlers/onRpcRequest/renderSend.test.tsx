import { installSnap } from '@metamask/snaps-jest';

import { Send } from '../../../features/send/Send';
import {
  type SendContext,
  SendCurrency,
  SendFormNames,
} from '../../../features/send/types';
import { TransactionConfirmationNames } from '../../../features/send/views/TransactionConfirmation/TransactionConfirmation';
import {
  SolanaCaip19Tokens,
  SolanaCaip2Networks,
  SolanaInternalRpcMethods,
} from '../../constants/solana';
import {
  MOCK_SOLANA_RPC_GET_BALANCE_RESPONSE,
  MOCK_SOLANA_RPC_GET_LATEST_BLOCKHASH_RESPONSE,
  MOCK_SOLANA_RPC_SEND_TRANSACTION_RESPONSE,
} from '../../services/mocks/mockSolanaRpcResponses';
import {
  MOCK_SOLANA_KEYRING_ACCOUNT_0,
  MOCK_SOLANA_KEYRING_ACCOUNT_1,
} from '../../test/mocks/solana-keyring-accounts';
import type { MockSolanaRpc } from '../../test/mocks/startMockSolanaRpc';
import { startMockSolanaRpc } from '../../test/mocks/startMockSolanaRpc';
import { TEST_ORIGIN } from '../../test/utils';
import { DEFAULT_SEND_CONTEXT } from './renderSend';

const solanaKeyringAccounts = [
  MOCK_SOLANA_KEYRING_ACCOUNT_0,
  MOCK_SOLANA_KEYRING_ACCOUNT_1,
];

const mockContext: SendContext = {
  ...DEFAULT_SEND_CONTEXT,
  accounts: solanaKeyringAccounts,
  fromAccountId: '0',
  scope: SolanaCaip2Networks.Localnet,
  balances: {
    '0': {
      amount: '0.123456789',
      unit: SendCurrency.SOL,
    },
    '1': {
      amount: '0.123456789',
      unit: SendCurrency.SOL,
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
    const { mockResolvedResult } = mockSolanaRpc;
    const { request, mockJsonRpc } = await installSnap();

    mockJsonRpc({
      method: 'snap_manageState',
      result: { keyringAccounts: solanaKeyringAccounts },
    });

    mockJsonRpc({
      method: 'snap_getPreferences',
      result: { locale: 'en' },
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

    // tmp mocking the delay: jest is going too fast (balances are ot reached)
    await new Promise((resolve) => setTimeout(resolve, 500));

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
      transaction: {
        result: 'success',
        signature: MOCK_SOLANA_RPC_SEND_TRANSACTION_RESPONSE.result.signature,
        tokenPrice: {
          price: 0,
          address: '0',
          decimals: 9,
          symbol: SendCurrency.SOL,
          caip19Id: SolanaCaip19Tokens.SOL,
        },
      },
    };

    expect(screen5).toRender(<Send context={updatedContext5} />);
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
