export type WithIndex = {
  index: number;
};

/**
 * Generating a new index for the KeyringAccount is not as straightforward as one might think.
 * We cannot assume that this number will continuosly increase because one can delete an account with
 * an index in the middle of the list. The right way to do it is to loop through the keyringAccounts
 * and get the lowest index that is not yet used.
 *
 * This function does precisely that, in a generic way, as it can work with any array of items that
 * have a field `index`.
 *
 * Eg:
 * Used Indices: [] -> Lowest is 0.
 * Used Indices: [0, 1, 2, 4] -> Lowest is 3.
 *
 * @param items - The items to check.
 * @returns The lowest unused index.
 */
export function getLowestUnusedIndex(items: WithIndex[]): number {
  if (items.length === 0) {
    return 0;
  }

  const usedIndices = items.map((item) => item.index).sort((a, b) => a - b);

  let lowestUnusedIndex = 0;

  for (const usedIndex of usedIndices) {
    /**
     * From lower to higher, the moment we find a gap, we can use it
     */
    if (usedIndex !== lowestUnusedIndex) {
      break;
    }

    lowestUnusedIndex += 1;
  }

  return lowestUnusedIndex;
}
