import { SolMethod } from '@metamask/keyring-api';

import { Network, Networks } from '../../core/constants/solana';
import { addressToCaip10 } from '../../core/utils/addressToCaip10';
import {
  createInterface,
  getPreferences,
  showDialog,
  updateInterface,
} from '../../core/utils/interface';
import { tokenPricesService } from '../../snapContext';
import { Confirmation } from './Confirmation';
import type { ConfirmationContext } from './types';

export const DEFAULT_CONFIRMATION_CONTEXT: ConfirmationContext = {
  method: SolMethod.SendAndConfirmTransaction,
  scope: Network.Mainnet,
  account: null,
  transaction: '',
  scan: null,
  feeEstimatedInSol: '0',
  tokenPrices: {},
  tokenPricesFetchStatus: 'fetching',
  preferences: {
    locale: 'en',
    currency: 'usd',
  },
  advanced: {
    shown: false,
    instructions: [],
  },
};

/**
 * Renders the confirmation dialog.
 *
 * @param incomingContext - The confirmation context.
 * @returns The confirmation dialog.
 */
export async function renderConfirmation(incomingContext: ConfirmationContext) {
  const context = {
    ...DEFAULT_CONFIRMATION_CONTEXT,
    ...incomingContext,
    preferences: await getPreferences().catch(
      () => DEFAULT_CONFIRMATION_CONTEXT.preferences,
    ),
  };

  const assets = [Networks[context.scope].nativeToken.caip19Id];

  const id = await createInterface(<Confirmation context={context} />, context);

  const updatedContext = {
    ...context,
  };

  const tokenPricesPromise = tokenPricesService
    .getMultipleTokenPrices(assets, context.preferences.currency)
    .then((prices) => {
      updatedContext.tokenPrices = prices;
      updatedContext.tokenPricesFetchStatus = 'fetched';
    })
    .catch(() => {
      updatedContext.tokenPricesFetchStatus = 'error';
    });

  await Promise.all([tokenPricesPromise]);

  await updateInterface(
    id,
    <Confirmation context={updatedContext} />,
    updatedContext,
  );

  return showDialog(id);
}
