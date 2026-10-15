import React from 'react';
import { Contract } from '../types';
import { Building2, Calendar, FileText, ArrowRight, ShieldCheck, Tag, Clock } from 'lucide-react';

interface ContractCardProps {
  contract: Contract;
  onViewDetails: (contract: Contract) => void;
}

export const ContractCard: React.FC<ContractCardProps> = ({
  contract,
  onViewDetails,
}) => {
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const getRecordTypeBadge = (type?: string) => {
    const t = type || '';
    if (t.includes('Property') || t.includes('propertyServiceContractBh')) {
      return { label: 'Property Service', color: 'border-blue-500/30 bg-blue-500/10 text-blue-400' };
    }
    if (t.includes('Purchase') || t.includes('purchaseSaleAgreementBh')) {
      return { label: 'Purchase & Sale', color: 'border-purple-500/30 bg-purple-500/10 text-purple-400' };
    }
    if (t.includes('General') || t.includes('generalServicesAgreementBh')) {
      return { label: 'General Services', color: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' };
    }
    return { label: t || 'Contract', color: 'border-border bg-surface text-secondary' };
  };

  const getStatusBadge = () => {
    const status = (contract.enhanced_status || contract.status || 'active').toLowerCase();
    if (status.includes('auto-renew') || status.includes('active')) {
      return { label: contract.enhanced_status || 'Active', bg: 'rgba(34, 197, 94, 0.15)', text: '#22c55e', border: 'rgba(34, 197, 94, 0.3)' };
    }
    if (status.includes('indeterminate') || status.includes('review') || status.includes('draft')) {
      return { label: contract.enhanced_status || contract.status || 'Pending', bg: 'rgba(234, 179, 8, 0.15)', text: '#eab308', border: 'rgba(234, 179, 8, 0.3)' };
    }
    return { label: contract.status || 'Active', bg: 'rgba(148, 163, 184, 0.15)', text: '#94a3b8', border: 'rgba(148, 163, 184, 0.3)' };
  };

  const typeBadge = getRecordTypeBadge(contract.type_display_name || contract.type || contract.record_type);
  const statusBadge = getStatusBadge();
  const attachmentCount = contract.attachment_count ?? (contract.attachments ? contract.attachments.length : 0);

  return (
    <div
      onClick={() => onViewDetails(contract)}
      className="card group cursor-pointer hover:border-accent hover:shadow-xl transition-all duration-200 flex flex-col justify-between"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: '1.25rem',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-color)',
        backgroundColor: 'var(--bg-surface)',
      }}
    >
      <div>
        {/* Top Header: Friendly Ironclad ID + Type Badge */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span
            style={{
              fontFamily: 'monospace',
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '0.2rem 0.5rem',
              borderRadius: '4px',
              backgroundColor: 'var(--bg-input)',
              color: 'var(--accent-primary)',
              border: '1px solid var(--border-color)',
            }}
          >
            {contract.ironclad_id || contract.id}
          </span>
          <span
            className={`badge ${typeBadge.color}`}
            style={{ fontSize: '0.7rem', padding: '0.2rem 0.6rem', fontWeight: 600 }}
          >
            {typeBadge.label}
          </span>
        </div>

        {/* Contract Title / Name */}
        <h3
          style={{
            fontSize: '1rem',
            fontWeight: 700,
            marginBottom: '0.5rem',
            color: 'var(--text-primary)',
            lineHeight: 1.35,
          }}
          className="group-hover:text-accent transition-colors"
        >
          {contract.name || contract.title}
        </h3>

        {/* Counterparty & Community Name */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Building2 size={13} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }} className="truncate">
              {contract.counterparty_name}
            </span>
          </div>
          {contract.community_name && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <span>Community:</span>
              <span className="truncate">{contract.community_name}</span>
            </div>
          )}
        </div>

        {/* Simplified Dates & Status Grid */}
        <div
          style={{
            backgroundColor: 'var(--bg-input)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.65rem 0.75rem',
            marginBottom: '0.85rem',
            fontSize: '0.75rem',
            border: '1px solid var(--border-color)',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.5rem',
          }}
        >
          <div>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>
              Effective Date
            </span>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {formatDate(contract.effective_date || contract.agreement_date)}
            </span>
          </div>
          <div>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>
              Expiration Date
            </span>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              {formatDate(contract.expiration_date || contract.completion_date)}
            </span>
          </div>
        </div>
      </div>

      {/* Footer: Status Badge, Document Count & Action */}
      <div
        style={{
          marginTop: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '0.75rem',
          borderTop: '1px solid var(--border-color)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span
            style={{
              fontSize: '0.675rem',
              fontWeight: 700,
              padding: '0.2rem 0.5rem',
              borderRadius: '9999px',
              backgroundColor: statusBadge.bg,
              color: statusBadge.text,
              border: `1px solid ${statusBadge.border}`,
              textTransform: 'capitalize',
            }}
          >
            {statusBadge.label}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <FileText size={13} />
            <span>{attachmentCount}</span>
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails(contract);
          }}
          className="btn btn-secondary"
          style={{
            padding: '0.35rem 0.75rem',
            fontSize: '0.75rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem',
          }}
        >
          <span>View Details</span>
          <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );
};
