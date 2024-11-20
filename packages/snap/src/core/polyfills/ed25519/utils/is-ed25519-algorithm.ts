export function isEd25519Algorithm(
  algorithm: AlgorithmIdentifier | KeyAlgorithm,
): boolean {
  return (
    algorithm === 'Ed25519' ||
    (typeof algorithm === 'object' && algorithm.name === 'Ed25519')
  );
}
