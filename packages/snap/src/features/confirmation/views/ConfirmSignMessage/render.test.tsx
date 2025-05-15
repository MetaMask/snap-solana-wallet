import type { KeyringRequest } from '@metamask/keyring-api';
import { KeyringRpcMethod } from '@metamask/keyring-api';
import { installSnap } from '@metamask/snaps-jest';

import { Network } from '../../../../core/constants/solana';
import type { SolanaKeyringRequest } from '../../../../core/handlers/onKeyringRequest/structs';
import { MOCK_SIGN_MESSAGE_REQUEST } from '../../../../core/services/wallet/mocks';
import { SOL_IMAGE_SVG } from '../../../../core/test/mocks/solana-image-svg';
import { MOCK_SOLANA_KEYRING_ACCOUNT_0 } from '../../../../core/test/mocks/solana-keyring-accounts';
import type { MockSolanaRpc } from '../../../../core/test/mocks/startMockSolanaRpc';
import { startMockSolanaRpc } from '../../../../core/test/mocks/startMockSolanaRpc';
import { TEST_ORIGIN } from '../../../../core/test/utils';
import type { Preferences } from '../../../../core/types/snap';
import { ConfirmSignMessage } from './ConfirmSignMessage';

describe('render', () => {
  let mockSolanaRpc: MockSolanaRpc;

  beforeAll(() => {
    mockSolanaRpc = startMockSolanaRpc();
  });

  afterAll(() => {
    mockSolanaRpc.shutdown();
  });

  it('renders the confirmation dialog', async () => {
    const { onKeyringRequest, mockJsonRpc } = await installSnap();

    mockJsonRpc({
      method: 'snap_getState',
      result: {
        keyringAccounts: {
          [MOCK_SOLANA_KEYRING_ACCOUNT_0.id]: MOCK_SOLANA_KEYRING_ACCOUNT_0,
        },
      },
    });

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

    mockJsonRpc({
      method: 'snap_getPreferences',
      result: mockPreferences,
    });

    const request: SolanaKeyringRequest = {
      id: globalThis.crypto.randomUUID(),
      scope: Network.Testnet,
      account: MOCK_SOLANA_KEYRING_ACCOUNT_0.id,
      request: MOCK_SIGN_MESSAGE_REQUEST,
    };

    const response = onKeyringRequest({
      origin: TEST_ORIGIN,
      method: KeyringRpcMethod.SubmitRequest,
      params: request as unknown as KeyringRequest,
    });

    const screen = await (response as any).getInterface();

    expect(screen).toRender(
      <ConfirmSignMessage
        message={'Hello, world!'}
        account={MOCK_SOLANA_KEYRING_ACCOUNT_0}
        scope={Network.Testnet}
        locale={'en'}
        networkImage={SOL_IMAGE_SVG}
      />,
    );
  });
});
