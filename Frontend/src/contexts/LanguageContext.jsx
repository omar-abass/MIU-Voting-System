import { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { LANG_KEY } from '../i18n/index.js';

const LanguageContext = createContext(null);

/** Keeps <html lang dir> and the persisted choice in sync with the active i18n language. */
export function LanguageProvider({ children }) {
  const { i18n, t } = useTranslation();
  const lang = i18n.language === 'ar' ? 'ar' : 'en';
  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('lang', lang);
    root.setAttribute('dir', dir);
  }, [lang, dir]);

  const setLanguage = useCallback(
    (next) => {
      i18n.changeLanguage(next);
      try {
        localStorage.setItem(LANG_KEY, next);
      } catch {
        /* storage unavailable */
      }
    },
    [i18n]
  );

  const toggleLanguage = useCallback(() => setLanguage(lang === 'ar' ? 'en' : 'ar'), [lang, setLanguage]);
  const value = useMemo(() => ({ lang, dir, isRtl: dir === 'rtl', setLanguage, toggleLanguage, t }), [lang, dir, setLanguage, toggleLanguage, t]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used inside <LanguageProvider>');
  return ctx;
}
