import type { OnRpcRequestHandler } from '@metamask/snaps-sdk';

import { keyring } from '../../../snapContext';

export const listAccountAssets: OnRpcRequestHandler = async ({ request }) => {
  const { params } = request;

  const { id } = params as { id: string };

  const accountAssets = await keyring.listAccountAssets(id);

  return accountAssets;
};
