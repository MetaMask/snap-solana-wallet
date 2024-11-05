import { SnapsProvider } from "@metamask/snaps-sdk";

/**
 * Retrieves the current SnapsProvider.
 *
 * @returns The current SnapsProvider.
 */
export function getProvider(): SnapsProvider {
  return snap;
}
