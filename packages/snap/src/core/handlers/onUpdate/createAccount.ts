import type { OnUpdateHandler } from '@metamask/snaps-sdk';

import { keyring } from '../../../snap-context';

export const createAccount: OnUpdateHandler = async () => {

  const account = await keyring.createAccount();

  return account;
};
