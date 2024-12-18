import { NumberFormat } from '@formatjs/intl-numberformat/index';

import { Collator } from './Collator';

/**
 * Adds support for the Intl object's Collator#toLocaleString method.
 */
export function install() {
  Object.defineProperty(globalThis, 'Intl', {
    value: {
      Collator,
      NumberFormat,
    },
    writable: true,
    configurable: true,
    enumerable: true,
  });
}
