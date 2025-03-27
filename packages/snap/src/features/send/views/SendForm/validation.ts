import { enums, object, optional } from '@metamask/superstruct';

import { Network } from '../../../../core/constants/solana';
import type { FieldValidationFunction } from '../../../../core/types/form';
import {
  address,
  amountInput,
  required,
} from '../../../../core/validation/form';
import { Caip19Struct, UuidStruct } from '../../../../core/validation/structs';
import type { SendContext } from '../../types';
import { SendFormNames } from '../../types';

export const StartSendTransactionFlowParamsStruct = object({
  scope: enums([...Object.values(Network)]),
  account: UuidStruct,
  assetId: optional(Caip19Struct),
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
    address('send.toInvalidError', context.preferences.locale),
  ],
});
