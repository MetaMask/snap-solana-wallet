import { i18n, locales } from './i18n';

describe('i18n', () => {
  it('returns the correct translation for a given key', () => {
    const translate = i18n('en');
    const message = translate('send.balance');
    expect(message).toBe(locales.en['send.balance'].message);
  });

  it('falls back to the default language if the preferred locale is not available', () => {
    const translate = i18n('fr' as any);
    const message = translate('send.balance');
    expect(message).toBe(locales.en['send.balance'].message);
  });

  it('returns undefined for a non-existent key', () => {
    const translate = i18n('en');
    const message = translate('nonExistentKey' as any);
    expect(message).toBeUndefined();
  });
});
