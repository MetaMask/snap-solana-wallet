import { assert } from '@metamask/superstruct';
import { getBase64Codec, getUtf8Codec } from '@solana/kit';

import type { SolanaKeyringAccount } from '../../../../core/handlers/onKeyringRequest/Keyring';
import type { SolanaKeyringRequest } from '../../../../core/handlers/onKeyringRequest/structs';
import { SolanaSignMessageRequestStruct } from '../../../../core/services/wallet/structs';
import { SOL_IMAGE_SVG } from '../../../../core/test/mocks/solana-image-svg';
import { FALLBACK_LANGUAGE } from '../../../../core/utils/i18n';
import {
  createInterface,
  getPreferences,
  showDialog,
} from '../../../../core/utils/interface';
import { ConfirmSignMessage } from './ConfirmSignMessage';

/**
 * Renders the confirmation dialog for a sign message.
 *
 * @param request - The request to confirm.
 * @param account - The account that the request is for.
 * @returns The confirmation dialog.
 */
export async function render(
  request: SolanaKeyringRequest,
  account: SolanaKeyringAccount,
) {
  assert(request.request, SolanaSignMessageRequestStruct);

  const {
    request: {
      params: { message: messageBase64 },
    },
    scope,
  } = request;

  const messageBytes = getBase64Codec().encode(messageBase64);
  const messageUtf8 = getUtf8Codec().decode(messageBytes);

  const locale = await getPreferences()
    .then((preferences) => {
      return preferences.locale;
    })
    .catch(() => FALLBACK_LANGUAGE);

  const id = await createInterface(
    <ConfirmSignMessage
      message={messageUtf8}
      account={account}
      scope={scope}
      locale={locale}
      networkImage={SOL_IMAGE_SVG}
    />,
    {},
  );

  const dialogPromise = showDialog(id);

  return dialogPromise;
}
