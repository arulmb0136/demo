import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, KeyRound, Mail, ArrowRight, CheckCircle2 } from 'lucide-react';

export const SignIn: React.FC = () => {
  const [email, setEmail] = useState('admin@ironclad.demo');
  const [password, setPassword] = useState('Admin123!');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setError(null);
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Invalid email or password');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="container" style={{ paddingTop: '3.5rem', paddingBottom: '4rem', maxWidth: '520px' }}>
      <div className="card" style={{ padding: '2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--accent-primary)',
              color: 'var(--accent-text)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
            }}
          >
            <Shield size={24} />
          </div>
          <h1 style={{ fontSize: '1.45rem', fontWeight: 700, marginBottom: '0.35rem' }}>
            Sign In to Ironclad Hub
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Enter your credentials or choose a pre-seeded demo role below.
          </p>
        </div>

        {error && (
          <div
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              color: '#ef4444',
              padding: '0.65rem 0.85rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
              marginBottom: '1.25rem',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              Work Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@ironclad.demo"
                required
                style={{ paddingLeft: '2.4rem' }}
              />
              <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              Account Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{ paddingLeft: '2.4rem' }}
              />
              <KeyRound size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary"
            style={{ marginTop: '0.5rem', padding: '0.7rem', width: '100%', fontSize: '0.95rem' }}
          >
            {isSubmitting ? 'Authenticating...' : 'Sign In with RBAC'}
            <ArrowRight size={16} />
          </button>
        </form>

        {/* DEMO PERSONA QUICK SELECT */}
        <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem', textAlign: 'center' }}>
            Quick Demo Persona Login (1-Click Fill)
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => handleQuickLogin('admin@ironclad.demo', 'Admin123!')}
              className="btn btn-outline"
              style={{ padding: '0.5rem', fontSize: '0.775rem', justifyContent: 'flex-start' }}
            >
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
              <strong>Admin</strong> (All Perms)
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('manager@ironclad.demo', 'Manager123!')}
              className="btn btn-outline"
              style={{ padding: '0.5rem', fontSize: '0.775rem', justifyContent: 'flex-start' }}
            >
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
              <strong>Manager</strong> (Read/Write/Edit)
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('editor@ironclad.demo', 'Editor123!')}
              className="btn btn-outline"
              style={{ padding: '0.5rem', fontSize: '0.775rem', justifyContent: 'flex-start' }}
            >
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0284c7' }} />
              <strong>Editor</strong> (Write/Edit)
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('viewer@ironclad.demo', 'Viewer123!')}
              className="btn btn-outline"
              style={{ padding: '0.5rem', fontSize: '0.775rem', justifyContent: 'flex-start' }}
            >
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
              <strong>Viewer</strong> (Read Only)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
