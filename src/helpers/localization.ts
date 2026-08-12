// Same i18n surface as the mobile helper (`i18n`, `translate`, `setI18nConfig`),
// minus RN's I18nManager. Locale files are imported statically so Vite bundles
// them, rather than mobile's require()-per-language.
import { I18n } from 'i18n-js';
import memoize from 'lodash.memoize';
import lightexchange from 'light-exchange';
import { Localize } from '../platform/device';
import en from '../locales/en.json';
import fr from '../locales/fr.json';

export const translationGetters: Record<string, () => any> = {
  en: () => en,
  fr: () => fr,
};

export const i18n = new I18n(translationGetters);

export const translate = memoize(
  (key: string, config?: any) => i18n.t(key, config),
  (key: string, config?: any) => (config ? key + JSON.stringify(config) : key),
);

export const setI18nConfig = (language?: { languageCode: string; isRTL?: boolean }) => {
  const fallback = { languageCode: lightexchange.app.LANGUAGES.en, isRTL: false };
  const { languageCode } = language || fallback;
  const code = translationGetters[languageCode] ? languageCode : fallback.languageCode;
  translate.cache.clear!();
  i18n.translations = { [code]: translationGetters[code]() };
  i18n.locale = code;
  document.documentElement.lang = code;
};

/** Language the browser asks for, narrowed to the locales we actually ship. */
export const preferredLanguage = (): string =>
  Localize.findBestLanguageTag(Object.keys(translationGetters)).languageTag;
