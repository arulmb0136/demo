import React from 'react';
import { ShieldCheck, Database, Cloud } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border-color)',
        padding: '1.75rem 0',
        marginTop: 'auto',
        fontSize: '0.825rem',
        color: 'var(--text-secondary)',
      }}
    >
      <div className="container" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldCheck size={18} color="var(--accent-primary)" />
          <span>Ironclad Contract Hub v1.0 &bull; Layered Enterprise Architecture</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Database size={15} color="var(--success)" />
            <span>PostgreSQL 16 Storage</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Cloud size={15} color="var(--info)" />
            <span>developer.ironcladapp.com Sync</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span>AWS S3 / MinIO Ready</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
