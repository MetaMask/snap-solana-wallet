import en from '../../../locales/en.json';

export const locales = {
  en: en.messages,
};

export type Locale = keyof typeof locales;
export type LocalizedMessage = keyof (typeof locales)[Locale];

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

  return (id: LocalizedMessage, replaces?: Record<string, string>) => {
    let message = messages?.[id]?.message ?? id;

    if (replaces && message) {
      Object.keys(replaces).forEach((key) => {
        const regex = new RegExp(`\\{${key}\\}`, 'gu');
        message = message.replace(regex, replaces[key] ?? '');
      });
    }

    return message;
  };
}
