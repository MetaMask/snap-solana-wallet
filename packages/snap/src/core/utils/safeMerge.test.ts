import { safeMerge } from './safeMerge';

describe('safeMerge', () => {
  it('merges two objects and keeps existing values when overrider has undefined', () => {
    const overridee = { name: 'John', age: 25 };
    const overrider = { name: undefined, title: 'Developer' };

    const result = safeMerge(overridee, overrider);

    expect(result).toStrictEqual({
      name: 'John',
      age: 25,
      title: 'Developer',
    });
  });

  it('overrides values when overrider has non-undefined values', () => {
    const overridee = { name: 'John', age: 25 };
    const overrider = { name: 'Jane', title: 'Engineer' };

    const result = safeMerge(overridee, overrider);

    expect(result).toStrictEqual({
      name: 'Jane',
      age: 25,
      title: 'Engineer',
    });
  });

  it('handles empty objects', () => {
    const overridee = {};
    const overrider = {};

    const result = safeMerge(overridee, overrider);

    expect(result).toStrictEqual({});
  });

  it('handles objects with null values', () => {
    const overridee = { name: 'John', age: null };
    const overrider = { name: null, title: 'Developer' };

    const result = safeMerge(overridee, overrider);

    expect(result).toStrictEqual({
      name: 'John',
      age: null,
      title: 'Developer',
    });
  });

  it('handles nested objects', () => {
    const overridee = {
      user: {
        name: 'John',
        details: { age: 25 },
      },
    };
    const overrider = {
      user: {
        name: undefined,
        details: { location: 'NYC' },
      },
    };

    const result = safeMerge(overridee, overrider);

    expect(result).toStrictEqual({
      user: {
        name: undefined,
        details: { location: 'NYC' },
      },
    });
  });

  it('filters out empty objects in overrider', () => {
    const overridee = { name: 'John', settings: { theme: 'dark' } };
    const overrider = { name: 'Jane', settings: {} };

    const result = safeMerge(overridee, overrider);

    expect(result).toStrictEqual({
      name: 'Jane',
      settings: { theme: 'dark' },
    });
  });

  it('keeps non-empty objects in overrider', () => {
    const overridee = { settings: { theme: 'dark' } };
    const overrider = { settings: { language: 'en' } };

    const result = safeMerge(overridee, overrider);

    expect(result).toStrictEqual({
      settings: { language: 'en' },
    });
  });

  it('merges multiple empty and non-empty nested objects', () => {
    const overridee = {
      a: { x: 1 },
      b: { y: 2 },
      c: { z: 3 },
    };
    const overrider = {
      a: {},
      b: { y: 5 },
      c: {},
    };

    const result = safeMerge(overridee, overrider);

    expect(result).toStrictEqual({
      a: { x: 1 },
      b: { y: 5 },
      c: { z: 3 },
    });
  });
});
