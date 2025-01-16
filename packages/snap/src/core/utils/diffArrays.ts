type DiffResult<Type> = {
  added: Type[];
  deleted: Type[];
  hasDiff: boolean;
};

/**
 * Computes the difference between two arrays.
 * @param array1 - The first array.
 * @param array2 - The second array.
 * @returns An object containing the added and deleted elements.
 */
export function diffArrays<Type>(
  array1: Type[],
  array2: Type[],
): DiffResult<Type> {
  const added = array2.filter((item) => !array1.includes(item));
  const deleted = array1.filter((item) => !array2.includes(item));

  return {
    hasDiff: added.length > 0 || deleted.length > 0,
    added,
    deleted,
  };
}
