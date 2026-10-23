import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

/** Sets the browser tab title to "<page> | <app name>". */
export function useDocumentTitle(title) {
  const { t, i18n } = useTranslation();
  useEffect(() => {
    const app = t('app.name');
    document.title = title ? `${title} | ${app}` : app;
  }, [title, t, i18n.language]);
}
