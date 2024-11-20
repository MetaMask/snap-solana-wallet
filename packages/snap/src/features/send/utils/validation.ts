import { enums, nonempty, object, string } from 'superstruct';

import { SolanaCaip2Networks } from '../../../core/constants/solana';
import type { FieldValidationFunction } from '../../../core/types/form';
import { address, required } from '../../../core/validation/form';
import { SendFormNames } from '../types/form';

export const StartSendTransactionFlowParamsStruct = object({
  scope: enums([...Object.values(SolanaCaip2Networks)]),
  account: nonempty(string()),
});

export const validation: Partial<
  Record<SendFormNames, FieldValidationFunction[]>
> = {
  [SendFormNames.AccountSelector]: [
    required('Account is required'),
    address('Invalid account'),
  ],
};
