import Loader from "@/components/Loader";
import { useAuth } from "@/hooks/useAuth";

import { Navigate, Outlet, useLocation } from "react-router-dom";

export default function ProtectedLayout() {
  const { user, loading } = useAuth();
  const { pathname } = useLocation();

  if (loading) {
    return <Loader />;
  }

  if (user) {
    return <Outlet />;
  }

  return <Navigate to={pathname === "/" ? "/" : `/?next=${pathname}`} />;
}
