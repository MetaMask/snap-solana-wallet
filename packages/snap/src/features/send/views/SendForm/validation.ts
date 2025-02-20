import { enums, object } from 'superstruct';

import { Network } from '../../../../core/constants/solana';
import type { FieldValidationFunction } from '../../../../core/types/form';
import type { Locale } from '../../../../core/utils/i18n';
import {
  address,
  greatherThanZero,
  required,
} from '../../../../core/validation/form';
import { UuidStruct } from '../../../../core/validation/structs';
import { SendFormNames } from '../../types';

export const StartSendTransactionFlowParamsStruct = object({
  scope: enums([...Object.values(Network)]),
  account: UuidStruct,
});

export const validation: (
  locale: Locale,
) => Partial<Record<SendFormNames, FieldValidationFunction[]>> = (locale) => ({
  [SendFormNames.SourceAccountSelector]: [
    required('send.fromRequiredError', locale),
  ],
  [SendFormNames.AmountInput]: [
    required('send.amountRequiredError', locale),
    greatherThanZero('send.amountGreatherThanZeroError', locale),
  ],
  [SendFormNames.DestinationAccountInput]: [
    required('send.toRequiredError', locale),
    address('send.toInvalidError', locale),
  ],
});
