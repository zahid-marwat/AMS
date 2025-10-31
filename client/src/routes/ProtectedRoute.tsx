import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/types';

const roleHome: Record<string, string> = {
  admin: '/admin',
  ADMIN: '/admin',
  teacher: '/teacher',
  TEACHER: '/teacher',
};

type ProtectedRouteProps = {
  allow?: string[];
};

export function ProtectedRoute({ allow }: ProtectedRouteProps) {
  const location = useLocation();
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <span className="text-sm text-slate-500">Loading session…</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Normalize role comparison to be case-insensitive
  const userRoleLower = user.role.toLowerCase();
  const allowedRolesLower = allow?.map(r => r.toLowerCase());

  if (allowedRolesLower && !allowedRolesLower.includes(userRoleLower)) {
    const redirectTarget = roleHome[user.role] || roleHome[userRoleLower];
    return <Navigate to={redirectTarget} replace />;
  }

  return <Outlet />;
}
