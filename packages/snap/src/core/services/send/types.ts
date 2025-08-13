import type { Infer } from '@metamask/superstruct';

import type {
  OnAddressInputRequestStruct,
  OnAmountInputRequestStruct,
  OnConfirmSendRequestStruct,
  ValidationResponseStruct,
} from '../../handlers/onClientRequest/validation';

export type OnConfirmSendRequest = Infer<typeof OnConfirmSendRequestStruct>;

export type OnAddressInputRequest = Infer<typeof OnAddressInputRequestStruct>;

export type OnAmountInputRequest = Infer<typeof OnAmountInputRequestStruct>;

export type ValidationResponse = Infer<typeof ValidationResponseStruct>;

export enum SendErrorCodes {
  Required = 'Required',
  Invalid = 'Invalid',
  InsufficientBalanceToCoverFee = 'InsufficientBalanceToCoverFee',
  InsufficientBalance = 'InsufficientBalance',
}
