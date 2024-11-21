/**
 * Check if the algorithm is Ed25519.
 *
 * @param algorithm - The algorithm to check.
 * @returns True if the algorithm is Ed25519, false otherwise.
 */
export function isEd25519Algorithm(
  algorithm: AlgorithmIdentifier | KeyAlgorithm,
): boolean {
  return (
    algorithm === 'Ed25519' ||
    (typeof algorithm === 'object' && algorithm.name === 'Ed25519')
  );
}
