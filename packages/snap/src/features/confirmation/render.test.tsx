import type { KeyringRequest } from '@metamask/keyring-api';
import { KeyringRpcMethod, SolMethod } from '@metamask/keyring-api';
import { installSnap } from '@metamask/snaps-jest';

import { KnownCaip19Id, Network } from '../../core/constants/solana';
import type { SolanaKeyringRequest } from '../../core/handlers/onKeyringRequest/structs';
import {
  MOCK_SOLANA_RPC_GET_FEE_FOR_MESSAGE_RESPONSE,
  MOCK_SOLANA_RPC_GET_LATEST_BLOCKHASH_RESPONSE,
  MOCK_SOLANA_RPC_GET_MULTIPLE_ACCOUNTS_SWAP_RESPONSE,
} from '../../core/services/mocks/mockSolanaRpcResponses';
import {
  MOCK_SCAN_TRANSACTION_RESPONSE,
  MOCK_SECURITY_ALERTS_API_SCAN_TRANSACTIONS_RESPONSE,
} from '../../core/services/mocks/scanResponses';
import {
  MOCK_SIGN_IN_REQUEST,
  MOCK_SIGN_MESSAGE_REQUEST,
} from '../../core/services/wallet/mocks';
import { SOL_IMAGE_SVG } from '../../core/test/mocks/solana-image-svg';
import {
  MOCK_SOLANA_KEYRING_ACCOUNT_0,
  MOCK_SOLANA_KEYRING_ACCOUNT_1,
} from '../../core/test/mocks/solana-keyring-accounts';
import {
  type MockSolanaRpc,
  startMockSolanaRpc,
} from '../../core/test/mocks/startMockSolanaRpc';
import { TEST_ORIGIN } from '../../core/test/utils';
import type { Preferences } from '../../core/types/snap';
import { DEFAULT_CONFIRMATION_CONTEXT } from './render';
import type { ConfirmationContext } from './types';
import { ConfirmSignAndSendTransaction } from './views/ConfirmSignAndSendTransaction/ConfirmSignAndSendTransaction';
import type { ConfirmSignInProps } from './views/ConfirmSignIn/ConfirmSignIn';
import { ConfirmSignIn } from './views/ConfirmSignIn/ConfirmSignIn';
import { ConfirmSignMessage } from './views/ConfirmSignMessage/ConfirmSignMessage';

describe('render', () => {
  let mockSolanaRpc: MockSolanaRpc;

  beforeAll(() => {
    mockSolanaRpc = startMockSolanaRpc();
  });

  afterAll(() => {
    mockSolanaRpc.shutdown();
  });

  // FIXME: OnKeyringRequest doesnt let us test the confirmation dialog
  describe('renderConfirmationSignAndSendTransaction', () => {
    const mockConfirmationContext: ConfirmationContext = {
      ...DEFAULT_CONFIRMATION_CONTEXT,
      scope: Network.Localnet,
      account: MOCK_SOLANA_KEYRING_ACCOUNT_0,
      transaction:
        'AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAQAOGL90BPMeQxbCdwSbyC2lv/FG3wE/28MLN5GTUYRikvRD9kaGxPJKAoVLt6tV3mRDIMC64Ke2ttBthAfrnxYfDdJtjNxrVLYBP6VBwAW4QcrJODCTq4A0YurnmfI8K4w2eCOqjtLeJ1tGDigOcQ8vJrW8+5B/z3Osuht6LeNXKcYNN2e6UMKyu+PAm4cbix+Ajv4ojwZExmKpP/WVAUXmKrlPhsyBl8xubS/1QIgSYyG36OJXLzlDdk+evw3cLVQ78K0R5qT8KUSk+oJRvvgVQm4b+yjGtmRmd2B8atn1ZqZG9LLuzSr6EAfhR656lu+lF3wZL99DU/P4pl1hT7Ny4wCelyAZtp+XbpgUSfBu/NxYkBd5hXf1v05A7SOMOsV0uXEKjinavFTZPsjPLDavr0sb7T6a8SBqKIPML6T3oq5jKD0N0oI1T+8K47DiJ9N82JyiZvsX3fj3y3zO++Tr3FUGp9UXGMd0yShWY5hpHV62i164o5tLbVxzVVshAAAAAF8Be7pvj7sWgKQq4pHYnNv3ary6SldAXJ09pCa+2ikkAwZGb+UhFzL/7K26csOb57yM5bvF9xJrLEObOkAAAACMlyWPTiSJ8bs9ECkUjg2DC1oTmdr/EIQEjnvY2+n4WfZGzkJtUYvjI9Pg4Deh+Wb4xlObZV4AA9qrzYUv8qaPAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAG3fbh12Whk9nL4UbO63msHLSF7V9bN5E6jPWFfv8AqQR51VvyMcBu7nTFbs5oFQf9sbLeo/SOUQKxzaJWvBOPtD/6J/XX9kp0wJsfKVh53ksJqzbfyd1RSzIap7OM5egBVuD2k2Zaz0TbFWi/F1uqUYnLl/XS/ztlXSu2/W0YsDqGXmnuD1SAyrz2Y1fk3C8Y1Y1Fwep0ifs3I9l5PHKmBqfVFxksXFEhjMlMPUrxf1ja7gibof1E49vZigAAAACs8TbrAfwcTog9I8i1hEq1mjf2at1XxemsO1PgWdNcZFyu+IFzMmg0dnWJuhEhMR2EMUEW+6TUQ3iKu5tJiClIBwoCCwwJABhYqNqaifwADQAFAlWtBAANAAkDkNADAAAAAAAOBgABAA8QEQEBDgYAAgAdEBEBARItEQADARIPEhMSHhgeGRoDAh0fGx4AEREgHgQFHBIUFQYPBwgBABARFhcUAgkdJ+UXy5d6460qAgAAACZkAAExZAECQEIPAAAAAAAj6YIgLwAAADIAABEDAgAAAQkBGgWCEnkMjW1w1PFgdAevgQo46hGC/KyyBA4xfviukUQF7PTn8uoEB3btfg==',
      scan: MOCK_SCAN_TRANSACTION_RESPONSE,
      feeEstimatedInSol: '0.000015',
      tokenPrices: {
        [KnownCaip19Id.SolLocalnet]: {
          price: 200,
        },
      },
      tokenPricesFetchStatus: 'fetched',
      scanFetchStatus: 'fetched',
    };

    it('renders the confirmation dialog', async () => {
      const { mockResolvedResult, server } = mockSolanaRpc;

      server?.get(`/v3/spot-prices`, (_: any, res: any) => {
        return res.json({
          [KnownCaip19Id.SolLocalnet]: {
            usd: 200,
          },
        });
      });

      server?.post(`/solana/message/scan`, (_: any, res: any) => {
        return res.json(MOCK_SECURITY_ALERTS_API_SCAN_TRANSACTIONS_RESPONSE);
      });

      const { onKeyringRequest, mockJsonRpc } = await installSnap();

      mockJsonRpc({
        method: 'snap_manageState',
        result: {
          keyringAccounts: {
            [MOCK_SOLANA_KEYRING_ACCOUNT_0.id]: {
              ...MOCK_SOLANA_KEYRING_ACCOUNT_0,
              scopes: [Network.Localnet],
            },
            [MOCK_SOLANA_KEYRING_ACCOUNT_1.id]: MOCK_SOLANA_KEYRING_ACCOUNT_1,
          },
        },
      });

      mockJsonRpc({
        method: 'snap_getPreferences',
        result: { locale: 'en', currency: 'usd' },
      });

      mockJsonRpc({
        method: 'snap_scheduleBackgroundEvent',
        result: {},
      });

      mockResolvedResult({
        method: 'getFeeForMessage',
        result: MOCK_SOLANA_RPC_GET_FEE_FOR_MESSAGE_RESPONSE.result,
      });

      mockResolvedResult({
        method: 'getLatestBlockhash',
        result: MOCK_SOLANA_RPC_GET_LATEST_BLOCKHASH_RESPONSE.result,
      });

      mockResolvedResult({
        method: 'getMultipleAccounts',
        result: MOCK_SOLANA_RPC_GET_MULTIPLE_ACCOUNTS_SWAP_RESPONSE.result,
      });

      const request: SolanaKeyringRequest = {
        id: globalThis.crypto.randomUUID(),
        scope: Network.Localnet,
        account: MOCK_SOLANA_KEYRING_ACCOUNT_0.id,
        request: {
          method: SolMethod.SignAndSendTransaction,
          params: {
            transaction: mockConfirmationContext.transaction,
            scope: Network.Localnet,
            account: {
              address: MOCK_SOLANA_KEYRING_ACCOUNT_0.address,
            },
          },
        },
      };

      const response = onKeyringRequest({
        origin: TEST_ORIGIN,
        method: KeyringRpcMethod.SubmitRequest,
        params: request as unknown as KeyringRequest,
      });

      const screen1BeforeUpdate = await (response as any).getInterface();

      await screen1BeforeUpdate.waitForUpdate();
      await screen1BeforeUpdate.waitForUpdate();

      const screen1 = await (response as any).getInterface();

      expect(screen1).toRender(
        <ConfirmSignAndSendTransaction context={mockConfirmationContext} />,
      );
    });
  });

  describe('renderConfirmSignMessage', () => {
    it('renders the confirmation dialog', async () => {
      const { onKeyringRequest, mockJsonRpc } = await installSnap();

      mockJsonRpc({
        method: 'snap_manageState',
        result: {
          keyringAccounts: {
            [MOCK_SOLANA_KEYRING_ACCOUNT_0.id]: MOCK_SOLANA_KEYRING_ACCOUNT_0,
          },
        },
      });

      mockJsonRpc({
        method: 'snap_getPreferences',
        result: { locale: 'en', currency: 'usd' },
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

  describe('renderConfirmSignIn', () => {
    it('renders the confirmation dialog', async () => {
      const { onKeyringRequest, mockJsonRpc } = await installSnap();

      mockJsonRpc({
        method: 'snap_manageState',
        result: {
          keyringAccounts: {
            [MOCK_SOLANA_KEYRING_ACCOUNT_0.id]: MOCK_SOLANA_KEYRING_ACCOUNT_0,
          },
        },
      });

      const mockPreferences: Preferences = { locale: 'en', currency: 'usd' };

      mockJsonRpc({
        method: 'snap_getPreferences',
        result: mockPreferences,
      });

      const requestId = globalThis.crypto.randomUUID();

      const request: SolanaKeyringRequest = {
        id: requestId,
        scope: Network.Testnet,
        account: MOCK_SOLANA_KEYRING_ACCOUNT_0.id,
        request: MOCK_SIGN_IN_REQUEST,
      };

      const response = onKeyringRequest({
        origin: TEST_ORIGIN,
        method: KeyringRpcMethod.SubmitRequest,
        params: request as unknown as KeyringRequest,
      });

      const screen = await (response as any).getInterface();

      expect(screen).toRender(
        <ConfirmSignIn
          params={request.request.params as ConfirmSignInProps['params']}
          account={MOCK_SOLANA_KEYRING_ACCOUNT_0}
          scope={Network.Testnet}
          preferences={mockPreferences}
          networkImage={SOL_IMAGE_SVG}
        />,
      );
    });
  });
});
