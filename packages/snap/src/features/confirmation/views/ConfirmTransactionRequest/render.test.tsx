import type { KeyringRequest } from '@metamask/keyring-api';
import { KeyringRpcMethod, SolMethod } from '@metamask/keyring-api';
import { installSnap } from '@metamask/snaps-jest';

import { MOCK_SPOT_PRICES } from '../../../../core/clients/price-api/mocks/spot-prices';
import type { Preferences } from '../../../../core/domain';
import {
  KnownCaip19Id,
  MOCK_SOLANA_KEYRING_ACCOUNT_0,
  MOCK_SOLANA_KEYRING_ACCOUNT_1,
  Network,
} from '../../../../core/domain';
import type { SolanaKeyringRequest } from '../../../../core/handlers/onKeyringRequest/structs';
import {
  MOCK_SOLANA_RPC_GET_FEE_FOR_MESSAGE_RESPONSE,
  MOCK_SOLANA_RPC_GET_LATEST_BLOCKHASH_RESPONSE,
  MOCK_SOLANA_RPC_GET_MULTIPLE_ACCOUNTS_SWAP_RESPONSE,
} from '../../../../core/services/mocks/mockSolanaRpcResponses';
import {
  MOCK_SCAN_TRANSACTION_RESPONSE,
  MOCK_SECURITY_ALERTS_API_SCAN_TRANSACTIONS_RESPONSE,
} from '../../../../core/services/mocks/scanResponses';
import type { MockSolanaRpc } from '../../../../core/test/mocks/startMockSolanaRpc';
import { startMockSolanaRpc } from '../../../../core/test/mocks/startMockSolanaRpc';
import { TEST_ORIGIN } from '../../../../core/test/utils';
import { ConfirmTransactionRequest } from './ConfirmTransactionRequest';
import { DEFAULT_CONFIRMATION_CONTEXT } from './render';
import type { ConfirmTransactionRequestContext } from './types';

// FIXME: OnKeyringRequest doesn't let us test the confirmation dialog
describe('render', () => {
  let mockSolanaRpc: MockSolanaRpc;

  const mockSpotPrices = {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    [KnownCaip19Id.SolMainnet]: MOCK_SPOT_PRICES[KnownCaip19Id.SolMainnet]!,
  };

  const mockConfirmationContext: ConfirmTransactionRequestContext = {
    ...DEFAULT_CONFIRMATION_CONTEXT,
    scope: Network.Localnet,
    account: MOCK_SOLANA_KEYRING_ACCOUNT_0,
    transaction:
      'AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAQAOGL90BPMeQxbCdwSbyC2lv/FG3wE/28MLN5GTUYRikvRD9kaGxPJKAoVLt6tV3mRDIMC64Ke2ttBthAfrnxYfDdJtjNxrVLYBP6VBwAW4QcrJODCTq4A0YurnmfI8K4w2eCOqjtLeJ1tGDigOcQ8vJrW8+5B/z3Osuht6LeNXKcYNN2e6UMKyu+PAm4cbix+Ajv4ojwZExmKpP/WVAUXmKrlPhsyBl8xubS/1QIgSYyG36OJXLzlDdk+evw3cLVQ78K0R5qT8KUSk+oJRvvgVQm4b+yjGtmRmd2B8atn1ZqZG9LLuzSr6EAfhR656lu+lF3wZL99DU/P4pl1hT7Ny4wCelyAZtp+XbpgUSfBu/NxYkBd5hXf1v05A7SOMOsV0uXEKjinavFTZPsjPLDavr0sb7T6a8SBqKIPML6T3oq5jKD0N0oI1T+8K47DiJ9N82JyiZvsX3fj3y3zO++Tr3FUGp9UXGMd0yShWY5hpHV62i164o5tLbVxzVVshAAAAAF8Be7pvj7sWgKQq4pHYnNv3ary6SldAXJ09pCa+2ikkAwZGb+UhFzL/7K26csOb57yM5bvF9xJrLEObOkAAAACMlyWPTiSJ8bs9ECkUjg2DC1oTmdr/EIQEjnvY2+n4WfZGzkJtUYvjI9Pg4Deh+Wb4xlObZV4AA9qrzYUv8qaPAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAG3fbh12Whk9nL4UbO63msHLSF7V9bN5E6jPWFfv8AqQR51VvyMcBu7nTFbs5oFQf9sbLeo/SOUQKxzaJWvBOPtD/6J/XX9kp0wJsfKVh53ksJqzbfyd1RSzIap7OM5egBVuD2k2Zaz0TbFWi/F1uqUYnLl/XS/ztlXSu2/W0YsDqGXmnuD1SAyrz2Y1fk3C8Y1Y1Fwep0ifs3I9l5PHKmBqfVFxksXFEhjMlMPUrxf1ja7gibof1E49vZigAAAACs8TbrAfwcTog9I8i1hEq1mjf2at1XxemsO1PgWdNcZFyu+IFzMmg0dnWJuhEhMR2EMUEW+6TUQ3iKu5tJiClIBwoCCwwJABhYqNqaifwADQAFAlWtBAANAAkDkNADAAAAAAAOBgABAA8QEQEBDgYAAgAdEBEBARItEQADARIPEhMSHhgeGRoDAh0fGx4AEREgHgQFHBIUFQYPBwgBABARFhcUAgkdJ+UXy5d6460qAgAAACZkAAExZAECQEIPAAAAAAAj6YIgLwAAADIAABEDAgAAAQkBGgWCEnkMjW1w1PFgdAevgQo46hGC/KyyBA4xfviukUQF7PTn8uoEB3btfg==',
    scan: MOCK_SCAN_TRANSACTION_RESPONSE,
    feeEstimatedInSol: '0.000015',
    tokenPrices: mockSpotPrices,
    tokenPricesFetchStatus: 'fetched',
    scanFetchStatus: 'fetched',
  };

  beforeAll(() => {
    mockSolanaRpc = startMockSolanaRpc();
  });

  afterAll(() => {
    mockSolanaRpc.shutdown();
  });

  describe('when all preferences are enabled', () => {
    it('renders the confirmation dialog', async () => {
      const { mockResolvedResult, server } = mockSolanaRpc;

      server?.get(`/v3/spot-prices`, (_: any, res: any) => {
        return res.json(mockSpotPrices);
      });

      server?.post(`/solana/message/scan`, (_: any, res: any) => {
        return res.json(MOCK_SECURITY_ALERTS_API_SCAN_TRANSACTIONS_RESPONSE);
      });

      const initialState = {
        keyringAccounts: {
          [MOCK_SOLANA_KEYRING_ACCOUNT_0.id]: {
            ...MOCK_SOLANA_KEYRING_ACCOUNT_0,
            scopes: [Network.Localnet],
          },
        },
      };

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

      const { onKeyringRequest, mockJsonRpc } = await installSnap({
        options: {
          ...mockPreferences,
          unencryptedState: initialState,
        },
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

      /**
       * Second render:
       * - Get token prices
       * - Get transaction fee
       */
      await screen1BeforeUpdate.waitForUpdate();

      /**
       * Third render:
       * - Scan transaction
       */
      await screen1BeforeUpdate.waitForUpdate();

      const screen1 = await (response as any).getInterface();

      expect(screen1).toRender(
        <ConfirmTransactionRequest context={mockConfirmationContext} />,
      );
    });
  });

  describe('when all preferences are disabled', () => {
    it('renders the confirmation dialog', async () => {
      const { mockResolvedResult } = mockSolanaRpc;

      const initialState = {
        keyringAccounts: {
          [MOCK_SOLANA_KEYRING_ACCOUNT_0.id]: {
            ...MOCK_SOLANA_KEYRING_ACCOUNT_0,
            scopes: [Network.Localnet],
          },
          [MOCK_SOLANA_KEYRING_ACCOUNT_1.id]: MOCK_SOLANA_KEYRING_ACCOUNT_1,
        },
      };

      const mockPreferences: Preferences = {
        locale: 'en',
        currency: 'usd',
        hideBalances: false,
        useSecurityAlerts: false,
        useExternalPricingData: false,
        simulateOnChainActions: false,
        useTokenDetection: true,
        batchCheckBalances: true,
        displayNftMedia: true,
        useNftDetection: true,
      };

      const { onKeyringRequest, mockJsonRpc } = await installSnap({
        options: {
          ...mockPreferences,
          unencryptedState: initialState,
        },
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

      /**
       * Second render:
       * - Get token prices, which does not happen
       * - Get transaction fee
       */
      await screen1BeforeUpdate.waitForUpdate();

      /**
       * Third render:
       * - Scan transaction, which does not happen
       */
      await screen1BeforeUpdate.waitForUpdate();

      const screen1 = await (response as any).getInterface();

      const mockContext = {
        ...mockConfirmationContext,
        preferences: mockPreferences,
        scan: null,
        tokenPrices: {},
      };

      expect(screen1).toRender(
        <ConfirmTransactionRequest context={mockContext} />,
      );
    });
  });
});
