import { SolMethod } from '@metamask/keyring-api';
import { assert } from '@metamask/superstruct';
import { getBase64Codec, getUtf8Codec } from '@solana/web3.js';

import { Network, Networks } from '../../core/constants/solana';
import type { SolanaKeyringAccount } from '../../core/handlers/onKeyringRequest/Keyring';
import type { SolanaKeyringRequest } from '../../core/handlers/onKeyringRequest/structs';
import {
  SolanaSignInRequestStruct,
  SolanaSignMessageRequestStruct,
} from '../../core/services/wallet/structs';
import { SOL_IMAGE_SVG } from '../../core/test/mocks/solana-image-svg';
import { lamportsToSol } from '../../core/utils/conversion';
import { FALLBACK_LANGUAGE } from '../../core/utils/i18n';
import { parseInstructions } from '../../core/utils/instructions';
import {
  CONFIRM_SIGN_AND_SEND_TRANSACTION_INTERFACE_NAME,
  createInterface,
  getPreferences,
  showDialog,
  updateInterface,
} from '../../core/utils/interface';
import {
  state,
  tokenPricesService,
  transactionHelper,
  transactionScanService,
} from '../../snapContext';
import type { ConfirmationContext } from './types';
import { ConfirmSignAndSendTransaction } from './views/ConfirmSignAndSendTransaction/ConfirmSignAndSendTransaction';
import type { ConfirmSignInProps } from './views/ConfirmSignIn/ConfirmSignIn';
import { ConfirmSignIn } from './views/ConfirmSignIn/ConfirmSignIn';
import { ConfirmSignMessage } from './views/ConfirmSignMessage/ConfirmSignMessage';

export const DEFAULT_CONFIRMATION_CONTEXT: ConfirmationContext = {
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
  },
  advanced: {
    shown: false,
    instructions: [],
  },
};

/**
 * Renders the confirmation dialog for a sign and send transaction.
 *
 * @param incomingContext - The confirmation context.
 * @returns The confirmation dialog.
 */
export async function renderConfirmSignAndSendTransaction(
  incomingContext: ConfirmationContext,
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
    .base64DecodeTransaction(context.transaction, context.scope)
    .then((transaction) => {
      context.advanced.instructions = parseInstructions(
        transaction.instructions,
      );
    })
    .catch((error) => {
      console.error(error);
      context.advanced.instructions = [];
    });

  await Promise.all([preferencesPromise, instructionsPromise]);

  const id = await createInterface(
    <ConfirmSignAndSendTransaction context={context} />,
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

  const transactionMessage =
    await transactionHelper.base64EncodeTransactionMessageFromBase64EncodedTransaction(
      context.transaction,
    );

  const assets = [Networks[context.scope].nativeToken.caip19Id];

  const tokenPricesPromise = tokenPricesService
    .getMultipleTokenPrices(assets, context.preferences.currency)
    .then((prices) => {
      updatedContext1.tokenPrices = prices;
      updatedContext1.tokenPricesFetchStatus = 'fetched';
    })
    .catch(() => {
      updatedContext1.tokenPricesFetchStatus = 'error';
    });

  const transactionFeePromise = transactionHelper
    .getFeeForMessageInLamports(transactionMessage, updatedContext1.scope)
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
    <ConfirmSignAndSendTransaction context={updatedContext1} />,
    updatedContext1,
  );

  /**
   * Third render:
   * - Scan transaction
   */
  const updatedContext2 = {
    ...updatedContext1,
  };

  const transactionScanPromise = transactionScanService
    .scanTransaction({
      method: updatedContext2.method,
      accountAddress: updatedContext2.account?.address ?? '',
      transaction: updatedContext2.transaction,
      scope: updatedContext2.scope,
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

  await updateInterface(
    id,
    <ConfirmSignAndSendTransaction context={updatedContext2} />,
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

/**
 * Renders the confirmation dialog for a sign message.
 *
 * @param request - The request to confirm.
 * @param account - The account that the request is for.
 * @returns The confirmation dialog.
 */
export async function renderConfirmSignMessage(
  request: SolanaKeyringRequest,
  account: SolanaKeyringAccount,
) {
  assert(request.request, SolanaSignMessageRequestStruct);

  const {
    request: {
      params: { message: messageBase64 },
    },
    scope,
  } = request;

  const messageBytes = getBase64Codec().encode(messageBase64);
  const messageUtf8 = getUtf8Codec().decode(messageBytes);

  const locale = await getPreferences()
    .then((preferences) => {
      return preferences.locale;
    })
    .catch(() => FALLBACK_LANGUAGE);

  const id = await createInterface(
    <ConfirmSignMessage
      message={messageUtf8}
      account={account}
      scope={scope}
      locale={locale}
      networkImage={SOL_IMAGE_SVG}
    />,
    {},
  );

  const dialogPromise = showDialog(id);

  return dialogPromise;
}

/**
 * Renders the confirmation dialog for a sign in request.
 *
 * @param request - The request to confirm.
 * @param account - The account that the request is for.
 * @returns The confirmation dialog.
 */
export async function renderConfirmSignIn(
  request: SolanaKeyringRequest,
  account: SolanaKeyringAccount,
) {
  assert(request.request, SolanaSignInRequestStruct);

  const {
    request: { params },
    scope,
  } = request;

  const preferences = await getPreferences();

  const id = await createInterface(
    <ConfirmSignIn
      params={params as ConfirmSignInProps['params']}
      account={account}
      scope={scope}
      preferences={preferences}
      networkImage={SOL_IMAGE_SVG}
    />,
    {},
  );

  const dialogPromise = showDialog(id);

  return dialogPromise;
}
