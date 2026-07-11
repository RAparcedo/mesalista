import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Redirects to the login page when not logged in. The token is still
// verified by the server on every request — this only improves UX.
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useAuth();

  if (!isLoggedIn) {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
}
