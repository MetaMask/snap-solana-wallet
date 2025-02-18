import { SolMethod } from '@metamask/keyring-api';

import { Network, Networks, SOL_IMAGE_URL } from '../../core/constants/solana';
import { SOL_IMAGE_SVG } from '../../core/test/mocks/solana-image-svg';
import { lamportsToSol } from '../../core/utils/conversion';
import {
  createInterface,
  getPreferences,
  showDialog,
  updateInterface,
} from '../../core/utils/interface';
import {
  tokenMetadataService,
  tokenPricesService,
  transactionHelper,
  transactionScanService,
} from '../../snapContext';
import { Confirmation } from './Confirmation';
import type { ConfirmationContext } from './types';

const ICON_SIZE = 16;

export const DEFAULT_CONFIRMATION_CONTEXT: ConfirmationContext = {
  method: SolMethod.SendAndConfirmTransaction,
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
 * Renders the confirmation dialog.
 *
 * @param incomingContext - The confirmation context.
 * @returns The confirmation dialog.
 */
export async function renderConfirmation(incomingContext: ConfirmationContext) {
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

  await Promise.all([preferencesPromise]);

  const id = await createInterface(<Confirmation context={context} />, context);

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
    <Confirmation context={updatedContext1} />,
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
      method: 'signAndSendTransaction',
      accountAddress: updatedContext2.account?.address ?? '',
      transaction: updatedContext2.transaction,
      scope: updatedContext2.scope,
    })
    .then(async (scan) => {
      updatedContext2.scanFetchStatus = 'fetched';
      updatedContext2.scan = scan;
      // Fetch asset images and add it to the scan object

      if (!scan?.estimatedChanges?.assets) {
        return;
      }

      const updatedScan = { ...scan };

      const transactionScanIconPromises = scan?.estimatedChanges?.assets.map(
        async (asset, index) => {
          const { logo } = asset;

          if (logo) {
            return tokenMetadataService
              .generateImageComponent(logo, ICON_SIZE, ICON_SIZE)
              .then((image) => {
                if (image && updatedScan?.estimatedChanges?.assets?.[index]) {
                  updatedScan.estimatedChanges.assets[index].imageSvg = image;
                }
              })
              .catch(() => {
                return null;
              });
          }

          return undefined;
        },
      );

      await Promise.all(transactionScanIconPromises ?? []);

      updatedContext2.scan = updatedScan;
    })
    .catch(() => {
      updatedContext2.scan = null;
      updatedContext2.scanFetchStatus = 'error';
    });

  await Promise.all([transactionScanPromise]);

  await updateInterface(
    id,
    <Confirmation context={updatedContext2} />,
    updatedContext2,
  );

  return dialogPromise;
}
