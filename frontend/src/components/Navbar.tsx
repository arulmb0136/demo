import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ThemeSelector } from './ThemeSelector';
import { NotificationCenter } from './NotificationCenter';
import { Shield, User as UserIcon, LogOut, FileText, Settings } from 'lucide-react';

interface NavbarProps {
  onSelectContract?: (recordId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onSelectContract }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/signin');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-color)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' }}>
        {/* Brand Logo & Name */}
        <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--accent-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-text)',
            }}
          >
            <Shield size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.05rem', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
              Ironclad Hub
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
              Live Contract Engine
            </div>
          </div>
        </Link>

        {/* Navigation Tabs */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {isAuthenticated && (
            <Link
              to="/dashboard"
              style={{
                padding: '0.45rem 0.85rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                borderRadius: 'var(--radius-sm)',
                color: isActive('/dashboard') ? 'var(--accent-primary)' : 'var(--text-secondary)',
                backgroundColor: isActive('/dashboard') ? 'var(--accent-soft)' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <FileText size={16} />
              Dashboard
            </Link>
          )}

          {/* User Management Link for Admin, Manager, and Editor */}
          {isAuthenticated && (['admin', 'manager', 'editor'].includes(user?.role || '')) && (
            <Link
              to="/admin/roles"
              style={{
                padding: '0.45rem 0.85rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                borderRadius: 'var(--radius-sm)',
                color: isActive('/admin/roles') ? 'var(--accent-primary)' : 'var(--text-secondary)',
                backgroundColor: isActive('/admin/roles') ? 'var(--accent-soft)' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <Settings size={16} />
              User &amp; Role Management
            </Link>
          )}
        </nav>

        {/* Right Section: Notification Center + Theme Selector + Auth Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          {/* Post-login live notifications */}
          {isAuthenticated && (
            <NotificationCenter onSelectContract={onSelectContract} />
          )}

          <ThemeSelector />

          {isAuthenticated && user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--accent-soft)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--accent-primary)',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                  }}
                >
                  {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div style={{ display: 'none', flexDirection: 'column' }} className="user-text-md">
                  <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{user.full_name}</div>
                  <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>
                    {user.role.toUpperCase()}
                  </div>
                </div>
              </div>

              <span
                className="badge"
                style={{
                  fontSize: '0.675rem',
                  padding: '0.15rem 0.5rem',
                  backgroundColor:
                    user.role === 'admin'
                      ? 'rgba(239, 68, 68, 0.15)'
                      : user.role === 'manager'
                      ? 'rgba(245, 158, 11, 0.15)'
                      : 'rgba(2, 132, 199, 0.15)',
                  color:
                    user.role === 'admin'
                      ? '#ef4444'
                      : user.role === 'manager'
                      ? '#f59e0b'
                      : 'var(--accent-primary)',
                  border: '1px solid currentColor',
                }}
              >
                {user.role}
              </span>

              <button
                onClick={handleLogout}
                className="btn btn-outline"
                style={{ padding: '0.4rem 0.65rem' }}
                title="Sign out of platform"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <Link to="/signin" className="btn btn-primary" style={{ padding: '0.45rem 1rem' }}>
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
