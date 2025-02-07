import { KeyringRpcMethod, SolMethod } from '@metamask/keyring-api';
import { installSnap } from '@metamask/snaps-jest';

import { Caip19Id, Network } from '../../core/constants/solana';
import { MOCK_SOLANA_RPC_GET_FEE_FOR_MESSAGE_RESPONSE } from '../../core/services/mocks/mockSolanaRpcResponses';
import {
  MOCK_SOLANA_KEYRING_ACCOUNT_0,
  MOCK_SOLANA_KEYRING_ACCOUNT_1,
} from '../../core/test/mocks/solana-keyring-accounts';
import {
  type MockSolanaRpc,
  startMockSolanaRpc,
} from '../../core/test/mocks/startMockSolanaRpc';
import { TEST_ORIGIN } from '../../core/test/utils';
import { DEFAULT_CONFIRMATION_CONTEXT } from './renderConfirmation';
import type { ConfirmationContext } from './types';

const mockConfirmationContext: ConfirmationContext = {
  ...DEFAULT_CONFIRMATION_CONTEXT,
  scope: Network.Localnet,
  account: MOCK_SOLANA_KEYRING_ACCOUNT_0,
  transaction:
    'AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAQAKD790BPMeQxbCdwSbyC2lv/FG3wE/28MLN5GTUYRikvRDkOL72EsPrSrrKZF33sPiMFwhF786GU/O6Np6ngUZdtMjqo7S3idbRg4oDnEPLya1vPuQf89zrLobei3jVynGDckPtHsyvKRD5kG18GfE89zudv2AAqE9tL9IhOAOw9W0RxnJjereNbC1ST5c1Ecpf6D2O2jh58j+LmrO+1djreYoPQ3SgjVP7wrjsOIn03zYnKJm+xfd+PfLfM775OvcVQan1RcYx3TJKFZjmGkdXraLXrijm0ttXHNVWyEAAAAAXRiZ/3+jOPdJE967sYVyjzFslS7Pv8klUvUrYsNfgIwDBkZv5SEXMv/srbpyw5vnvIzlu8X3EmssQ5s6QAAAAIyXJY9OJInxuz0QKRSODYMLWhOZ2v8QhASOe9jb6fhZvAfFbmCtPT8Xc4LqxlSPuh/TLP2QygKz58+hhf3Oc5gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAR51VvyMcBu7nTFbs5oFQf9sbLeo/SOUQKxzaJWvBOPgpflRP9EQGoTt/pkws/6PsbhXfiTXgDHQXDervAT8320P/on9df2SnTAmx8pWHneSwmrNt/J3VFLMhqns4zl6JeOC0XV7uuM/X6Tg1gcX4QcONGcnQjcoqMnS3Xo5rlqBQUCBgcJABCTcUBLNgMACAAFAriBFgAIAAkD+PYCAAAAAAAJBgABAAoLFwEBDCEXDQACAwQBGAoMDA4MGQ8QERITAwQNFxobDRQVFgQDFxopwSCbM0HWnIEGAgAAAEMyAAI9ATIAAgDKmjsAAAAAe18oPuIEAAAyAAACWD3XVG/asrsC2JVrP/34ePBaOw2eQrlkG73z55rz95IFNEswMTIEDTwzTbg5ybz1lV0THKePgXJxVjhOuM+rVRVuJmkK/QBsDtEfAxobHAEd',
  scan: null,
  feeEstimatedInSol: '15000',
  tokenPrices: {
    [Caip19Id.SolLocalnet]: {
      price: 200,
    },
  },
  tokenPricesFetchStatus: 'fetched',
};

// FIXME: OnKeyringRequest doesnt let us test the confirmation dialog
describe.skip('Confirmation', () => {
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
        [Caip19Id.SolLocalnet]: { price: 200 },
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

    const response = await onKeyringRequest({
      origin: TEST_ORIGIN,
      method: KeyringRpcMethod.SubmitRequest,
      params: {
        id: MOCK_SOLANA_KEYRING_ACCOUNT_0.id,
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

    // const screen1BeforeUpdate = await response.response.getInterface();

    // expect(screen1BeforeUpdate).toRender(
    //   <Confirmation context={mockConfirmationContext} />,
    // );
  });
});
