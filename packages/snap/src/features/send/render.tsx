import type { CaipAssetType } from '@metamask/keyring-api';
import { type OnRpcRequestHandler } from '@metamask/snaps-sdk';
import { assert } from '@metamask/superstruct';

import { KnownCaip19Id, Network, Networks } from '../../core/constants/solana';
import { lamportsToSol } from '../../core/utils/conversion';
import {
  createInterface,
  getPreferences,
  SEND_FORM_INTERFACE_NAME,
  showDialog,
  updateInterface,
} from '../../core/utils/interface';
import {
  assetsService,
  connection,
  priceApiClient,
  state,
} from '../../snapContext';
import { Send } from './Send';
import type { SendContext } from './types';
import { SendCurrencyType } from './types';
import { getBalancesInScope } from './utils/getBalancesInScope';
import { StartSendTransactionFlowParamsStruct } from './views/SendForm/validation';

export const DEFAULT_SEND_CONTEXT: SendContext = {
  scope: Network.Mainnet,
  fromAccountId: '',
  fromDomain: null,
  amount: '',
  destinationAddressOrDomain: null,
  toDomain: null,
  toAddress: null,
  domainResolutionStatus: null,
  feeEstimatedInSol: '0',
  feePaidInSol: '0',
  tokenCaipId: KnownCaip19Id.SolMainnet,
  accounts: [],
  currencyType: SendCurrencyType.TOKEN,
  validation: {},
  balances: {},
  assets: [],
  tokenPrices: {},
  selectedTokenMetadata: null,
  tokenPricesFetchStatus: 'initial',
  preferences: {
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
  },
  error: null,
  buildingTransaction: false,
  transactionMessage: null,
  transaction: null,
  stage: 'send-form',
  minimumBalanceForRentExemptionSol: '0.002', // Pessimistic default value. Will only be used if we cannot fetch the actual minimum balance for rent exemption.
  loading: true,
};

/**
 * Renders the send form interface.
 *
 * @param params - The parameters for rendering the send form interface.
 * @param params.request - The request object.
 * @returns A promise that resolves when the interface is created.
 */
export const renderSend: OnRpcRequestHandler = async ({ request }) => {
  const { params } = request;
  assert(params, StartSendTransactionFlowParamsStruct);

  const { scope, account } = params;

  const tokenCaipId =
    (params.assetId as CaipAssetType) ?? Networks[scope].nativeToken.caip19Id;

  const context: SendContext = {
    ...DEFAULT_SEND_CONTEXT,
    scope,
    fromAccountId: account,
    tokenCaipId,
    loading: true,
  };

  const [stateValue, preferences] = await Promise.all([
    state.get(),
    getPreferences().catch(() => DEFAULT_SEND_CONTEXT.preferences),
  ]);

  const { assets, keyringAccounts, tokenPrices } = stateValue;

  context.balances = getBalancesInScope({
    scope,
    balances: assets,
  });

  const accountBalances = assets[context.fromAccountId] ?? {};
  context.assets = Object.keys(accountBalances) as CaipAssetType[];

  context.accounts = Object.values(keyringAccounts);
  context.preferences = preferences;
  context.tokenPrices = tokenPrices ?? {};
  context.fromDomain = keyringAccounts[context.fromAccountId]?.domain ?? null;

  const id = await createInterface(<Send context={context} />, context);

  const dialogPromise = showDialog(id);

  const tokenMetadataPromise = assetsService
    .getAssetsMetadata([context.tokenCaipId])
    .then((metadata) => {
      const tokenMetadata = metadata[context.tokenCaipId];

      if (!tokenMetadata?.symbol || !tokenMetadata?.name) {
        return;
      }

      context.selectedTokenMetadata = {
        symbol: tokenMetadata.symbol,
        name: tokenMetadata.name,
        asset: context.tokenCaipId,
        imageSvg: null,
      };
    })
    .catch(() => null);

  let tokenPricesPromise;

  if (context.preferences.useExternalPricingData) {
    tokenPricesPromise = priceApiClient
      .getMultipleSpotPrices(context.assets, context.preferences.currency)
      .then((prices) => {
        context.tokenPrices = {
          ...context.tokenPrices,
          ...prices,
        };
        context.tokenPricesFetchStatus = 'fetched';
      })
      .catch(() => {
        context.tokenPricesFetchStatus = 'error';
      });
  } else {
    context.tokenPricesFetchStatus = 'fetched';
  }

  const minimumBalanceForRentExemptionPromise = connection
    .getRpc(scope)
    .getMinimumBalanceForRentExemption(BigInt(0))
    .send()
    .then((balance) => {
      context.minimumBalanceForRentExemptionSol =
        lamportsToSol(balance).toString();
    })
    .catch(() => {
      // Do nothing, the value set on default context will be used.
    });

  context.loading = true;

  await updateInterface(id, <Send context={context} />, context);

  // eslint-disable-next-line require-atomic-updates
  context.loading = false;

  /**
   * 6. Refresh token prices (from api)
   * 7. Get selected token metadata (from api)
   * 8. Get the minimum balance for rent exemption (from api)
   */
  await Promise.all([
    tokenPricesPromise,
    tokenMetadataPromise,
    minimumBalanceForRentExemptionPromise,
  ]);

  await updateInterface(id, <Send context={context} />, context);

  await state.setKey(`mapInterfaceNameToId.${SEND_FORM_INTERFACE_NAME}`, id);

  return dialogPromise;
};
