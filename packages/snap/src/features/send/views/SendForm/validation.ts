import { enums, nonempty, object, string } from 'superstruct';

import { SolanaCaip2Networks } from '../../../../core/constants/solana';
import type { FieldValidationFunction } from '../../../../core/types/form';
import {
  address,
  greatherThanZero,
  required,
} from '../../../../core/validation/form';
import { SendFormNames } from '../Send/types';

export const StartSendTransactionFlowParamsStruct = object({
  scope: enums([...Object.values(SolanaCaip2Networks)]),
  account: nonempty(string()),
});

export const validation: Partial<
  Record<SendFormNames, FieldValidationFunction[]>
> = {
  [SendFormNames.SourceAccountSelector]: [required('send.fromRequiredError')],
  [SendFormNames.AmountInput]: [
    required('send.amountRequiredError'),
    greatherThanZero('send.amountGreatherThanZeroError'),
  ],
  [SendFormNames.DestinationAccountInput]: [
    required('send.toRequiredError'),
    address('send.toInvalidError'),
  ],
};
