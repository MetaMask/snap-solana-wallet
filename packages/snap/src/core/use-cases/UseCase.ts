import type { Json } from '@metamask/utils';

export type UseCase = {
  execute: (...args: any) => Promise<Json>;
};
