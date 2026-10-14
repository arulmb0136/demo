import React from 'react';
import { Contract, ContractAttachment } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  X,
  FileText,
  Download,
  Eye,
  Lock,
  Calendar,
  Building2,
  DollarSign,
  Tag,
  Clock,
  Mail,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';

interface ContractDetailModalProps {
  contract: Contract | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ContractDetailModal: React.FC<ContractDetailModalProps> = ({
  contract,
  isOpen,
  onClose,
}) => {
  const { hasPermission } = useAuth();

  if (!isOpen || !contract) return null;

  const canView = hasPermission('contracts:view');
  const canDownload = hasPermission('contracts:download');

  const handleViewDocument = (att: ContractAttachment) => {
    if (!canView) return;
    const viewUrl = `/api/v1/contracts/${contract.id}/attachments/${encodeURIComponent(att.key)}?disposition=inline`;
    window.open(viewUrl, '_blank');
  };

  const handleDownloadDocument = (att: ContractAttachment) => {
    if (!canDownload) return;
    const downloadUrl = `/api/v1/contracts/${contract.id}/attachments/${encodeURIComponent(att.key)}?disposition=attachment`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = att.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 KB';
    if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + ' MB';
    return Math.round(bytes / 1024) + ' KB';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border border-border bg-surface shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface-hover">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-accent/15 text-accent border border-accent/30">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-surface border border-border text-accent font-semibold">
                  {contract.id}
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-accent/20 text-accent font-medium">
                  {contract.record_type}
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-success/20 text-success font-semibold uppercase tracking-wider">
                  {contract.status}
                </span>
              </div>
              <h2 className="text-lg font-bold text-primary mt-1">{contract.title}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-secondary hover:text-primary hover:bg-surface border border-transparent hover:border-border transition-all"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-border bg-surface-hover/50">
              <div className="flex items-center gap-2 text-secondary text-xs mb-1">
                <Building2 className="w-4 h-4 text-accent" />
                <span>Counterparty</span>
              </div>
              <p className="text-sm font-semibold text-primary truncate">{contract.counterparty_name}</p>
            </div>

            <div className="p-4 rounded-xl border border-border bg-surface-hover/50">
              <div className="flex items-center gap-2 text-secondary text-xs mb-1">
                <DollarSign className="w-4 h-4 text-success" />
                <span>Total Contract Value</span>
              </div>
              <p className="text-sm font-bold text-primary">
                {formatCurrency(contract.contract_value, contract.currency)}
              </p>
            </div>

            <div className="p-4 rounded-xl border border-border bg-surface-hover/50">
              <div className="flex items-center gap-2 text-secondary text-xs mb-1">
                <Tag className="w-4 h-4 text-accent" />
                <span>Department</span>
              </div>
              <p className="text-sm font-semibold text-primary">{contract.department || 'General'}</p>
            </div>

            <div className="p-4 rounded-xl border border-border bg-surface-hover/50">
              <div className="flex items-center gap-2 text-secondary text-xs mb-1">
                <Mail className="w-4 h-4 text-accent" />
                <span>Creator Email</span>
              </div>
              <p className="text-sm font-semibold text-primary truncate">{contract.creator_email || 'N/A'}</p>
            </div>
          </div>

          {/* Lifecycle & Tracking Dates */}
          <div className="p-5 rounded-xl border border-border bg-surface">
            <h3 className="text-xs font-bold text-secondary uppercase tracking-wider mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-accent" />
              Agreement Lifecycle & Audit Dates
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-secondary block mb-0.5">Formal Agreement Date</span>
                <span className="font-semibold text-primary">{formatDate(contract.agreement_date)}</span>
              </div>
              <div>
                <span className="text-secondary block mb-0.5">Start Date</span>
                <span className="font-semibold text-primary">{formatDate(contract.start_date)}</span>
              </div>
              <div>
                <span className="text-secondary block mb-0.5">Completion / Expiration</span>
                <span className="font-semibold text-primary">{formatDate(contract.completion_date)}</span>
              </div>
              <div>
                <span className="text-secondary block mb-0.5">Ironclad Last Synced</span>
                <span className="font-semibold text-accent font-mono">{formatDate(contract.last_synced_date)}</span>
              </div>
            </div>
          </div>

          {/* Document Attachments Section */}
          <div className="p-5 rounded-xl border border-border bg-surface">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-accent" />
                <h3 className="text-sm font-bold text-primary">
                  Document Attachments ({contract.attachments?.length || 0})
                </h3>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className={`px-2 py-0.5 rounded flex items-center gap-1 ${canView ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'}`}>
                  {canView ? '✓ View Allowed' : '✗ View Restricted'}
                </span>
                <span className={`px-2 py-0.5 rounded flex items-center gap-1 ${canDownload ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'}`}>
                  {canDownload ? '✓ Download Allowed' : '✗ Download Restricted'}
                </span>
              </div>
            </div>

            {(!contract.attachments || contract.attachments.length === 0) ? (
              <p className="text-xs text-secondary italic">No document attachments found for this record.</p>
            ) : (
              <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
                {contract.attachments.map((att) => (
                  <div
                    key={att.key}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 hover:bg-surface-hover gap-3 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-lg bg-surface border border-border text-accent">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-primary truncate">{att.name}</p>
                        <p className="text-xs text-secondary">
                          {formatFileSize(att.file_size)} • {att.content_type}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      {/* View Document Button */}
                      <button
                        onClick={() => handleViewDocument(att)}
                        disabled={!canView}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          canView
                            ? 'bg-surface hover:bg-surface-hover text-primary border border-border hover:border-accent'
                            : 'opacity-50 cursor-not-allowed bg-surface text-secondary border border-border'
                        }`}
                        title={canView ? 'View document inline' : 'View permission required'}
                      >
                        {canView ? <Eye className="w-3.5 h-3.5 text-accent" /> : <Lock className="w-3.5 h-3.5" />}
                        View
                      </button>

                      {/* Download Document Button */}
                      <button
                        onClick={() => handleDownloadDocument(att)}
                        disabled={!canDownload}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          canDownload
                            ? 'bg-accent text-black hover:opacity-90 shadow-sm'
                            : 'opacity-50 cursor-not-allowed bg-surface text-secondary border border-border'
                        }`}
                        title={canDownload ? 'Download official attachment' : 'Download permission required by policy'}
                      >
                        {canDownload ? <Download className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                        Download
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Custom Attributes (if any) */}
          {contract.attributes && Object.keys(contract.attributes).length > 0 && (
            <div className="p-5 rounded-xl border border-border bg-surface">
              <h3 className="text-xs font-bold text-secondary uppercase tracking-wider mb-3">
                Repository Custom Properties (Ironclad Schema)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {Object.entries(contract.attributes).map(([key, val]) => (
                  <div key={key} className="p-2.5 rounded-lg bg-surface-hover border border-border flex justify-between gap-2">
                    <span className="font-mono text-secondary">{key}:</span>
                    <span className="font-medium text-primary text-right truncate">
                      {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-border bg-surface-hover text-xs text-secondary">
          <span>Source: Live Ironclad API (Zero Database Storage)</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-border bg-surface text-primary font-medium hover:bg-surface-hover transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
