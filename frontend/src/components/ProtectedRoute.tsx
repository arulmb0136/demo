import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
  requiredRole?: string | string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermission,
  requiredRole,
}) => {
  const { user, isAuthenticated, isLoading, hasPermission, hasRole } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div style={{ color: 'var(--text-secondary)' }}>Loading session state...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div className="container" style={{ paddingTop: '5rem', paddingBottom: '5rem' }}>
        <div className="card" style={{ maxWidth: '520px', margin: '0 auto', textAlign: 'center', padding: '2.5rem' }}>
          <ShieldAlert size={48} color="var(--danger)" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ fontSize: '1.4rem', marginBottom: '0.75rem' }}>Access Restricted</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
            Your account ({user?.role.toUpperCase()}) lacks the <strong>"{requiredPermission}"</strong> permission required to access this resource.
          </p>
          <a href="/dashboard" className="btn btn-primary">
            Return to Dashboard
          </a>
        </div>
      </div>
    );
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return (
      <div className="container" style={{ paddingTop: '5rem', paddingBottom: '5rem' }}>
        <div className="card" style={{ maxWidth: '520px', margin: '0 auto', textAlign: 'center', padding: '2.5rem' }}>
          <ShieldAlert size={48} color="var(--danger)" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ fontSize: '1.4rem', marginBottom: '0.75rem' }}>Role Authorization Required</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
            This administrative screen is restricted to <strong>{Array.isArray(requiredRole) ? requiredRole.join(', ') : requiredRole}</strong> users.
          </p>
          <a href="/dashboard" className="btn btn-primary">
            Return to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
