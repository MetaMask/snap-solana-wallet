import en from '../../../locales/en.json';
import es from '../../../locales/es.json';

export const locales = {
  en: en.messages,
  es: es.messages,
};

export const FALLBACK_LANGUAGE: Locale = 'en';

export type Locale = keyof typeof locales;
export type LocalizedMessage = keyof (typeof locales)[typeof FALLBACK_LANGUAGE];

/**
 * Fetches the translations based on the user's locale preference.
 * Falls back to the default language if the preferred locale is not available.
 *
 * @param locale - The user's preferred locale.
 * @returns A function that gets the translation for a given key.
 */
export function i18n(locale: Locale) {
  // Needs to be castes as EN is the main language and we can have the case where
  // messages are not yed completed for the other languages
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
  const messages = (locales[locale] ??
    locales[FALLBACK_LANGUAGE]) as typeof en.messages;

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
