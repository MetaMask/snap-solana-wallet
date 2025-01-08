import type { Balance } from '@metamask/keyring-api';
import type { OnRpcRequestHandler } from '@metamask/snaps-sdk';
import { assert } from 'superstruct';

import { Send } from '../../../features/send/Send';
import type { SendContext } from '../../../features/send/types';
import { SendCurrency } from '../../../features/send/types';
import { StartSendTransactionFlowParamsStruct } from '../../../features/send/views/SendForm/validation';
import {
  keyring,
  state,
  tokenPricesService,
  assetsService,
} from '../../../snap-context';
import {
  SOL_TRANSFER_FEE_LAMPORTS,
  SolanaCaip2Networks,
} from '../../constants/solana';
import { DEFAULT_TOKEN_PRICES } from '../../services/state';
import { lamportsToSol } from '../../utils/conversion';
import {
  createInterface,
  getInterfaceContext,
  getPreferences,
  SEND_FORM_INTERFACE_NAME,
  showDialog,
  updateInterface,
} from '../../utils/interface';
import logger from '../../utils/logger';

export const DEFAULT_SEND_CONTEXT: SendContext = {
  scope: SolanaCaip2Networks.Mainnet,
  fromAccountId: '',
  amount: '',
  toAddress: '',
  feeEstimatedInSol: lamportsToSol(SOL_TRANSFER_FEE_LAMPORTS).toString(),
  feePaidInSol: '0',
  accounts: [],
  currencySymbol: SendCurrency.SOL,
  validation: {},
  balances: {},
  tokenPrices: DEFAULT_TOKEN_PRICES,
  preferences: {
    locale: 'en',
    currency: 'usd',
  },
  transaction: null,
  stage: 'send-form',
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

  const context = { ...DEFAULT_SEND_CONTEXT, scope, fromAccountId: account };

  const preferencesPromise = getPreferences().catch(
    () => DEFAULT_SEND_CONTEXT.preferences,
  );

  const [accounts, preferences] = await Promise.all([
    keyring.listAccounts(),
    preferencesPromise,
  ]);

  context.accounts = accounts;
  context.preferences = preferences;

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

  const getBalancesPromise = async () => {
    const balances: Record<string, Balance> = {};
    const promises = accounts.map(async (_account) =>
      assetsService
        .getNativeAsset(_account.address, scope)
        .then((response) => {
          if (response) {
            balances[_account.id] = {
              amount: lamportsToSol(response.balance).toString(),
              unit: response?.metadata?.symbol ?? '',
            };
          }
        })
        .catch((error) => {
          logger.error(
            { error },
            `Could not fetch balances for account ${_account.id}`,
          );
        }),
    );
    await Promise.all(promises);
    return balances;
  };

  const pricesPromise = tokenPricesService
    .refreshPrices(id)
    .catch(() => DEFAULT_TOKEN_PRICES);

  const [balances, tokenPrices, updatedContextFromInterface] =
    await Promise.all([
      getBalancesPromise(),
      pricesPromise,
      getInterfaceContext(id),
    ]);

  const updatedContext = { ...context, ...updatedContextFromInterface };

  updatedContext.balances = balances;
  updatedContext.tokenPrices = tokenPrices;

  await updateInterface(id, <Send context={updatedContext} />, updatedContext);

  return dialogPromise;
};
