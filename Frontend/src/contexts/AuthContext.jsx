import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { authApi, userApi } from "../services/endpoints.js";
import { onUnauthorized, setCsrfToken } from "../services/api.js";
import { useToast } from "./ToastContext.jsx";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const { t } = useTranslation();
  const toast = useToast();
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const wasSignedIn = useRef(false);

  const applySession = useCallback((data) => {
    setCsrfToken(data?.csrfToken ?? null);
    setUser(data?.user ?? null);
    wasSignedIn.current = Boolean(data?.user);
  }, []);

  // Resume a session after a page reload (the HttpOnly cookie is sent automatically).
  useEffect(() => {
    let cancelled = false;
    authApi
      .me()
      .then((data) => !cancelled && applySession(data))
      .catch(() => !cancelled && applySession(null))
      .finally(() => !cancelled && setReady(true));
    return () => {
      cancelled = true;
    };
  }, [applySession]);

  // Any protected request that comes back 401 means the session is gone (expired or revoked).
  useEffect(() => {
    onUnauthorized(() => {
      if (wasSignedIn.current) toast.warning(t("auth.sessionExpired"));
      applySession(null);
    });
    return () => onUnauthorized(null);
  }, [applySession, toast, t]);

  const login = useCallback(
    async (identifier, password) => {
      const data = await authApi.login({ identifier, password });
      applySession(data);
      return data.user;
    },
    [applySession],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      /* the local session is cleared regardless */
    }
    applySession(null);
  }, [applySession]);

  const refreshUser = useCallback(async () => {
    const fresh = await userApi.me();
    setUser(fresh);
    return fresh;
  }, []);

  const value = useMemo(
    () => ({ user, ready, login, logout, refreshUser, setUser }),
    [user, ready, login, logout, refreshUser],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

export const homePathFor = (user) =>
  user?.role === "admin" ? "/admin" : "/dashboard";
