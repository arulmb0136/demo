import React from 'react';
import { Contract } from '../types';
import { Building2, Calendar, FileText, ArrowRight, ShieldCheck, Tag } from 'lucide-react';

interface ContractCardProps {
  contract: Contract;
  onViewDetails: (contract: Contract) => void;
}

export const ContractCard: React.FC<ContractCardProps> = ({
  contract,
  onViewDetails,
}) => {
  const formatCurrency = (val: number, cur: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: cur,
      maximumFractionDigits: 0,
    }).format(val);
  };

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

  const getRecordTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'Property Service Contract':
        return 'border-blue-500/30 bg-blue-500/10 text-blue-400';
      case 'Purchase & Sales Agreement':
        return 'border-purple-500/30 bg-purple-500/10 text-purple-400';
      case 'General Services Agreement':
        return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400';
      default:
        return 'border-border bg-surface text-secondary';
    }
  };

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
        {/* Top Header: Record ID + Record Type */}
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
            {contract.id}
          </span>
          <span
            className={`badge ${getRecordTypeBadgeColor(contract.record_type)}`}
            style={{ fontSize: '0.7rem', padding: '0.2rem 0.6rem', fontWeight: 600 }}
          >
            {contract.record_type}
          </span>
        </div>

        {/* Contract Title */}
        <h3
          style={{
            fontSize: '1.05rem',
            fontWeight: 700,
            marginBottom: '0.5rem',
            color: 'var(--text-primary)',
            lineHeight: 1.35,
          }}
          className="group-hover:text-accent transition-colors"
        >
          {contract.title}
        </h3>

        {/* Counterparty & Department */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.85rem' }}>
          <Building2 size={14} style={{ color: 'var(--accent-primary)' }} />
          <span style={{ fontWeight: 600 }}>{contract.counterparty_name}</span>
          <span>&bull;</span>
          <span>{contract.department || 'Operations'}</span>
        </div>

        {/* Value & Lifecycle Dates Box */}
        <div
          style={{
            backgroundColor: 'var(--bg-input)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.75rem',
            marginBottom: '0.85rem',
            fontSize: '0.75rem',
            border: '1px solid var(--border-color)',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.5rem',
          }}
        >
          <div>
            <span style={{ fontSize: '0.675rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>
              Contract Value
            </span>
            <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {formatCurrency(contract.contract_value, contract.currency)}
            </span>
          </div>
          <div>
            <span style={{ fontSize: '0.675rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>
              Agreement Date
            </span>
            <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              {formatDate(contract.agreement_date)}
            </span>
          </div>
        </div>
      </div>

      {/* Footer: Documents Count & Action */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          <FileText size={14} style={{ color: 'var(--accent-primary)' }} />
          <span>{contract.attachments ? contract.attachments.length : 0} documents</span>
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
