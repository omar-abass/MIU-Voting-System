// PLACEHOLDER: Original contents were not present in this checkout.
import { motion } from "framer-motion";
import {
  Eye,
  Fingerprint,
  KeyRound,
  LockKeyhole,
  UserPlus,
  UsersRound,
  Vote,
  BarChart3,
  MousePointerClick,
  ShieldCheck,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { homePathFor, useAuth } from "../../contexts/AuthContext.jsx";
import { useDocumentTitle } from "../../hooks/useDocumentTitle.js";
import { Button } from "../../components/common/Button.jsx";
import { HeroScene } from "../../components/animations/HeroScene.jsx";

const FEATURES = [
  { icon: LockKeyhole, key: "secure" },
  { icon: Eye, key: "transparent" },
  { icon: MousePointerClick, key: "easy" },
];

const STEPS = [
  { icon: UserPlus, key: "register" },
  { icon: UsersRound, key: "clubs" },
  { icon: KeyRound, key: "vote" },
  { icon: BarChart3, key: "results" },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function Landing() {
  const { t } = useTranslation();
  const { user } = useAuth();
  useDocumentTitle();

  return (
    <>
      <section className="hero">
        <div className="hero__inner">
          <motion.div variants={container} initial="hidden" animate="show">
            <motion.p variants={item} className="hero__eyebrow">
              {t("app.universityName")}
            </motion.p>
            <motion.h1 variants={item}>
              {t("landing.titleBefore")} <em>{t("landing.titleEm")}</em>{" "}
              {t("landing.titleAfter")}
            </motion.h1>
            <motion.p variants={item} className="hero__tag">
              {t("landing.tag")}
            </motion.p>
            <motion.p variants={item} className="hero__lead">
              {t("landing.lead")}
            </motion.p>
            <motion.div variants={item} className="hero__actions">
              {user ? (
                <Button variant="primary" size="lg" to={homePathFor(user)}>
                  {t("nav.openApp")}
                </Button>
              ) : (
                <>
                  <Button variant="primary" size="lg" to="/register">
                    {t("landing.getStarted")}
                  </Button>
                  <Button size="lg" to="/login">
                    {t("auth.login")}
                  </Button>
                </>
              )}
              <Button
                size="lg"
                variant="ghost"
                onClick={() =>
                  document
                    .getElementById("about")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                {t("landing.learnMore")}
              </Button>
            </motion.div>
            <motion.div variants={item} className="hero__features">
              {FEATURES.map(({ icon: Icon, key }) => (
                <div className="feature" key={key}>
                  <span className="ico">
                    <Icon aria-hidden="true" />
                  </span>
                  <span>{t(`landing.features.${key}`)}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>
          <HeroScene />
        </div>
      </section>

      <section
        id="about"
        style={{
          padding: "clamp(40px, 6vw, 80px) clamp(16px, 3vw, 36px)",
          background: "var(--surface)",
        }}
      >
        <div style={{ maxWidth: 1240, marginInline: "auto" }}>
          <h2
            style={{ fontSize: "clamp(24px, 3vw, 34px)", textAlign: "center" }}
          >
            {t("landing.howTitle")}
          </h2>
          <p
            className="muted"
            style={{
              textAlign: "center",
              margin: "8px auto 36px",
              maxWidth: 620,
            }}
          >
            {t("landing.howLead")}
          </p>
          <ol className="grid grid--4 list-reset" role="list">
            {STEPS.map(({ icon: Icon, key }, index) => (
              <li key={key} className="card" style={{ position: "relative" }}>
                <div className="stat__icon" style={{ marginBottom: 12 }}>
                  <Icon aria-hidden="true" />
                </div>
                <div className="faint sm bold" aria-hidden="true">
                  0{index + 1}
                </div>
                <h3 style={{ fontSize: 17, margin: "2px 0 6px" }}>
                  {t(`landing.steps.${key}.title`)}
                </h3>
                <p className="muted sm">{t(`landing.steps.${key}.text`)}</p>
              </li>
            ))}
          </ol>

          <div className="grid grid--3" style={{ marginTop: 28 }}>
            {[
              { icon: Fingerprint, key: "oneVote" },
              { icon: ShieldCheck, key: "privacy" },
              { icon: Vote, key: "fair" },
            ].map(({ icon: Icon, key }) => (
              <div
                key={key}
                className="card card--flat"
                style={{ background: "var(--surface-2)" }}
              >
                <div
                  className="row"
                  style={{ marginBottom: 6, flexWrap: "nowrap" }}
                >
                  <Icon
                    aria-hidden="true"
                    size={20}
                    style={{ color: "var(--primary-text)" }}
                  />
                  <h3 style={{ fontSize: 16 }}>
                    {t(`landing.promises.${key}.title`)}
                  </h3>
                </div>
                <p className="muted sm">{t(`landing.promises.${key}.text`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
