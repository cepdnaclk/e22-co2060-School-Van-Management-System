import { Navigate } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";
import { UserRole } from "../features/auth/types";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

/**
 * Wraps routes to require authentication.
 * Optionally restricts access to specific roles.
 */
export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin h-8 w-8 rounded-full border-4 border-slate-200 border-t-blue-600" />
      </div>
    );
  }

  // Not logged in → go to login
  if (!user) {
    if (allowedRoles && allowedRoles.includes("admin")) {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  // Logged in but wrong role → redirect to their dashboard
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const roleHome: Record<string, string> = {
      admin: "/admin/dashboard",
      driver: "/driver",
      parent: "/parent",
    };
    return <Navigate to={roleHome[user.role] || "/login"} replace />;
  }

  return <>{children}</>;
}
