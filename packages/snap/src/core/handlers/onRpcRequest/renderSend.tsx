import type { Balance } from '@metamask/keyring-api';
import type { OnRpcRequestHandler } from '@metamask/snaps-sdk';
import { assert } from 'superstruct';

import { Send } from '../../../features/send/Send';
import type { SendContext } from '../../../features/send/types';
import { SendCurrency } from '../../../features/send/types';
import { StartSendTransactionFlowParamsStruct } from '../../../features/send/views/SendForm/validation';
import { keyring, state } from '../../../snap-context';
import {
  SolanaCaip19Tokens,
  SolanaCaip2Networks,
} from '../../constants/solana';
import { DEFAULT_TOKEN_PRICES } from '../../services/state';
import {
  createInterface,
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
  fee: '0.000005',
  accounts: [],
  currencySymbol: SendCurrency.SOL,
  validation: {},
  balances: {},
  tokenPrices: DEFAULT_TOKEN_PRICES,
  locale: 'en',
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

  const token = `${scope}/${SolanaCaip19Tokens.SOL}`;

  const context = { ...DEFAULT_SEND_CONTEXT, scope, fromAccountId: account };

  const accounts = await keyring.listAccounts();
  context.accounts = accounts;

  const id = await createInterface(<Send context={context} />, context);

  const dialogPromise = showDialog(id);

  const preferencesPromise = getPreferences()
    .then((preferences) => preferences.locale)
    .catch(() => DEFAULT_SEND_CONTEXT.locale);

  const getBalancesPromise = async () => {
    const balances: Record<string, Balance> = {};
    const promises = accounts.map(async (_account) =>
      keyring
        .getAccountBalances(_account.id, [token])
        .then((response) => {
          if (response[token]) {
            balances[_account.id] = response[token];
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

  const [locale, balances] = await Promise.all([
    preferencesPromise,
    getBalancesPromise(),
  ]);

  context.locale = locale;
  context.balances = balances;

  await updateInterface(id, <Send context={context} />, context);

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
