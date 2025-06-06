/**
 * Convert a Uint8Array to a BufferSource.
 *
 * @param array - The Uint8Array to convert.
 * @returns The BufferSource.
 */
export function uint8ArrayAsBufferSource(array: Uint8Array): BufferSource {
  if (array.byteLength === array.buffer.byteLength) {
    return array.buffer;
  }

  return array.buffer.slice(array.byteOffset, array.byteLength);
}
