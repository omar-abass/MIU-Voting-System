import { Link, NavLink, Outlet } from "react-router-dom";
import { Instagram, Linkedin, Facebook, Youtube } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth, homePathFor } from "../contexts/AuthContext.jsx";
import { Logo } from "../components/common/Display.jsx";
import { Button } from "../components/common/Button.jsx";
import { LanguageToggle, ThemeToggle } from "../components/common/Toggles.jsx";

/** Social links are neutral placeholders: set the real university URLs here (or leave the icons out). */
const SOCIAL = [
  {
    icon: Facebook,
    label: "Facebook",
    href: import.meta.env.VITE_SOCIAL_FACEBOOK,
  },
  {
    icon: Linkedin,
    label: "LinkedIn",
    href: import.meta.env.VITE_SOCIAL_LINKEDIN,
  },
  {
    icon: Instagram,
    label: "Instagram",
    href: import.meta.env.VITE_SOCIAL_INSTAGRAM,
  },
  {
    icon: Youtube,
    label: "YouTube",
    href: import.meta.env.VITE_SOCIAL_YOUTUBE,
  },
].filter((s) => s.href);

export function PublicLayout() {
  const { t } = useTranslation();
  const { user } = useAuth();
  return (
    <div className="public">
      <a href="#main" className="skip-link">
        {t("common.skipToContent")}
      </a>
      <header className="public-header">
        <div className="public-header__inner">
          <Logo />
          <nav className="public-nav" aria-label={t("nav.mainNavigation")}>
            <NavLink to="/" end className="plain">
              {t("nav.home")}
            </NavLink>
            <a className="plain" href="#about">
              {t("nav.about")}
            </a>
            <a className="plain" href="#contact">
              {t("nav.contact")}
            </a>
            <span className="divider" aria-hidden="true" />
            <ThemeToggle />
            <LanguageToggle />
            {user ? (
              <Button variant="primary" size="sm" to={homePathFor(user)}>
                {t("nav.openApp")}
              </Button>
            ) : (
              <Button variant="primary" size="sm" to="/login">
                {t("auth.login")}
              </Button>
            )}
          </nav>
        </div>
      </header>
      <main id="main" tabIndex={-1} style={{ flex: 1 }}>
        <Outlet />
      </main>
      <footer className="site-footer" id="contact">
        <div className="site-footer__inner">
          <Logo light />
          <div className="site-footer__tag">
            <strong>{t("footer.tagline")}</strong>
            <span>{t("footer.subline")}</span>
          </div>
          <div className="site-footer__links">
            <Link to="/">{t("nav.home")}</Link>
            <a href="#about">{t("nav.about")}</a>
            <a href="#contact">{t("nav.contact")}</a>
            {SOCIAL.map(({ icon: Icon, label, href }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Icon size={18} aria-hidden="true" />
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
