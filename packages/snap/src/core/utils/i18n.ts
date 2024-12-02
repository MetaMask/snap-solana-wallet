import en from '../../../locales/en.json';

export const locales = {
  en: en.messages,
};

export type Locale = keyof typeof locales;

const FALLBACK_LANGUAGE: Locale = 'en';

/**
 * Fetches the translations based on the user's locale preference.
 * Falls back to the default language if the preferred locale is not available.
 *
 * @param locale - The user's preferred locale.
 * @returns A function that gets the translation for a given key.
 */
export function i18n(locale: Locale) {
  const messages = locales[locale] ?? locales[FALLBACK_LANGUAGE];

  return (id: keyof (typeof locales)[Locale]) => {
    return messages?.[id]?.message;
  };
}
