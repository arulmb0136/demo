import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, ArrowRight, Zap, RefreshCw, BarChart3, Database, Lock, CheckCircle } from 'lucide-react';

export const Home: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div style={{ paddingBottom: '4rem' }}>
      {/* HERO SECTION */}
      <section
        style={{
          padding: '5rem 0 4rem',
          textAlign: 'center',
          background: 'radial-gradient(ellipse at top, var(--accent-soft) 0%, transparent 70%)',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        <div className="container" style={{ maxWidth: '900px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.35rem 0.95rem',
              borderRadius: '9999px',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: 'var(--accent-primary)',
              marginBottom: '1.5rem',
            }}
          >
            <Shield size={14} />
            Enterprise Contract Lifecycle Architecture &amp; Analytics
          </div>

          <h1
            style={{
              fontSize: 'clamp(2.2rem, 5vw, 3.4rem)',
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              marginBottom: '1.25rem',
            }}
          >
            Orchestrate Contracts with <span style={{ color: 'var(--accent-primary)' }}>Ironclad API</span> &amp; Real-Time Intelligence
          </h1>

          <p
            style={{
              fontSize: '1.15rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              marginBottom: '2rem',
              maxWidth: '740px',
              margin: '0 auto 2.25rem',
            }}
          >
            A high-performance layered platform featuring React, FastAPI, zero-trust RBAC, 8 dynamic UI themes, centralized correlation tracing, PostgreSQL persistence, and AWS S3 document management.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            {isAuthenticated ? (
              <Link to="/dashboard" className="btn btn-primary" style={{ padding: '0.75rem 1.75rem', fontSize: '1rem' }}>
                Open Dashboard &amp; BI Tool
                <ArrowRight size={18} />
              </Link>
            ) : (
              <Link to="/signin" className="btn btn-primary" style={{ padding: '0.75rem 1.75rem', fontSize: '1rem' }}>
                Sign In to Platform
                <ArrowRight size={18} />
              </Link>
            )}
            <a
              href="http://localhost:8000/docs"
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary"
              style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}
            >
              Interactive Swagger Docs
            </a>
          </div>
        </div>
      </section>

      {/* CORE CAPABILITIES GRID */}
      <section className="container" style={{ paddingTop: '4rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Engineered for High-Scale Enterprise Compliance
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
            Fully decoupled layered architecture separating API routing, domain business logic, data persistence, and UI rendering.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem',
          }}
        >
          <div className="card">
            <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)', marginBottom: '1rem' }}>
              <RefreshCw size={22} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Ironclad API Dual Toggle
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Seamlessly toggle between live <code>developer.ironcladapp.com</code> API sync (OAuth2 / Client ID &amp; Secret) and high-speed local PostgreSQL storage with one click.
            </p>
          </div>

          <div className="card">
            <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', marginBottom: '1rem' }}>
              <Lock size={22} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Strict RBAC &amp; Permission Matrix
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Role-based access control with 4 standard personas (Admin, Manager, Editor, Viewer) backed by granular read, write, edit, and delete permissions enforced at every endpoint.
            </p>
          </div>

          <div className="card">
            <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(6, 182, 212, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#06b6d4', marginBottom: '1rem' }}>
              <BarChart3 size={22} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Lite BI Visualization Engine
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Executive intelligence suite featuring portfolio metrics, contract lifecycle donuts, monthly trendlines, counterparty exposure rankings, and dynamic threshold slicing.
            </p>
          </div>

          <div className="card">
            <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b', marginBottom: '1rem' }}>
              <Database size={22} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              S3 Storage &amp; Presigned URLs
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Direct integration with AWS S3 and MinIO with presigned download URLs, multipart file uploads, and resilient local disk fallback for developer ease.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
