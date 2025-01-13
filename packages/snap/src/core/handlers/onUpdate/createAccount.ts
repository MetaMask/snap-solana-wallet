import type { OnUpdateHandler } from '@metamask/snaps-sdk';

import { keyring } from '../../../snapContext';

export const createAccount: OnUpdateHandler = async () => {
  const account = await keyring.createAccount();

  return account;
};
