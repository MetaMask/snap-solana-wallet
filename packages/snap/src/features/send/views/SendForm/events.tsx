import type { InputChangeEvent } from '@metamask/snaps-sdk';
import BigNumber from 'bignumber.js';
import { merge } from 'lodash';

import { METAMASK_ORIGIN, Networks } from '../../../../core/constants/solana';
import { ScheduleBackgroundEventMethod } from '../../../../core/handlers/onCronjob/backgroundEvents/ScheduleBackgroundEventMethod';
import { buildUrl } from '../../../../core/utils/buildUrl';
import {
  lamportsToSol,
  solToLamports,
} from '../../../../core/utils/conversion';
import { i18n } from '../../../../core/utils/i18n';
import {
  resolveInterface,
  SEND_FORM_INTERFACE_NAME,
  updateInterface,
} from '../../../../core/utils/interface';
import { tokenToFiat } from '../../../../core/utils/tokenToFiat';
import {
  configProvider,
  nameResolutionService,
  priceApiClient,
  sendSolBuilder,
  sendSplTokenBuilder,
  state,
  tokenMetadataService,
} from '../../../../snapContext';
import { getBalance, getIsNativeToken } from '../../selectors';
import { Send } from '../../Send';
import { SendFeeCalculator } from '../../transactions/SendFeeCalculator';
import { SendCurrencyType, SendFormNames, type SendContext } from '../../types';
import { buildTransactionMessageAndUpdateInterface } from '../../utils/buildTransactionMessageAndUpdateInterface';
import { isSolanaDomain } from '../../utils/isSolanaDomain';
import { sendFieldsAreValid, validateField } from '../../validation/form';
import { validation } from './validation';

/**
 * Handles the click event for the back button.
 *
 * @param params - The parameters for the function.
 * @param params.id - The id of the interface.
 * @returns A promise that resolves when the operation is complete.
 */
async function onBackButtonClick({ id }: { id: string }) {
  await resolveInterface(id, false);
  await state.deleteKey(`mapInterfaceNameToId.${SEND_FORM_INTERFACE_NAME}`);
}

/**
 * Handles the change event for the source account selector.
 *
 * @param params - The parameters for the function.
 * @param params.id - The id of the interface.
 * @param params.event - The change event.
 * @param params.context - The send context.
 * @returns A promise that resolves when the operation is complete.
 */
async function onSourceAccountSelectorValueChange({
  id,
  event,
  context,
}: {
  id: string;
  event: InputChangeEvent;
  context: SendContext;
}) {
  context.fromAccountId = event.value as string;
  context.error = null;
  context.validation[SendFormNames.SourceAccountSelector] =
    validateField<SendFormNames>(
      SendFormNames.SourceAccountSelector,
      context.fromAccountId,
      validation(context),
    );

  if (context.amount) {
    context.validation[SendFormNames.AmountInput] =
      validateField<SendFormNames>(
        SendFormNames.AmountInput,
        context.amount,
        validation(context),
      );
  }

  await updateInterface(id, <Send context={context} />, context);

  await buildTransactionMessageAndUpdateInterface(id, context);
}

/**
 * Handles the change event for the amount input.
 * @param params - The parameters for the function.
 * @param params.id - The id of the interface.
 * @param params.event - The change event.
 * @param params.context - The send context.
 */
async function onAmountInputChange({
  id,
  event,
  context,
}: {
  id: string;
  event: InputChangeEvent;
  context: SendContext;
}) {
  const updatedContext = { ...context };

  updatedContext.amount = event.value as string;
  updatedContext.error = null;

  const amountFieldValidation = validateField<SendFormNames>(
    SendFormNames.AmountInput,
    updatedContext.amount,
    validation(updatedContext),
  );

  if (
    amountFieldValidation &&
    updatedContext.validation[SendFormNames.AmountInput]?.message !==
      amountFieldValidation?.message
  ) {
    updatedContext.validation[SendFormNames.AmountInput] =
      amountFieldValidation;
    await updateInterface(
      id,
      <Send context={updatedContext} />,
      updatedContext,
    );

    return;
  }

  if (amountFieldValidation === null) {
    updatedContext.validation[SendFormNames.AmountInput] = null;
    await updateInterface(
      id,
      <Send context={updatedContext} />,
      updatedContext,
    );
    await buildTransactionMessageAndUpdateInterface(id, updatedContext);
  }
}

/**
 * Handles the change event for the asset selector.
 *
 * @param params - The parameters for the function.
 * @param params.id - The id of the interface.
 * @param params.event - The change event.
 * @param params.context - The send context.
 * @returns A promise that resolves when the operation is complete.
 */
async function onAssetSelectorValueChange({
  id,
  event,
  context,
}: {
  id: string;
  event: InputChangeEvent;
  context: SendContext;
}) {
  if (typeof event.value !== 'object' || !('asset' in event.value)) {
    return;
  }

  const caipAssetType = event.value.asset;

  const isSameSelectedAsset = context.tokenCaipId === caipAssetType;

  if (isSameSelectedAsset) {
    return;
  }

  const builder =
    caipAssetType === Networks[context.scope].nativeToken.caip19Id
      ? sendSolBuilder
      : sendSplTokenBuilder;

  const sendFeeCalculator = new SendFeeCalculator(builder);
  const feeInLamports = sendFeeCalculator.getFee();
  const feeEstimatedInSol = lamportsToSol(feeInLamports).toString();

  const contextUpdates: Partial<SendContext> = {
    tokenCaipId: caipAssetType,
    feeEstimatedInSol,
    selectedTokenMetadata: {
      symbol: event.value.symbol,
      name: event.value.name,
      asset: event.value.asset,
      imageSvg: null,
    },
    amount: '',
    error: null,
  };

  const newContext = merge(context, contextUpdates);

  await updateInterface(
    id,
    <Send context={newContext} inputAmount={''} />,
    newContext,
  );

  await buildTransactionMessageAndUpdateInterface(id, context);
}

/**
 * Handles the click event for the swap currency button.
 * @param params - The parameters for the function.
 * @param params.id - The id of the interface.
 * @param params.context - The send context.
 */
async function onSwapCurrencyButtonClick({
  id,
  context,
}: {
  id: string;
  context: SendContext;
}) {
  context.error = null;
  context.currencyType =
    context.currencyType === SendCurrencyType.TOKEN
      ? SendCurrencyType.FIAT
      : SendCurrencyType.TOKEN;

  if (!context.amount) {
    // if the amount is empty we dont need to update amount
    await updateInterface(id, <Send context={context} />, context);
    return;
  }

  const currentAmount = BigNumber(context.amount ?? '0');

  const { price } = context.tokenPrices[context.tokenCaipId] ?? { price: 0 };

  // If we switched to TOKEN, divide by currency rate
  if (context.currencyType === SendCurrencyType.TOKEN) {
    context.amount = currentAmount.dividedBy(price).toString();
  }

  // If the currency is USD, adjust the amount
  if (context.currencyType === SendCurrencyType.FIAT) {
    context.amount = currentAmount.multipliedBy(price).toString();
  }

  await updateInterface(
    id,
    <Send context={context} inputAmount={context.amount} />,
    context,
  );
}

/**
 * Handles the click event for the max amount button.
 * @param params - The parameters for the function.
 * @param params.id - The id of the interface.
 * @param params.context - The send context.
 */
async function onMaxAmountButtonClick({
  id,
  context,
}: {
  id: string;
  context: SendContext;
}) {
  const {
    currencyType,
    minimumBalanceForRentExemptionSol,
    tokenCaipId,
    tokenPrices,
  } = context;
  const updatedContext: SendContext = { ...context };
  const tokenBalance = getBalance(context);
  const isNativeToken = getIsNativeToken(context);

  if (isNativeToken) {
    /**
     * For a SOL transfer, the maximum amount we can send is the balance minus
     * - the base fee
     * - the priority fee
     * - the minimum balance for rent exemption, because the account cannot fall below this amount
     */
    const balanceInLamports = solToLamports(tokenBalance);

    const builder = sendSolBuilder;

    const sendFeeCalculator = new SendFeeCalculator(builder);
    const feeInLamports = sendFeeCalculator.getFee().toString();

    const minimumBalanceForRentExemptionLamports = solToLamports(
      minimumBalanceForRentExemptionSol,
    );

    const balanceInLamportsAfterCost = balanceInLamports
      .minus(feeInLamports)
      .minus(minimumBalanceForRentExemptionLamports)
      .minus(1); // Subtract 1 extra lamport to compensate for rounding

    const maxAmountLamports = BigNumber.maximum(
      balanceInLamportsAfterCost,
      balanceInLamportsAfterCost.isNegative()
        ? balanceInLamports
        : BigNumber(0),
    );

    const maxAmountSol = lamportsToSol(maxAmountLamports);

    updatedContext.amount = maxAmountSol.toString();
  } else {
    updatedContext.amount = tokenBalance;
  }

  if (currencyType === SendCurrencyType.FIAT) {
    const { price } = tokenPrices[tokenCaipId] ?? { price: 0 };
    updatedContext.amount = tokenToFiat(updatedContext.amount, price);
  }

  updatedContext.error = null;

  updatedContext.validation[SendFormNames.AmountInput] =
    validateField<SendFormNames>(
      SendFormNames.AmountInput,
      updatedContext.amount,
      // TODO: This validation should run with the latest fee estimate
      validation(updatedContext),
    );

  await updateInterface(
    id,
    <Send context={updatedContext} inputAmount={updatedContext.amount} />,
    updatedContext,
  );

  await buildTransactionMessageAndUpdateInterface(id, updatedContext);
}

/**
 * Handles the change event for the destination account input.
 * @param params - The parameters for the function.
 * @param params.id - The id of the interface.
 * @param params.event - The change event.
 * @param params.context - The send context.
 */
async function onDestinationAccountInputValueChange({
  id,
  event,
  context,
}: {
  id: string;
  event: InputChangeEvent;
  context: SendContext;
}) {
  const updatedContext = { ...context };

  updatedContext.destinationAddressOrDomain = event.value as string;
  updatedContext.domainResolutionStatus = null;
  updatedContext.error = null;

  const destinationValidation = validateField<SendFormNames>(
    SendFormNames.DestinationAccountInput,
    updatedContext.destinationAddressOrDomain,
    validation(updatedContext),
  );

  updatedContext.validation[SendFormNames.DestinationAccountInput] =
    destinationValidation;

  if (isSolanaDomain(updatedContext?.destinationAddressOrDomain)) {
    updatedContext.domainResolutionStatus = 'fetching';

    await updateInterface(
      id,
      <Send context={updatedContext} />,
      updatedContext,
    );

    // eslint-disable-next-line require-atomic-updates
    updatedContext.toAddress = await nameResolutionService
      .resolveDomain(
        updatedContext.scope,
        updatedContext.destinationAddressOrDomain,
      )
      .catch(() => {
        const translate = i18n(updatedContext.preferences.locale);
        updatedContext.validation[SendFormNames.DestinationAccountInput] = {
          message: translate('send.toInvalidErrorDomain'),
          value: updatedContext.destinationAddressOrDomain ?? '',
        };

        return null;
      });

    updatedContext.domainResolutionStatus = updatedContext.toAddress
      ? 'fetched'
      : 'error';
  } else {
    updatedContext.toAddress = updatedContext.destinationAddressOrDomain;
  }

  await updateInterface(id, <Send context={updatedContext} />, updatedContext);

  if (destinationValidation === null) {
    await buildTransactionMessageAndUpdateInterface(id, updatedContext);
  }
}

/**
 * Handles the click event for the clear button.
 * @param params - The parameters for the function.
 * @param params.id - The id of the interface.
 * @param params.context - The send context.
 */
async function onClearButtonClick({
  id,
  context,
}: {
  id: string;
  context: SendContext;
}) {
  context.destinationAddressOrDomain = '';
  context.toAddress = '';
  context.domainResolutionStatus = null;
  context.error = null;
  context.validation[SendFormNames.DestinationAccountInput] = null;

  await updateInterface(
    id,
    <Send context={context} inputToAddress={context.toAddress} />,
    context,
  );
}

/**
 * Handles the click event for the cancel button.
 * @param params - The parameters for the function.
 * @param params.id - The id of the interface.
 */
async function onCancelButtonClick({ id }: { id: string }) {
  await resolveInterface(id, false);
  await state.deleteKey(`mapInterfaceNameToId.${SEND_FORM_INTERFACE_NAME}`);
}

/**
 * Handles the click event for the send button.
 *
 * @param params - The parameters for the function.
 * @param params.id - The id of the interface.
 * @param params.context - The send context.
 * @returns A promise that resolves when the operation is complete.
 */
async function onSendButtonClick({
  id,
  context,
}: {
  id: string;
  context: SendContext;
}) {
  const isValid = sendFieldsAreValid(context);
  if (!isValid) {
    return;
  }

  const updatedContext: SendContext = { ...context };
  updatedContext.stage = 'transaction-confirmation';
  updatedContext.loading = true;

  await updateInterface(id, <Send context={updatedContext} />, updatedContext);

  const [tokenPrices, tokenImage] = await Promise.all([
    priceApiClient
      .getMultipleSpotPrices(context.assets, context.preferences.currency)
      .then((prices) => prices)
      .catch(() => null),
    context.selectedTokenMetadata
      ? tokenMetadataService.generateImageComponent(
          buildUrl({
            baseUrl: configProvider.get().staticApi.baseUrl,
            path: '/api/v2/tokenIcons/assets/{assetId}.png',
            pathParams: {
              assetId: context.selectedTokenMetadata?.asset.replace(/:/gu, '/'),
            },
          }),
        )
      : null,
  ]);

  if (tokenPrices && tokenImage) {
    updatedContext.tokenPrices = tokenPrices;
    updatedContext.selectedTokenMetadata = context.selectedTokenMetadata
      ? {
          ...context.selectedTokenMetadata,
          imageSvg: tokenImage,
        }
      : null;
  }

  updatedContext.loading = false;

  await updateInterface(id, <Send context={updatedContext} />, updatedContext);

  // Trigger the side effects that need to happen when the transaction is shown in confirmation UI
  await snap.request({
    method: 'snap_scheduleBackgroundEvent',
    params: {
      duration: 'PT1S',
      request: {
        method: ScheduleBackgroundEventMethod.OnTransactionAdded,
        params: {
          accountId: context.fromAccountId,
          base64EncodedTransaction: context.transactionMessage,
          metadata: {
            scope: context.scope,
            origin: METAMASK_ORIGIN,
          },
        },
      },
    },
  });
}

export const eventHandlers = {
  [SendFormNames.BackButton]: onBackButtonClick,
  [SendFormNames.SourceAccountSelector]: onSourceAccountSelectorValueChange,
  [SendFormNames.AmountInput]: onAmountInputChange,
  [SendFormNames.AssetSelector]: onAssetSelectorValueChange,
  [SendFormNames.SwapCurrencyButton]: onSwapCurrencyButtonClick,
  [SendFormNames.MaxAmountButton]: onMaxAmountButtonClick,
  [SendFormNames.DestinationAccountInput]: onDestinationAccountInputValueChange,
  [SendFormNames.ClearButton]: onClearButtonClick,
  [SendFormNames.CancelButton]: onCancelButtonClick,
  [SendFormNames.SendButton]: onSendButtonClick,
};
