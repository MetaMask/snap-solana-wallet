import type { Messenger } from '@metamask/messenger';
import type { RemoteFeatureFlagControllerGetStateAction } from '@metamask/remote-feature-flag-controller';
import type { AsyncMessenger } from '@metamask/snaps-sdk';

export type CoreMessengerActions = RemoteFeatureFlagControllerGetStateAction;

export type CoreMessenger = Messenger<string, CoreMessengerActions>;
export type CoreMessengerCaller = Pick<AsyncMessenger<CoreMessenger>, 'call'>;
