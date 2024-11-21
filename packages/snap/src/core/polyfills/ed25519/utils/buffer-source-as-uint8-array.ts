/**
 * Convert a BufferSource to a Uint8Array.
 *
 * @param source - The BufferSource to convert.
 * @returns The Uint8Array.
 */
export function bufferSourceAsUint8Array(source: BufferSource): Uint8Array {
  if (source instanceof Uint8Array) {
    return source;
  }

  if (source instanceof ArrayBuffer) {
    return new Uint8Array(source);
  }

  return new Uint8Array(source.buffer, source.byteOffset, source.byteLength);
}
