import { JsonSLIP10Node, type SLIP10NodeInterface } from '@metamask/key-tree';

/**
 * Retrieves a `SLIP10NodeInterface` object for the specified path and curve.
 *
 * @param path - The BIP32 derivation path for which to retrieve a `SLIP10NodeInterface`.
 * @param curve - The elliptic curve to use for key derivation.
 * @returns A Promise that resolves to a `SLIP10NodeInterface` object.
 */
export async function getBip32Entropy(
  path: string[],
  curve: 'secp256k1' | 'ed25519',
): Promise<JsonSLIP10Node> {
  const node = await snap.request({
    method: 'snap_getBip32Entropy',
    params: {
      path,
      curve,
    },
  });

  return node;
}
