import { Languages, Moon, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import { useTheme } from '../../contexts/ThemeContext.jsx';
import { APP_TIMEZONE } from '../../utils/env.js';
import { Card } from '../../components/common/Card.jsx';
import { PageHead } from '../../components/common/Display.jsx';

export default function Settings() {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { lang, setLanguage } = useLanguage();
  useDocumentTitle(t('nav.settings'));

  return (
    <>
      <PageHead title={t('settings.title')} subtitle={t('settings.subtitle')} />
      <Card>
        <div className="setting-row">
          <div>
            <h3>{t('settings.appearance')}</h3>
            <p>{t('settings.appearanceText')}</p>
          </div>
          <div className="segmented" role="group" aria-label={t('settings.appearance')}>
            <button type="button" aria-pressed={theme === 'light'} onClick={() => setTheme('light')}>
              <Sun aria-hidden="true" /> {t('theme.light')}
            </button>
            <button type="button" aria-pressed={theme === 'dark'} onClick={() => setTheme('dark')}>
              <Moon aria-hidden="true" /> {t('theme.dark')}
            </button>
          </div>
        </div>
        <div className="setting-row">
          <div>
            <h3>{t('settings.language')}</h3>
            <p>{t('settings.languageText')}</p>
          </div>
          <div className="segmented" role="group" aria-label={t('settings.language')}>
            <button type="button" aria-pressed={lang === 'en'} onClick={() => setLanguage('en')} lang="en">
              <Languages aria-hidden="true" /> English
            </button>
            <button type="button" aria-pressed={lang === 'ar'} onClick={() => setLanguage('ar')} lang="ar">
              <Languages aria-hidden="true" /> العربية
            </button>
          </div>
        </div>
        <div className="setting-row">
          <div>
            <h3>{t('settings.timezone')}</h3>
            <p>{t('settings.timezoneText')}</p>
          </div>
          <span className="badge badge--plain ltr">{APP_TIMEZONE}</span>
        </div>
      </Card>
    </>
  );
}
