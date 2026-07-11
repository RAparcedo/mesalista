import { Navigate } from "react-router-dom";
import { isLoggedIn } from "../lib/auth";

// Redirects to the login page when there's no stored token. The token is
// still verified by the server on every request — this only improves UX.
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!isLoggedIn()) {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
}
