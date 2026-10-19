import { Compass } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useDocumentTitle } from "../../hooks/useDocumentTitle.js";
import { homePathFor, useAuth } from "../../contexts/AuthContext.jsx";
import { Button } from "../../components/common/Button.jsx";
import { EmptyState } from "../../components/common/Feedback.jsx";

export default function NotFound() {
  const { t } = useTranslation();
  const { user } = useAuth();
  useDocumentTitle(t("notFound.title"));
  return (
    <div
      style={{
        minHeight: "70vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
      }}
    >
      <EmptyState
        icon={Compass}
        title={t("notFound.title")}
        text={t("notFound.text")}
        action={
          <Button variant="primary" to={user ? homePathFor(user) : "/"}>
            {user ? t("notFound.backToApp") : t("notFound.backHome")}
          </Button>
        }
      />
    </div>
  );
}
