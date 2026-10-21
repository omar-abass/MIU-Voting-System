import { Languages, Moon, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext.jsx';
import { useLanguage } from '../../contexts/LanguageContext.jsx';

export function ThemeToggle() {
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const dark = theme === 'dark';
  return (
    <button type="button" className="icon-btn" onClick={toggleTheme} aria-pressed={dark} aria-label={dark ? t('theme.switchToLight') : t('theme.switchToDark')} title={dark ? t('theme.light') : t('theme.dark')}>
      {dark ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
    </button>
  );
}

export function LanguageToggle() {
  const { t } = useTranslation();
  const { lang, toggleLanguage } = useLanguage();
  return (
    <button type="button" className="lang-btn" onClick={toggleLanguage} aria-label={t('language.switchTo')} lang={lang === 'ar' ? 'en' : 'ar'}>
      <Languages aria-hidden="true" />
      <span>{lang === 'ar' ? 'English' : 'العربية'}</span>
    </button>
  );
}
