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
 * @param id - The translation key.
 * @returns The translations for the preferred or fallback locale.
 */
export function translation(
  locale: Locale,
  id: keyof (typeof locales)[Locale],
) {
  return (
    locales[locale]?.[id]?.message ?? locales[FALLBACK_LANGUAGE]?.[id]?.message
  );
}
