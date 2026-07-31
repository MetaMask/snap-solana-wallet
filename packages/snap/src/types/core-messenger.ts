import type {
  AssetsControllerGetAssetAction,
  AssetsControllerGetAssetsAction,
} from '@metamask/assets-controller';
import type { Messenger } from '@metamask/messenger';
import type { AsyncMessenger } from '@metamask/snaps-sdk';

export type CoreMessengerActions =
  | AssetsControllerGetAssetAction
  | AssetsControllerGetAssetsAction;

/**
 * Typed messenger for Core controller actions available to this Snap via
 * `endowment:messenger` / `getMessenger`.
 */
export type CoreMessenger = Messenger<string, CoreMessengerActions>;

/**
 * Narrow dependency for services that only need to invoke Core actions.
 */
export type CoreMessengerCaller = Pick<AsyncMessenger<CoreMessenger>, 'call'>;
