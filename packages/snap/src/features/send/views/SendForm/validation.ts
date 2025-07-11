import { enums, object, optional } from '@metamask/superstruct';
import { CaipAssetTypeStruct } from '@metamask/utils';

import { Network } from '../../../../core/constants/solana';
import type { FieldValidationFunction } from '../../../../core/types/form';
import { UuidStruct } from '../../../../core/validation/structs';
import type { SendContext } from '../../types';
import { SendFormNames } from '../../types';
import { addressOrDomain, amountInput, required } from '../../validation/form';

export const StartSendTransactionFlowParamsStruct = object({
  scope: enums([...Object.values(Network)]),
  account: UuidStruct,
  assetId: optional(CaipAssetTypeStruct),
});

export const validation: (
  context: SendContext,
) => Partial<Record<SendFormNames, FieldValidationFunction[]>> = (context) => ({
  [SendFormNames.SourceAccountSelector]: [
    required('send.fromRequiredError', context.preferences.locale),
  ],
  [SendFormNames.AmountInput]: [
    amountInput(context),
    required('send.amountRequiredError', context.preferences.locale),
  ],
  [SendFormNames.DestinationAccountInput]: [
    required('send.toRequiredError', context.preferences.locale),
    addressOrDomain('send.toInvalidError', context.preferences.locale),
  ],
});
