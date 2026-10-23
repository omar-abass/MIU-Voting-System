import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Spinner } from "../components/common/Feedback.jsx";
import { homePathFor, useAuth } from "../contexts/AuthContext.jsx";

function Booting() {
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
      <Spinner />
    </div>
  );
}

/** Signed-in users only. The role checks here are a UX convenience; the API enforces the real RBAC. */
export function RequireAuth({ roles }) {
  const { user, ready } = useAuth();
  const location = useLocation();
  if (!ready) return <Booting />;
  if (!user)
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  if (roles && !roles.includes(user.role))
    return <Navigate to={homePathFor(user)} replace />;
  return <Outlet />;
}

/** Student-facing area: admins are sent to their own console. */
export const VOTER_ROLES = ["student", "club_manager"];

/** Login / register pages: signed-in users are redirected to their home. */
export function PublicOnly() {
  const { user, ready } = useAuth();
  if (!ready) return <Booting />;
  if (user) return <Navigate to={homePathFor(user)} replace />;
  return <Outlet />;
}
