import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ApiError } from "../../services/api.js";
import { authApi } from "../../services/endpoints.js";
import { useDocumentTitle } from "../../hooks/useDocumentTitle.js";
import { errorText } from "../../utils/errors.js";
import * as v from "../../utils/validation.js";
import { Button } from "../../components/common/Button.jsx";
import { Alert } from "../../components/common/Feedback.jsx";
import { PasswordField, TextField } from "../../components/forms/Fields.jsx";
import { OtpVerifyPanel } from "../../components/forms/OtpVerifyPanel.jsx";

/**
 * Two steps: (1) enter username/email -> the API answers the same way whether or not the account exists,
 * (2) enter the SMS code and the new password. "Resend" repeats step 1 so the screen never reveals
 * whether the account exists.
 */
export default function ForgotPassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  useDocumentTitle(t("auth.forgotPasswordTitle"));

  const [identifier, setIdentifier] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [challenge, setChallenge] = useState(null);
  const [pw, setPw] = useState({ newPassword: "", confirmPassword: "" });
  const [pwErrors, setPwErrors] = useState({});

  const toChallenge = (result) => {
    const ttl = result.ttlSeconds ?? 300;
    const now = Date.now();
    return {
      challengeId: result.challengeId,
      maskedPhone: t("auth.phoneOnAccount"),
      expiresAt: new Date(now + ttl * 1000).toISOString(),
      resendAvailableAt: new Date(now + 60_000).toISOString(),
    };
  };

  const request = async (event) => {
    event?.preventDefault();
    if (identifier.trim().length < 3) return setError(t("validation.required"));
    setBusy(true);
    setError("");
    try {
      setChallenge(
        toChallenge(await authApi.forgotPassword(identifier.trim())),
      );
    } catch (err) {
      setError(errorText(t, err));
    } finally {
      setBusy(false);
    }
  };

  if (!challenge) {
    return (
      <>
        <h1>{t("auth.forgotPasswordTitle")}</h1>
        <p className="lead">{t("auth.forgotPasswordLead")}</p>
        <form className="form-stack" onSubmit={request} noValidate>
          {error && <Alert variant="danger">{error}</Alert>}
          <TextField
            label={t("auth.identifier")}
            icon={User}
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            placeholder={t("auth.identifierPlaceholder")}
            autoFocus
          />
          <Button
            type="submit"
            variant="primary"
            size="lg"
            block
            loading={busy}
          >
            {t("auth.sendCode")}
          </Button>
        </form>
        <p className="auth__alt">
          <Link to="/login">{t("auth.backToLogin")}</Link>
        </p>
      </>
    );
  }

  return (
    <>
      <h1>{t("auth.resetPasswordTitle")}</h1>
      <p className="lead">{t("auth.resetPasswordLead")}</p>
      <OtpVerifyPanel
        challenge={challenge}
        intro={t("auth.resetCodeIntro")}
        autoFocusCode={false}
        submitLabel={t("auth.resetPassword")}
        onSubmit={async (code) => {
          const found = v.collect({
            newPassword: v.password(pw.newPassword),
            confirmPassword: v.passwordMatch(
              pw.newPassword,
              pw.confirmPassword,
            ),
          });
          setPwErrors(
            Object.fromEntries(
              Object.entries(found).map(([k, key]) => [k, t(key)]),
            ),
          );
          if (Object.keys(found).length)
            throw new ApiError(400, "validation_error");
          await authApi.resetPassword({
            challengeId: challenge.challengeId,
            code,
            newPassword: pw.newPassword,
            confirmPassword: pw.confirmPassword,
          });
          navigate("/login", { replace: true, state: { passwordReset: true } });
        }}
        onResend={async () =>
          setChallenge(
            toChallenge(await authApi.forgotPassword(identifier.trim())),
          )
        }
      >
        <div className="form-stack" style={{ textAlign: "start" }}>
          <PasswordField
            label={t("auth.newPassword")}
            value={pw.newPassword}
            onChange={(e) =>
              setPw((s) => ({ ...s, newPassword: e.target.value }))
            }
            error={pwErrors.newPassword}
            autoComplete="new-password"
            showStrength
            hint={t("auth.passwordHint")}
            autoFocus
          />
          <PasswordField
            label={t("auth.confirmPassword")}
            value={pw.confirmPassword}
            onChange={(e) =>
              setPw((s) => ({ ...s, confirmPassword: e.target.value }))
            }
            error={pwErrors.confirmPassword}
            autoComplete="new-password"
          />
        </div>
      </OtpVerifyPanel>
      <p className="auth__alt">
        <Link to="/login">{t("auth.backToLogin")}</Link>
      </p>
    </>
  );
}
