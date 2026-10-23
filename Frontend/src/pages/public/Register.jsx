import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AtSign, BadgeCheck, Phone, User, UserPlus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { authApi, referenceApi } from "../../services/endpoints.js";
import { useApi } from "../../hooks/useApi.js";
import { useDocumentTitle } from "../../hooks/useDocumentTitle.js";
import { useLanguage } from "../../contexts/LanguageContext.jsx";
import { useToast } from "../../contexts/ToastContext.jsx";
import { errorText, fieldErrors } from "../../utils/errors.js";
import { facultyName } from "../../utils/names.js";
import * as v from "../../utils/validation.js";
import { Button } from "../../components/common/Button.jsx";
import { Alert } from "../../components/common/Feedback.jsx";
import {
  PasswordField,
  SelectField,
  TextField,
} from "../../components/forms/Fields.jsx";
import { OtpVerifyPanel } from "../../components/forms/OtpVerifyPanel.jsx";

const EMPTY = {
  username: "",
  email: "",
  phone: "",
  studentId: "",
  facultyId: "",
  password: "",
  confirmPassword: "",
};

export default function Register() {
  const { t } = useTranslation();
  const { lang } = useLanguage();
  const toast = useToast();
  const navigate = useNavigate();
  useDocumentTitle(t("auth.register"));

  const faculties = useApi(() => referenceApi.faculties(), []);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const [challenge, setChallenge] = useState(null);

  const set = (field) => (event) =>
    setForm((f) => ({ ...f, [field]: event.target.value }));

  const validate = () =>
    v.collect({
      username: v.username(form.username),
      email: v.email(form.email),
      phone: v.phone(form.phone),
      studentId: v.studentId(form.studentId),
      facultyId: v.faculty(form.facultyId),
      password: v.password(form.password),
      confirmPassword: v.password(form.password)
        ? null
        : v.passwordMatch(form.password, form.confirmPassword),
    });

  const onSubmit = async (event) => {
    event.preventDefault();
    const found = validate();
    setErrors(
      Object.fromEntries(Object.entries(found).map(([k, key]) => [k, t(key)])),
    );
    setFormError("");
    if (Object.keys(found).length) return;

    setBusy(true);
    try {
      const result = await authApi.register({
        username: form.username.trim(),
        email: form.email.trim(),
        phone: v.westernDigits(form.phone).trim(),
        studentId: v.westernDigits(form.studentId).trim(),
        facultyId: Number(form.facultyId),
        password: form.password,
      });
      setChallenge(result);
    } catch (err) {
      const mapped = fieldErrors(t, err);
      if (Object.keys(mapped).length) setErrors(mapped);
      setFormError(errorText(t, err));
    } finally {
      setBusy(false);
    }
  };

  if (challenge) {
    return (
      <>
        <h1>{t("auth.verifyPhoneTitle")}</h1>
        <p className="lead">{t("auth.verifyPhoneLead")}</p>
        <OtpVerifyPanel
          challenge={challenge}
          submitLabel={t("auth.verifyAndCreate")}
          onSubmit={async (code) => {
            await authApi.verifyPhone({
              challengeId: challenge.challengeId,
              code,
            });
            toast.success(t("auth.registeredToast"));
            navigate("/login", { replace: true, state: { registered: true } });
          }}
          onResend={async () =>
            setChallenge(await authApi.resendOtp(challenge.challengeId))
          }
        />
        <p className="auth__alt">
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={() => setChallenge(null)}
          >
            {t("auth.editDetails")}
          </button>
        </p>
      </>
    );
  }

  return (
    <>
      <h1>{t("auth.createAccount")}</h1>
      <p className="lead">{t("auth.registerLead")}</p>
      <form className="form-stack" onSubmit={onSubmit} noValidate>
        {formError && <Alert variant="danger">{formError}</Alert>}
        <TextField
          label={t("auth.username")}
          icon={User}
          value={form.username}
          onChange={set("username")}
          error={errors.username}
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          placeholder={t("auth.usernamePlaceholder")}
          hint={t("auth.usernameHint")}
        />
        <TextField
          label={t("auth.email")}
          icon={AtSign}
          type="email"
          value={form.email}
          onChange={set("email")}
          error={errors.email}
          autoComplete="email"
          autoCapitalize="none"
          placeholder="name@example.com"
          dir="ltr"
        />
        <TextField
          label={t("auth.phone")}
          icon={Phone}
          type="tel"
          value={form.phone}
          onChange={set("phone")}
          error={errors.phone}
          autoComplete="tel"
          placeholder="01XXXXXXXXX"
          hint={t("auth.phoneHint")}
          dir="ltr"
          inputMode="tel"
        />
        <TextField
          label={t("auth.studentId")}
          icon={BadgeCheck}
          value={form.studentId}
          onChange={set("studentId")}
          error={errors.studentId}
          placeholder={t("auth.studentIdPlaceholder")}
          inputMode="numeric"
          dir="ltr"
        />
        <SelectField
          label={t("auth.faculty")}
          value={form.facultyId}
          onChange={set("facultyId")}
          error={errors.facultyId}
          disabled={faculties.loading}
        >
          <option value="">
            {faculties.loading
              ? t("common.loading")
              : t("auth.facultyPlaceholder")}
          </option>
          {(faculties.data ?? []).map((f) => (
            <option key={f.id} value={f.id}>
              {facultyName(f, lang)}
            </option>
          ))}
        </SelectField>
        {faculties.error && <Alert variant="warning">{faculties.error}</Alert>}
        <PasswordField
          label={t("auth.password")}
          value={form.password}
          onChange={set("password")}
          error={errors.password}
          autoComplete="new-password"
          showStrength
          hint={t("auth.passwordHint")}
        />
        <PasswordField
          label={t("auth.confirmPassword")}
          value={form.confirmPassword}
          onChange={set("confirmPassword")}
          error={errors.confirmPassword}
          autoComplete="new-password"
        />
        <Button type="submit" variant="primary" size="lg" block loading={busy}>
          <UserPlus aria-hidden="true" /> {t("auth.register")}
        </Button>
      </form>
      <p className="auth__alt">
        {t("auth.haveAccount")} <Link to="/login">{t("auth.login")}</Link>
      </p>
    </>
  );
}
