import { SolanaCaip2Networks } from '../constants/solana';

export const getClusterFromScope = (lookedUpScope: SolanaCaip2Networks) => {
  for (const [scope, value] of Object.entries(SolanaCaip2Networks)) {
    if (value === lookedUpScope) {
      return scope as keyof typeof SolanaCaip2Networks;
    }
  }
  return undefined;
};
