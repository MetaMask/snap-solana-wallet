export function uint8ArrayAsBufferSource(array: Uint8Array): BufferSource {
  if (array.byteLength === array.buffer.byteLength) {
    return array.buffer;
  }

  return array.buffer.slice(array.byteOffset, array.byteLength);
}
