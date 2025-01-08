import { type OnUpdateHandler } from '@metamask/snaps-sdk';

import { createAccount } from './createAccount';

export enum OnUpdateMethods {
  CreateAccount = 'createAccount',
}

export const handlers: Record<OnUpdateMethods, OnUpdateHandler> = {
  [OnUpdateMethods.CreateAccount]: createAccount,
};
