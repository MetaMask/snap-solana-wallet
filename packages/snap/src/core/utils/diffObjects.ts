type DiffResult = {
  added: Record<string, any>;
  deleted: Record<string, any>;
  changed: Record<string, any>;
  hasDiff: boolean;
};

/**
 * Computes the differences between two objects.
 * @param object1 - The first object to compare.
 * @param object2 - The second object to compare.
 * @returns The differences between the two objects.
 */
export function diffObjects(
  object1: Record<string, any>,
  object2: Record<string, any>,
): DiffResult {
  const diffs: DiffResult = {
    added: {},
    deleted: {},
    changed: {},
    hasDiff: false,
  };

  const findDiffs = (
    o1: Record<string, any>,
    o2: Record<string, any>,
    path = '',
  ) => {
    for (const key in o1) {
      if (Object.prototype.hasOwnProperty.call(o1, key)) {
        const newPath = path ? `${path}.${key}` : key;
        if (!Object.prototype.hasOwnProperty.call(o2, key)) {
          diffs.deleted[newPath] = o1[key];
          diffs.hasDiff = true;
        } else if (
          typeof o1[key] === 'object' &&
          o1[key] !== null &&
          typeof o2[key] === 'object' &&
          o2[key] !== null
        ) {
          findDiffs(o1[key], o2[key], newPath);
        } else if (o1[key] !== o2[key]) {
          const topKey = newPath.split('.')[0];
          diffs.changed[topKey ?? key] = object2[topKey ?? key];
          diffs.hasDiff = true;
        }
      }
    }

    for (const key in o2) {
      if (
        Object.prototype.hasOwnProperty.call(o2, key) &&
        !Object.prototype.hasOwnProperty.call(o1, key)
      ) {
        const newPath = path ? `${path}.${key}` : key;
        diffs.added[newPath] = o2[key];
        diffs.hasDiff = true;
      }
    }
  };

  findDiffs(object1, object2);
  return diffs;
}
