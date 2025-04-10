import { SolMethod } from '@metamask/keyring-api';

import { Network, Networks } from '../../../../core/constants/solana';
import { SOL_IMAGE_SVG } from '../../../../core/test/mocks/solana-image-svg';
import { lamportsToSol } from '../../../../core/utils/conversion';
import { parseInstructions } from '../../../../core/utils/instructions';
import {
  CONFIRM_SIGN_AND_SEND_TRANSACTION_INTERFACE_NAME,
  createInterface,
  getPreferences,
  showDialog,
  updateInterface,
} from '../../../../core/utils/interface';
import {
  priceApiClient,
  state,
  transactionHelper,
  transactionScanService,
} from '../../../../snapContext';
import { ConfirmTransactionRequest } from './ConfirmTransactionRequest';
import type { ConfirmTransactionRequestContext } from './types';

export const DEFAULT_CONFIRMATION_CONTEXT: ConfirmTransactionRequestContext = {
  method: SolMethod.SignAndSendTransaction,
  scope: Network.Mainnet,
  networkImage: SOL_IMAGE_SVG,
  account: null,
  transaction: '',
  scan: null,
  scanFetchStatus: 'fetching',
  feeEstimatedInSol: '0',
  tokenPrices: {},
  tokenPricesFetchStatus: 'fetching',
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
  advanced: {
    shown: false,
    instructions: [],
  },
};

/**
 * Renders the confirmation dialog for a transaction request.
 *
 * @param incomingContext - The confirmation context.
 * @returns The confirmation dialog.
 */
export async function render(
  incomingContext: ConfirmTransactionRequestContext,
) {
  /**
   * First render:
   * - Get preferences
   */
  const context = {
    ...DEFAULT_CONFIRMATION_CONTEXT,
    ...incomingContext,
  };

  const preferencesPromise = getPreferences()
    .then((preferences) => {
      context.preferences = preferences;
    })
    .catch(() => {
      context.preferences = DEFAULT_CONFIRMATION_CONTEXT.preferences;
    });

  const instructionsPromise = transactionHelper
    .extractInstructionsFromUnknownBase64String(
      context.transaction,
      context.scope,
    )
    .then((instructions) => {
      context.advanced.instructions = parseInstructions(instructions);
    })
    .catch((error) => {
      console.error(error);
      context.advanced.instructions = [];
    });

  await Promise.all([preferencesPromise, instructionsPromise]);
  const {
    currency,
    useExternalPricingData,
    useSecurityAlerts,
    simulateOnChainActions,
  } = context.preferences;

  const id = await createInterface(
    <ConfirmTransactionRequest context={context} />,
    context,
  );

  const dialogPromise = showDialog(id);

  /**
   * Second render:
   * - Get token prices
   * - Get transaction fee
   */
  const updatedContext1 = {
    ...context,
  };

  const assets = [Networks[context.scope].nativeToken.caip19Id];

  let tokenPricesPromise;

  if (useExternalPricingData) {
    tokenPricesPromise = priceApiClient
      .getMultipleSpotPrices(assets, currency)
      .then((prices) => {
        updatedContext1.tokenPrices = prices;
        updatedContext1.tokenPricesFetchStatus = 'fetched';
      })
      .catch(() => {
        updatedContext1.tokenPricesFetchStatus = 'error';
      });
  } else {
    updatedContext1.tokenPricesFetchStatus = 'fetched';
    updatedContext1.tokenPrices = {};
  }

  const transactionFeePromise = transactionHelper
    .getFeeFromBase64StringInLamports(
      context.transaction,
      updatedContext1.scope,
    )
    .then((feeInLamports) => {
      updatedContext1.feeEstimatedInSol = feeInLamports
        ? lamportsToSol(feeInLamports).toString()
        : null;
    })
    .catch(() => {
      updatedContext1.feeEstimatedInSol = null;
    });

  await Promise.all([tokenPricesPromise, transactionFeePromise]);

  await updateInterface(
    id,
    <ConfirmTransactionRequest context={updatedContext1} />,
    updatedContext1,
  );

  /**
   * Third render:
   * - Scan transaction
   */
  const updatedContext2 = {
    ...updatedContext1,
  };

  const options = [];

  if (simulateOnChainActions) {
    options.push('simulation');
  }

  if (useSecurityAlerts) {
    options.push('validation');
  }

  if (simulateOnChainActions || useSecurityAlerts) {
    const transactionScanPromise = transactionScanService
      .scanTransaction({
        method: updatedContext2.method,
        accountAddress: updatedContext2.account?.address ?? '',
        transaction: updatedContext2.transaction,
        scope: updatedContext2.scope,
        options,
      })
      .then(async (scan) => {
        updatedContext2.scanFetchStatus = 'fetched';
        updatedContext2.scan = scan;
      })
      .catch(() => {
        updatedContext2.scan = null;
        updatedContext2.scanFetchStatus = 'error';
      });

    await Promise.all([transactionScanPromise]);
  } else {
    updatedContext2.scanFetchStatus = 'fetched';
    updatedContext2.scan = null;
  }

  await updateInterface(
    id,
    <ConfirmTransactionRequest context={updatedContext2} />,
    updatedContext2,
  );

  await state.update((_state) => {
    return {
      ..._state,
      mapInterfaceNameToId: {
        ...(_state?.mapInterfaceNameToId ?? {}),
        [CONFIRM_SIGN_AND_SEND_TRANSACTION_INTERFACE_NAME]: id,
      },
    };
  });

  return dialogPromise;
}
