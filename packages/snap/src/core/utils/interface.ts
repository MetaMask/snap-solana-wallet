import type {
  DialogResult,
  ComponentOrElement,
  Json,
  UpdateInterfaceResult,
  GetInterfaceStateResult,
  ResolveInterfaceResult,
} from '@metamask/snaps-sdk';

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
