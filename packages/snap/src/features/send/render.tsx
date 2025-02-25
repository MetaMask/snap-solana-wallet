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
} from '../../core/utils/interface';
import {
  keyring,
  state,
  tokenPricesService,
  transactionHelper,
} from '../../snapContext';
import { Send } from './Send';
import type { SendContext } from './types';
import { SendCurrencyType } from './types';
import { getBalancesInScope } from './utils/getBalancesInScope';
import { StartSendTransactionFlowParamsStruct } from './views/SendForm/validation';

export const DEFAULT_SEND_CONTEXT: SendContext = {
  scope: Network.Mainnet,
  fromAccountId: '',
  amount: '',
  toAddress: '',
  feeEstimatedInSol: '0',
  feePaidInSol: '0',
  tokenCaipId: KnownCaip19Id.SolMainnet,
  accounts: [],
  currencyType: SendCurrencyType.TOKEN,
  validation: {},
  balances: {},
  assets: [],
  tokenPrices: {},
  tokenPricesFetchStatus: 'initial',
  tokenMetadata: {},
  preferences: {
    locale: 'en',
    currency: 'usd',
  },
  error: null,
  buildingTransaction: false,
  transactionMessage: null,
  transaction: null,
  stage: 'send-form',
  minimumBalanceForRentExemptionSol: '0.002', // Pessimistic default value. Will only be used if we cannot fetch the actual minimum balance for rent exemption.
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

  const tokenCaipId = Networks[scope].nativeToken.caip19Id;

  const context = {
    ...DEFAULT_SEND_CONTEXT,
    scope,
    fromAccountId: account,
    tokenCaipId,
  };

  const preferencesPromise = getPreferences().catch(
    () => DEFAULT_SEND_CONTEXT.preferences,
  );

  /**
   * 1. Get the current state (from snap)
   * 2. Get the accounts (from keyring)
   * 3. Get the preferences (from extension)
   * 4. Get the token metadata (from state)
   */
  const [currentState, accounts, preferences] = await Promise.all([
    state.get(),
    keyring.listAccounts(),
    preferencesPromise,
  ]);

  context.balances = getBalancesInScope({
    scope,
    balances: currentState.assets,
  });

  const accountBalances = currentState.assets[context.fromAccountId] ?? {};
  context.assets = Object.keys(accountBalances) as CaipAssetType[];

  context.accounts = accounts;
  context.preferences = preferences;
  context.tokenMetadata = currentState.metadata ?? {};

  const tokenPricesPromise = tokenPricesService
    .getMultipleTokenPrices(context.assets, context.preferences.currency)
    .then((prices) => {
      context.tokenPrices = prices;
      context.tokenPricesFetchStatus = 'fetched';
    })
    .catch(() => {
      context.tokenPricesFetchStatus = 'error';
    });

  const minimumBalanceForRentExemptionPromise = transactionHelper
    .getMinimumBalanceForRentExemption(scope)
    .then((balance) => {
      context.minimumBalanceForRentExemptionSol =
        lamportsToSol(balance).toString();
    })
    .catch(() => {
      // Do nothing, the value set on default context will be used.
    });

  /**
   * 5. Get the token prices (from api)
   */
  await Promise.all([
    tokenPricesPromise,
    minimumBalanceForRentExemptionPromise,
  ]);

  const id = await createInterface(<Send context={context} />, context);

  const dialogPromise = showDialog(id);

  await state.update((_state) => {
    return {
      ..._state,
      mapInterfaceNameToId: {
        ...(_state?.mapInterfaceNameToId ?? {}),
        [SEND_FORM_INTERFACE_NAME]: id,
      },
    };
  });

  return dialogPromise;
};
