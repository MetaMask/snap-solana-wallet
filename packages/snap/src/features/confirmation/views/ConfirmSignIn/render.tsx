import { assert } from '@metamask/superstruct';

import type { SolanaKeyringAccount } from '../../../../core/handlers/onKeyringRequest/Keyring';
import type { SolanaKeyringRequest } from '../../../../core/handlers/onKeyringRequest/structs';
import { SolanaSignInRequestStruct } from '../../../../core/services/wallet/structs';
import { SOL_IMAGE_SVG } from '../../../../core/test/mocks/solana-image-svg';
import {
  createInterface,
  getPreferences,
  showDialog,
} from '../../../../core/utils/interface';
import type { ConfirmSignInProps } from './ConfirmSignIn';
import { ConfirmSignIn } from './ConfirmSignIn';

/**
 * Renders the confirmation dialog for a sign in request.
 *
 * @param request - The request to confirm.
 * @param account - The account that the request is for.
 * @returns The confirmation dialog.
 */
export async function render(
  request: SolanaKeyringRequest,
  account: SolanaKeyringAccount,
) {
  assert(request.request, SolanaSignInRequestStruct);

  const {
    request: { params },
    scope,
  } = request;

  const preferences = await getPreferences();

  const id = await createInterface(
    <ConfirmSignIn
      params={params as ConfirmSignInProps['params']}
      account={account}
      scope={scope}
      preferences={preferences}
      networkImage={SOL_IMAGE_SVG}
      origin={origin}
    />,
    {},
  );

  const dialogPromise = showDialog(id);

  return dialogPromise;
}
