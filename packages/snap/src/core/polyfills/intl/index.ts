/* eslint-disable import/no-unassigned-import */
import { getCanonicalLocales } from '@formatjs/intl-getcanonicallocales';
import { Locale } from '@formatjs/intl-locale/index';
import { NumberFormat } from '@formatjs/intl-numberformat/index';
import { PluralRules } from '@formatjs/intl-pluralrules/index';

import { Collator } from './Collator';

/**
 * Adds support for the Intl object's Collator#toLocaleString method.
 */
export function install() {
  Object.defineProperty(globalThis, 'Intl', {
    value: {
      Collator,
      NumberFormat,
      getCanonicalLocales,
      Locale,
      PluralRules,
    },
    writable: true,
    configurable: true,
    enumerable: true,
  });

  import('@formatjs/intl-numberformat/locale-data/en');
  import('@formatjs/intl-pluralrules/locale-data/en');
  import('@formatjs/intl-numberformat/locale-data/es');
  import('@formatjs/intl-pluralrules/locale-data/es');
}
