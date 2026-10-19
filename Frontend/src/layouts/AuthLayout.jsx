import { Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CampusArt } from "../components/animations/CampusArt.jsx";
import { Logo } from "../components/common/Display.jsx";
import { LanguageToggle, ThemeToggle } from "../components/common/Toggles.jsx";

/** Split layout used by login / register / forgot password: form on one side, campus art on the other. */
export function AuthLayout({ caption }) {
  const { t } = useTranslation();
  return (
    <div className="auth">
      <div className="auth__form-side">
        <div className="auth__top">
          <Logo />
          <div className="topbar__tools">
            <ThemeToggle />
            <LanguageToggle />
          </div>
        </div>
        <main id="main" className="auth__center" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
      <aside className="auth__art" aria-hidden="true">
        <div className="auth__art-title">{t("auth.artTitle")}</div>
        <CampusArt />
        <div className="auth__art-caption">
          {caption ?? t("auth.artCaption")}
        </div>
      </aside>
    </div>
  );
}
