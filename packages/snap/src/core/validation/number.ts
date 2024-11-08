import { pattern, string } from 'superstruct';

export const PositiveNumberStringStruct = pattern(
  string(),
  /^(?!0\d)(\d+(\.\d+)?)$/u,
);
