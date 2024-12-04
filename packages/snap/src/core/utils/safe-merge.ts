/**
 * Merges two objects, keeping values from the overridee object when the overrider's corresponding properties are undefined,
 * null, or empty objects. Non-undefined values from the overrider take precedence. Empty objects in the overrider are
 * filtered out to preserve the overridee's values.
 *
 * @param overridee - The object to override.
 * @param overrider - The object to override with.
 * @returns The merged object.
 * @example
 * const overridee = { name: 'John' };
 * const overrider = { name: undefined, age: 30 };
 * const merged = safeMerge(overridee, overrider);
 * // merged is { name: 'John' }
 */
export const safeMerge = <TOverridee extends object, TOverrider extends object>(
  overridee: TOverridee,
  overrider: TOverrider,
): TOverridee & TOverrider => ({
  ...overridee,
  ...(Object.fromEntries(
    Object.entries(overrider).filter(
      ([_, value]) =>
        value !== undefined &&
        value !== null &&
        (!value || typeof value !== 'object' || Object.keys(value).length > 0),
    ),
  ) as TOverrider),
});
