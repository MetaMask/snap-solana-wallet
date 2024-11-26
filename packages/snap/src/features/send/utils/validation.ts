import { enums, nonempty, object, string } from 'superstruct';

import { SolanaCaip2Networks } from '../../../core/constants/solana';
import type { FieldValidationFunction } from '../../../core/types/form';
import {
  address,
  greatherThanZero,
  required,
} from '../../../core/validation/form';
import { SendFormNames } from '../views/SendForm/types';

export const StartSendTransactionFlowParamsStruct = object({
  scope: enums([...Object.values(SolanaCaip2Networks)]),
  account: nonempty(string()),
});

export const validation: Partial<
  Record<SendFormNames, FieldValidationFunction[]>
> = {
  [SendFormNames.SourceAccountSelector]: [required('Account is required')],
  [SendFormNames.AmountInput]: [
    required('Amount is required'),
    greatherThanZero('Amount must be greater than 0'),
  ],
  [SendFormNames.DestinationAccountInput]: [
    required('To address is required'),
    address('Invalid Solana address'),
  ],
};
