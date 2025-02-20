import { KeyringRpcMethod, SolMethod } from '@metamask/keyring-api';
import { installSnap } from '@metamask/snaps-jest';

import { KnownCaip19Id, Network } from '../../core/constants/solana';
import {
  MOCK_SOLANA_RPC_GET_FEE_FOR_MESSAGE_RESPONSE,
  MOCK_SOLANA_RPC_GET_MULTIPLE_ACCOUNTS_RESPONSE,
} from '../../core/services/mocks/mockSolanaRpcResponses';
import {
  MOCK_SOLANA_KEYRING_ACCOUNT_0,
  MOCK_SOLANA_KEYRING_ACCOUNT_1,
} from '../../core/test/mocks/solana-keyring-accounts';
import {
  type MockSolanaRpc,
  startMockSolanaRpc,
} from '../../core/test/mocks/startMockSolanaRpc';
import { TEST_ORIGIN } from '../../core/test/utils';
import { Confirmation } from './Confirmation';
import { DEFAULT_CONFIRMATION_CONTEXT } from './renderConfirmation';
import type { ConfirmationContext } from './types';

const mockConfirmationContext: ConfirmationContext = {
  ...DEFAULT_CONFIRMATION_CONTEXT,
  scope: Network.Localnet,
  account: MOCK_SOLANA_KEYRING_ACCOUNT_0,
  transaction:
    'AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAQAKEb90BPMeQxbCdwSbyC2lv/FG3wE/28MLN5GTUYRikvRDkOL72EsPrSrrKZF33sPiMFwhF786GU/O6Np6ngUZdtMjqo7S3idbRg4oDnEPLya1vPuQf89zrLobei3jVynGDT23WlYbqpa0+YWZyJHXFuu3ghb5vWc1zPY3lpthsJywNxBrinkyKcWM0yri8Ob6fbj2ETlWbB74B2SrzsZMN6A4AciRc/6MiXjQIWCX5+3q02bOsSR457gFdL/3Lh+okGdBBA/kB6qwUEagfnGzH2GY12XE3va/gn3W4Loqy/D+KD0N0oI1T+8K47DiJ9N82JyiZvsX3fj3y3zO++Tr3FUGp9UXGMd0yShWY5hpHV62i164o5tLbVxzVVshAAAAAF4nHfb+JwqvkradTprCUYGxgeCmdW23N0dNFlh3oAUoAwZGb+UhFzL/7K26csOb57yM5bvF9xJrLEObOkAAAACMlyWPTiSJ8bs9ECkUjg2DC1oTmdr/EIQEjnvY2+n4WQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABHnVW/IxwG7udMVuzmgVB/2xst6j9I5RArHNola8E49RPixdukLDvYMw2r2DTumX5VA1ifoAVfXgkOTnLswDEsb6evO+2606PWXzaqvJdDGxu+TC0vbg5HymAgNFL11htD/6J/XX9kp0wJsfKVh53ksJqzbfyd1RSzIap7OM5egLL/w6XaW4bMACKgDkMCO/P216VA/gUkRXFdMdFNW5YAUHAggJCQDjIkUV3+beAAoABQL0JgYACgAJA/ymAwAAAAAACwYAAQArDCABAQ03IA4AAgMEAQ8rDQ0QDSEOAwUREhMUIiMkJSAmDgUGFRYXGCcoKSUgKiAgLA4ZLSsGGgQbHB0eHy7BIJszQdacgQMDAAAAOGQAATlkAQIvAQBkAgNAQg8AAAAAADebflQBAAAAMgAAAll9OSuqqDQaRb6IYUBogcRuGRFfhgIEuha8cjU4fZPaCE6mCqEIBQYACwQRFAwNBwIJAQNYRSgzxt9mjqPDnIv4wQLLax/KAPQld+nhmgCbR8LsRmwHCgwBCAUDBwMCCQA=',
  scan: null,
  feeEstimatedInSol: '15000',
  tokenPrices: {
    [KnownCaip19Id.SolLocalnet]: {
      price: 200,
    },
  },
  tokenPricesFetchStatus: 'fetched',
};

// FIXME: OnKeyringRequest doesnt let us test the confirmation dialog
describe('Confirmation', () => {
  let mockSolanaRpc: MockSolanaRpc;

  beforeAll(() => {
    mockSolanaRpc = startMockSolanaRpc();
  });

  afterAll(() => {
    mockSolanaRpc.shutdown();
  });

  it('renders the confirmation dialog', async () => {
    const { mockResolvedResult, server } = mockSolanaRpc;

    server?.get(`/v3/spot-prices`, (_: any, res: any) => {
      return res.json({
        [KnownCaip19Id.SolLocalnet]: { price: 200 },
      });
    });

    const { onKeyringRequest, mockJsonRpc } = await installSnap();

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
      method: 'getFeeForMessage',
      result: MOCK_SOLANA_RPC_GET_FEE_FOR_MESSAGE_RESPONSE.result,
    });

    mockResolvedResult({
      method: 'getMultipleAccounts',
      result: MOCK_SOLANA_RPC_GET_MULTIPLE_ACCOUNTS_RESPONSE.result,
    });

    const response = await onKeyringRequest({
      origin: TEST_ORIGIN,
      method: KeyringRpcMethod.SubmitRequest,
      id: '4b445722-6766-4f99-ade5-c2c9295f21d0', // uuidv4
      params: {
        id: '4b445722-6766-4f99-ade5-c2c9295f21d0', // uuidv4
        scope: Network.Localnet,
        account: MOCK_SOLANA_KEYRING_ACCOUNT_0.id,
        request: {
          method: SolMethod.SendAndConfirmTransaction,
          params: {
            base64EncodedTransactionMessage:
              mockConfirmationContext.transaction,
          },
        },
      },
    });

    const screen1BeforeUpdate = await response.getInterface();

    expect(screen1BeforeUpdate).toRender(
      <Confirmation context={mockConfirmationContext} />,
    );
  });
});
