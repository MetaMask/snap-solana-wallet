import type {
  ComponentOrElement,
  DialogResult,
  GetClientStatusResult,
  GetInterfaceContextResult,
  GetInterfaceStateResult,
  Json,
  ResolveInterfaceResult,
  UpdateInterfaceResult,
} from '@metamask/snaps-sdk';

import type { ScheduleBackgroundEventMethod } from '../handlers/onCronjob/backgroundEvents/ScheduleBackgroundEventMethod';
import type { Preferences } from '../types/snap';

export const SEND_FORM_INTERFACE_NAME = 'send-form';
export const CONFIRM_SIGN_AND_SEND_TRANSACTION_INTERFACE_NAME =
  'confirm-sign-and-send-transaction';
export const CONFIRM_SIGN_MESSAGE_INTERFACE_NAME = 'confirm-sign-message';

/**
 * Creates an interface using the provided UI component and context.
 *
 * @param ui - The UI component or element.
 * @param context - The context for the interface.
 * @returns A promise that resolves to a string.
 */
export async function createInterface(
  ui: ComponentOrElement,
  context: Record<string, Json>,
): Promise<string> {
  return snap.request({
    method: 'snap_createInterface',
    params: {
      ui,
      context,
    },
  });
}

/**
 * Updates an interface using the provided UI component and context.
 *
 * @param id - The ID for the interface to update.
 * @param ui - The UI component or element.
 * @param context - The context for the interface.
 * @returns A promise that resolves to a string.
 */
export async function updateInterface(
  id: string,
  ui: ComponentOrElement,
  context: Record<string, Json>,
): Promise<UpdateInterfaceResult> {
  return snap.request({
    method: 'snap_updateInterface',
    params: {
      id,
      ui,
      context,
    },
  });
}

/**
 * Gets the state of an interactive interface by its ID.
 *
 * @param id - The ID for the interface to update.
 * @returns An object containing the state of the interface.
 */
export async function getInterfaceState(
  id: string,
): Promise<GetInterfaceStateResult> {
  return snap.request({
    method: 'snap_getInterfaceState',
    params: {
      id,
    },
  });
}

/**
 * Resolve a dialog using the provided ID.
 *
 * @param id - The ID for the interface to update.
 * @param value - The result to resolve the interface with.
 * @returns An object containing the state of the interface.
 */
export async function resolveInterface(
  id: string,
  value: Json,
): Promise<ResolveInterfaceResult> {
  return snap.request({
    method: 'snap_resolveInterface',
    params: {
      id,
      value,
    },
  });
}

/**
 * Shows a dialog using the provided ID.
 *
 * @param id - The ID for the dialog.
 * @returns A promise that resolves to a string.
 */
export async function showDialog(id: string): Promise<DialogResult> {
  return snap.request({
    method: 'snap_dialog',
    params: {
      id,
    },
  });
}

/**
 * Get preferences from snap.
 *
 * @returns A promise that resolves to snap preferences.
 */
export async function getPreferences(): Promise<Preferences> {
  return snap.request({
    method: 'snap_getPreferences',
  }) as Promise<Preferences>;
}

/**
 * Retrieves the context of an interactive interface by its ID.
 *
 * @param interfaceId - The ID for the interface to retrieve the context.
 * @returns An object containing the context of the interface.
 */
export async function getInterfaceContext(
  interfaceId: string,
): Promise<GetInterfaceContextResult> {
  return await snap.request({
    method: 'snap_getInterfaceContext',
    params: {
      id: interfaceId,
    },
  });
}

/**
 * Retrieves the client status (locked/unlocked) in this case from MM.
 *
 * @returns An object containing the status.
 */
export async function getClientStatus(): Promise<GetClientStatusResult> {
  return await snap.request({
    method: 'snap_getClientStatus',
  });
}

/**
 * Schedules a background event.
 *
 * @param options - The options for the background event.
 * @param options.method - The method to call.
 * @param options.params - The params to pass to the method.
 * @param options.duration - The duration to wait before the event is scheduled.
 * @returns A promise that resolves to a string.
 */
export async function scheduleBackgroundEvent({
  method,
  params = {},
  duration,
}: {
  method: ScheduleBackgroundEventMethod;
  params?: Record<string, Json>;
  duration: string;
}) {
  return await snap.request({
    method: 'snap_scheduleBackgroundEvent',
    params: {
      duration,
      request: {
        method,
        params,
      },
    },
  });
}
