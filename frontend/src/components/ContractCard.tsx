import React from 'react';
import { Contract } from '../types';
import { useAuth } from '../context/AuthContext';
import { Building2, Calendar, Paperclip, Edit, Trash2, Clock, CheckCircle2 } from 'lucide-react';

interface ContractCardProps {
  contract: Contract;
  onEdit: (contract: Contract) => void;
  onDelete: (id: number) => void;
  onViewDetails: (contract: Contract) => void;
}

export const ContractCard: React.FC<ContractCardProps> = ({
  contract,
  onEdit,
  onDelete,
  onViewDetails,
}) => {
  const { hasPermission } = useAuth();

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

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'signed':
        return 'badge-signed';
      case 'in_review':
        return 'badge-in_review';
      case 'out_for_signature':
        return 'badge-out_for_signature';
      case 'archived':
        return 'badge-archived';
      default:
        return 'badge-draft';
    }
  };

  const formatStatus = (s: string) => {
    return s.replace(/_/g, ' ');
  };

  const startDate = contract.start_date || contract.agreement_date || contract.effective_date;
  const completionDate = contract.completion_date || contract.expiration_date;
  const progressPercent = contract.progress_percent ?? 50;

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Top Header: Counterparty + Status Badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          <Building2 size={15} />
          <span style={{ fontWeight: 600 }}>{contract.counterparty_name}</span>
        </div>
        <span className={`badge ${getStatusBadgeClass(contract.status)}`}>
          {formatStatus(contract.status)}
        </span>
      </div>

      {/* Contract Title & Template */}
      <h3
        style={{
          fontSize: '1.05rem',
          fontWeight: 700,
          marginBottom: '0.4rem',
          color: 'var(--text-primary)',
          cursor: 'pointer',
        }}
        onClick={() => onViewDetails(contract)}
      >
        {contract.title}
      </h3>

      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
        <span>{contract.template_name}</span>
        <span>&bull;</span>
        <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>{contract.department}</span>
        {contract.record_type && contract.record_type !== 'contract' && (
          <span style={{ padding: '0.1rem 0.4rem', borderRadius: '4px', backgroundColor: 'var(--bg-input)', fontSize: '0.675rem', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
            Type: {contract.record_type}
          </span>
        )}
      </div>

      {/* TIMELINE & TRACKING DATES SECTION (Ironclad Data Lake Schema) */}
      <div
        style={{
          backgroundColor: 'var(--bg-input)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.75rem',
          marginBottom: '0.85rem',
          fontSize: '0.75rem',
          border: '1px solid var(--border-color)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Calendar size={13} color="var(--accent-primary)" />
            <span>Start: <strong>{formatDate(startDate)}</strong></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Clock size={13} color="var(--info)" />
            <span>Target: <strong>{formatDate(completionDate)}</strong></span>
          </div>
        </div>

        {/* Progress Bar & Days Remaining */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.35rem' }}>
          <div style={{ flex: 1, height: '5px', backgroundColor: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${progressPercent}%`,
                height: '100%',
                backgroundColor: progressPercent >= 100 ? 'var(--success)' : 'var(--accent-primary)',
                borderRadius: '3px',
              }}
            />
          </div>
          <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)' }}>
            {contract.days_remaining !== undefined && contract.days_remaining !== null
              ? contract.days_remaining > 0
                ? `${contract.days_remaining}d left`
                : 'Completed'
              : `${progressPercent}%`}
          </span>
        </div>
      </div>

      {/* Meta: Value & Documents */}
      <div
        style={{
          backgroundColor: 'var(--bg-input)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.75rem',
          marginBottom: '1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Contract Value</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {formatCurrency(contract.contract_value, contract.currency)}
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Documents</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.875rem', fontWeight: 600 }}>
            <Paperclip size={14} color="var(--accent-primary)" />
            <span>{contract.documents ? contract.documents.length : 0}</span>
          </div>
        </div>
      </div>

      {/* Card Action Buttons */}
      <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
        <button
          onClick={() => onViewDetails(contract)}
          className="btn btn-secondary"
          style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
        >
          View Details &amp; Timeline
        </button>

        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {hasPermission('edit') && (
            <button
              onClick={() => onEdit(contract)}
              className="btn btn-outline"
              style={{ padding: '0.4rem 0.6rem' }}
              title="Edit Contract (requires 'edit' permission)"
            >
              <Edit size={14} />
            </button>
          )}

          {hasPermission('delete') && (
            <button
              onClick={() => onDelete(contract.id)}
              className="btn btn-outline"
              style={{ padding: '0.4rem 0.6rem', color: 'var(--danger)' }}
              title="Delete Contract (requires 'delete' permission)"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
