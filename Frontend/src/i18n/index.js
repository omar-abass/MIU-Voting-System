import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

/**
 * Translations live in small modular JSON files per language
 * (src/i18n/locales/<lang>/*.json). Every file contributes top-level groups
 * (e.g. "auth", "errors") and they are merged here.
 */
function merge(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      target[key] = merge(target[key] ?? {}, value);
    } else {
      target[key] = value;
    }
  }
  return target;
}

const bundle = (modules) => Object.values(modules).reduce((acc, m) => merge(acc, m.default ?? m), {});

export const resources = {
  en: { translation: bundle(import.meta.glob('./locales/en/*.json', { eager: true })) },
  ar: { translation: bundle(import.meta.glob('./locales/ar/*.json', { eager: true })) }
};

export const SUPPORTED_LANGUAGES = ['en', 'ar'];
export const LANG_KEY = 'miu-lang';

export function readStoredLanguage() {
  try {
    const stored = localStorage.getItem(LANG_KEY);
    if (SUPPORTED_LANGUAGES.includes(stored)) return stored;
  } catch {
    /* storage unavailable */
  }
  return 'en';
}

i18n.use(initReactI18next).init({
  resources,
  lng: readStoredLanguage(),
  fallbackLng: 'en',
  supportedLngs: SUPPORTED_LANGUAGES,
  interpolation: { escapeValue: false }, // React already escapes
  returnNull: false
});

export default i18n;
