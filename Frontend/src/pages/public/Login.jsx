// PLACEHOLDER: Original contents were not present in this checkout.
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LogIn, User } from "lucide-react";
import { useTranslation } from "react-i18next";
import { homePathFor, useAuth } from "../../contexts/AuthContext.jsx";
import { useDocumentTitle } from "../../hooks/useDocumentTitle.js";
import { errorText } from "../../utils/errors.js";
import { Button } from "../../components/common/Button.jsx";
import { Alert } from "../../components/common/Feedback.jsx";
import { PasswordField, TextField } from "../../components/forms/Fields.jsx";

export default function Login() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  useDocumentTitle(t("auth.login"));

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (event) => {
    event.preventDefault();
    const next = {};
    if (identifier.trim().length < 3)
      next.identifier = t("validation.required");
    if (!password) next.password = t("validation.required");
    setErrors(next);
    setFormError("");
    if (Object.keys(next).length) return;

    setBusy(true);
    try {
      const user = await login(identifier.trim(), password);
      const from = location.state?.from;
      // Only same-app paths are honoured, and an admin never lands on a student page.
      const safe =
        typeof from === "string" &&
        from.startsWith("/") &&
        !from.startsWith("//") &&
        (user.role === "admin") === from.startsWith("/admin");
      navigate(safe ? from : homePathFor(user), { replace: true });
    } catch (err) {
      setFormError(errorText(t, err));
      setPassword("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <h1>{t("auth.welcomeBack")}</h1>
      <p className="lead">{t("auth.loginLead")}</p>
      <form className="form-stack" onSubmit={onSubmit} noValidate>
        {location.state?.registered && (
          <Alert variant="success">{t("auth.registeredNotice")}</Alert>
        )}
        {location.state?.passwordReset && (
          <Alert variant="success">{t("auth.passwordResetNotice")}</Alert>
        )}
        {formError && <Alert variant="danger">{formError}</Alert>}
        <TextField
          label={t("auth.identifier")}
          icon={User}
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          error={errors.identifier}
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          placeholder={t("auth.identifierPlaceholder")}
          autoFocus
        />
        <PasswordField
          label={t("auth.password")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          autoComplete="current-password"
          placeholder={t("auth.passwordPlaceholder")}
        />
        <div className="row row--between">
          <span />
          <Link to="/forgot-password" className="sm bold">
            {t("auth.forgotPassword")}
          </Link>
        </div>
        <Button type="submit" variant="primary" size="lg" block loading={busy}>
          <LogIn aria-hidden="true" /> {t("auth.login")}
        </Button>
      </form>
      <p className="auth__alt">
        {t("auth.noAccount")} <Link to="/register">{t("auth.register")}</Link>
      </p>
    </>
  );
}
