import type { Balance } from '@metamask/keyring-api';
import { type OnRpcRequestHandler } from '@metamask/snaps-sdk';
import { assert } from 'superstruct';

import { Send } from '../../../features/send/Send';
import type { SendContext } from '../../../features/send/types';
import { SendCurrencyType } from '../../../features/send/types';
import { StartSendTransactionFlowParamsStruct } from '../../../features/send/views/SendForm/validation';
import {
  keyring,
  state,
  tokenMetadataService,
  tokenPricesService,
} from '../../../snapContext';
import type { SolanaTokenMetadata } from '../../clients/token-metadata-client/types';
import {
  Caip19Id,
  Network,
  Networks,
  SOL_TRANSFER_FEE_LAMPORTS,
} from '../../constants/solana';
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
  scope: Network.Mainnet,
  fromAccountId: '',
  amount: '',
  toAddress: '',
  feeEstimatedInSol: lamportsToSol(SOL_TRANSFER_FEE_LAMPORTS).toString(),
  feePaidInSol: '0',
  tokenCaipId: Caip19Id.SolMainnet,
  accounts: [],
  currencyType: SendCurrencyType.TOKEN,
  validation: {},
  balances: {},
  assets: [],
  tokenPrices: {},
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

  /**
   * First render:
   * - Default context
   * - Accounts
   * - Preferences
   */
  const context1 = {
    ...DEFAULT_SEND_CONTEXT,
    scope,
    fromAccountId: account,
    tokenCaipId,
  };

  const preferencesPromise = getPreferences().catch(
    () => DEFAULT_SEND_CONTEXT.preferences,
  );

  const [accounts, preferences] = await Promise.all([
    keyring.listAccounts(),
    preferencesPromise,
  ]);

  context1.accounts = accounts;
  context1.preferences = preferences;

  const id = await createInterface(<Send context={context1} />, context1);

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

  /**
   * Second render:
   * - Balances
   * - Assets
   */

  const getAccountsAssetBalances = async () => {
    const balances: Record<string, Record<string, Balance>> = {};
    const assets: Set<string> = new Set();

    const promises = accounts.map(async ({ id: accountId }) => {
      try {
        const accountAssets = await keyring.listAccountAssets(accountId);
        const accountAssetsFromCurrentScope = accountAssets.filter((caipId) =>
          caipId.startsWith(scope),
        );

        accountAssetsFromCurrentScope.forEach((asset) => {
          assets.add(asset);
        });

        const accountBalances = await keyring.getAccountBalances(
          accountId,
          accountAssetsFromCurrentScope,
        );

        balances[accountId] = accountBalances;
      } catch (error) {
        balances[accountId] = {};
        logger.error(
          { error },
          `Could not fetch balances for account ${accountId}`,
        );
      }
    });

    await Promise.all(promises);

    return {
      balances,
      assets,
    };
  };

  const { assets, balances } = await getAccountsAssetBalances();

  const context1FromInterface = await getInterfaceContext(id);

  const context2 = { ...context1, ...context1FromInterface };

  context2.assets = Array.from(assets);
  context2.balances = balances;

  await updateInterface(id, <Send context={context2} />, context2);

  /**
   * Thrid render:
   * - Token prices
   * - Token metadata + images
   */

  const tokenPricesPromise = tokenPricesService
    .getMultipleTokenPrices(context2.assets, context2.preferences.currency)
    .catch(() => ({}));

  const tokenMetadataPromise = tokenMetadataService
    .getMultipleTokenMetadata(context2.assets, context2.scope)
    .then((metadata) => metadata)
    .catch(() => ({} as Record<string, SolanaTokenMetadata>));

  const [tokenPrices, tokenMetadata] = await Promise.all([
    tokenPricesPromise,
    tokenMetadataPromise,
  ]);

  const context2FromInterface = await getInterfaceContext(id);
  const context3 = {
    ...context2,
    ...context2FromInterface,
  };

  context3.tokenPrices = tokenPrices;
  context3.tokenMetadata = tokenMetadata;

  await updateInterface(id, <Send context={context3} />, context3);

  return dialogPromise;
};
