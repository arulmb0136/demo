import React, { useEffect, useState } from 'react';
import { Contract, ContractAttachment } from '../types';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';
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
  RefreshCw,
  Hash,
  Info,
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
  const [detail, setDetail] = useState<Contract | null>(contract);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && contract?.id) {
      setDetail(contract);
      // Fetch full details and backend-filtered attachments
      const fetchDetail = async () => {
        try {
          setIsLoading(true);
          const res = await apiClient.get<Contract>(`/contracts/${contract.id}`);
          if (res.data) {
            setDetail(res.data);
          }
        } catch (err) {
          console.warn('Could not fetch updated contract detail, using cached data:', err);
        } finally {
          setIsLoading(false);
        }
      };
      fetchDetail();
    }
  }, [isOpen, contract?.id]);

  if (!isOpen || !contract) return null;

  const current = detail || contract;

  // Permissions are evaluated both from backend responses and user context
  const canView = current.permissions?.can_view_attachments ?? hasPermission('contracts:view');
  const canDownload = current.permissions?.can_download_attachments ?? hasPermission('contracts:download');

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  const token = localStorage.getItem('ironclad_token') || '';

  const handleViewDocument = (att: ContractAttachment) => {
    if (!canView || !att.view_url) return;
    const rawUrl = att.view_url.startsWith('http') ? att.view_url : `${API_BASE_URL}${att.view_url}`;
    const url = token ? `${rawUrl}${rawUrl.includes('?') ? '&' : '?'}token=${encodeURIComponent(token)}` : rawUrl;
    window.open(url, '_blank');
  };

  const handleDownloadDocument = (att: ContractAttachment) => {
    if (!canDownload || !att.download_url) return;
    const rawUrl = att.download_url.startsWith('http') ? att.download_url : `${API_BASE_URL}${att.download_url}`;
    const url = token ? `${rawUrl}${rawUrl.includes('?') ? '&' : '?'}token=${encodeURIComponent(token)}` : rawUrl;
    const link = document.createElement('a');
    link.href = url;
    link.download = att.filename || att.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border border-border bg-surface shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface-hover">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-accent/15 text-accent border border-accent/30">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-surface border border-border text-accent font-semibold">
                  {current.ironclad_id || current.id}
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-accent/20 text-accent font-medium">
                  {current.type_display_name || current.type || current.record_type}
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-success/20 text-success font-semibold uppercase tracking-wider">
                  {current.enhanced_status || current.status || 'Active'}
                </span>
              </div>
              <h2 className="text-lg font-bold text-primary mt-1">{current.name || current.title}</h2>
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

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Status Message / Alert Banner */}
          {current.status_message && (
            <div className="p-3.5 rounded-xl border border-border bg-surface-hover/70 flex items-start gap-2.5 text-xs">
              <Info className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-primary">Status Detail: </span>
                <span className="text-secondary">{current.status_message}</span>
                {current.remaining_duration && (
                  <span className="ml-2 font-mono text-accent">({current.remaining_duration})</span>
                )}
              </div>
            </div>
          )}

          {/* Primary Contract Attributes Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-border bg-surface-hover/50">
              <div className="flex items-center gap-2 text-secondary text-xs mb-1">
                <Building2 className="w-4 h-4 text-accent" />
                <span>Counterparty</span>
              </div>
              <p className="text-sm font-semibold text-primary truncate">{current.counterparty_name || 'N/A'}</p>
            </div>

            <div className="p-4 rounded-xl border border-border bg-surface-hover/50">
              <div className="flex items-center gap-2 text-secondary text-xs mb-1">
                <Building2 className="w-4 h-4 text-accent" />
                <span>Contracting Entity</span>
              </div>
              <p className="text-sm font-semibold text-primary truncate">{current.contracting_entity || 'N/A'}</p>
            </div>

            <div className="p-4 rounded-xl border border-border bg-surface-hover/50">
              <div className="flex items-center gap-2 text-secondary text-xs mb-1">
                <Tag className="w-4 h-4 text-accent" />
                <span>Community &amp; Property ID</span>
              </div>
              <p className="text-sm font-semibold text-primary truncate">
                {current.community_name || 'General'}
                {current.property_id && <span className="font-mono text-xs text-secondary ml-1.5">(ID: {current.property_id})</span>}
              </p>
            </div>
          </div>

          {/* Agreement Lifecycle Dates */}
          <div className="p-5 rounded-xl border border-border bg-surface">
            <h3 className="text-xs font-bold text-secondary uppercase tracking-wider mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-accent" />
              Agreement Lifecycle &amp; Dates
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-secondary block mb-0.5">Agreement Date</span>
                <span className="font-semibold text-primary">{formatDate(current.agreement_date)}</span>
              </div>
              <div>
                <span className="text-secondary block mb-0.5">Effective Date</span>
                <span className="font-semibold text-primary">{formatDate(current.effective_date)}</span>
              </div>
              <div>
                <span className="text-secondary block mb-0.5">Expiration / Term Date</span>
                <span className="font-semibold text-primary">{formatDate(current.expiration_date || current.termination_date)}</span>
              </div>
              <div>
                <span className="text-secondary block mb-0.5">Last Updated</span>
                <span className="font-semibold text-accent font-mono">{formatDate(current.last_updated || current.last_synced_date)}</span>
              </div>
            </div>
          </div>

          {/* Renewal & Notice Terms (If available in properties) */}
          {(current.renewal_type || current.initial_term_length || current.renewal_opt_out_date || current.termination_notice_period) && (
            <div className="p-5 rounded-xl border border-border bg-surface">
              <h3 className="text-xs font-bold text-secondary uppercase tracking-wider mb-3 flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-accent" />
                Renewal Terms &amp; Notice Periods
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 text-xs">
                {current.renewal_type && (
                  <div>
                    <span className="text-secondary block mb-0.5">Renewal Type</span>
                    <span className="font-semibold text-primary">{current.renewal_type}</span>
                  </div>
                )}
                {current.initial_term_length && (
                  <div>
                    <span className="text-secondary block mb-0.5">Initial Term Length</span>
                    <span className="font-semibold text-primary">{current.initial_term_length}</span>
                  </div>
                )}
                {current.renewal_term_length && (
                  <div>
                    <span className="text-secondary block mb-0.5">Renewal Term Length</span>
                    <span className="font-semibold text-primary">{current.renewal_term_length}</span>
                  </div>
                )}
                {current.renewal_opt_out_date && (
                  <div>
                    <span className="text-secondary block mb-0.5">Renewal Opt-Out Date</span>
                    <span className="font-semibold text-primary">{formatDate(current.renewal_opt_out_date)}</span>
                  </div>
                )}
                {current.renewal_opt_out_period && (
                  <div>
                    <span className="text-secondary block mb-0.5">Opt-Out Period</span>
                    <span className="font-semibold text-primary">{current.renewal_opt_out_period}</span>
                  </div>
                )}
                {current.termination_notice_period && (
                  <div>
                    <span className="text-secondary block mb-0.5">Termination Notice</span>
                    <span className="font-semibold text-primary">{current.termination_notice_period}</span>
                  </div>
                )}
                {current.times_renewed !== undefined && (
                  <div>
                    <span className="text-secondary block mb-0.5">Times Renewed</span>
                    <span className="font-semibold text-primary">{current.times_renewed}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Document Attachments Section (Protected by Backend Permissions) */}
          <div className="p-5 rounded-xl border border-border bg-surface">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-accent" />
                <h3 className="text-sm font-bold text-primary">
                  Document Attachments ({current.attachments?.length || 0})
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

            {(!current.attachments || current.attachments.length === 0) ? (
              <p className="text-xs text-secondary italic">No document attachments found for this record.</p>
            ) : (
              <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
                {current.attachments.map((att) => {
                  const itemCanView = att.can_view ?? canView;
                  const itemCanDownload = att.can_download ?? canDownload;

                  return (
                    <div
                      key={att.key}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 hover:bg-surface-hover gap-3 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 rounded-lg bg-surface border border-border text-accent flex-shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-primary truncate">{att.filename || att.name}</p>
                          <div className="flex items-center gap-2 text-xs text-secondary flex-wrap mt-0.5">
                            <span>{att.content_type || 'application/pdf'}</span>
                            {att.file_hash && (
                              <span className="font-mono text-[10px] text-secondary truncate max-w-[200px]" title={att.file_hash}>
                                SHA256: {att.file_hash.substring(0, 12)}...
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
                        {/* View Document Button */}
                        <button
                          onClick={() => handleViewDocument(att)}
                          disabled={!itemCanView || !att.view_url}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            itemCanView && att.view_url
                              ? 'bg-surface hover:bg-surface-hover text-primary border border-border hover:border-accent'
                              : 'opacity-50 cursor-not-allowed bg-surface text-secondary border border-border'
                          }`}
                          title={itemCanView && att.view_url ? 'View document inline' : 'View permission restricted by policy'}
                        >
                          {itemCanView && att.view_url ? <Eye className="w-3.5 h-3.5 text-accent" /> : <Lock className="w-3.5 h-3.5" />}
                          View
                        </button>

                        {/* Download Document Button */}
                        <button
                          onClick={() => handleDownloadDocument(att)}
                          disabled={!itemCanDownload || !att.download_url}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            itemCanDownload && att.download_url
                              ? 'bg-accent text-black hover:opacity-90 shadow-sm'
                              : 'opacity-50 cursor-not-allowed bg-surface text-secondary border border-border'
                          }`}
                          title={itemCanDownload && att.download_url ? 'Download official attachment' : 'Download permission restricted by policy'}
                        >
                          {itemCanDownload && att.download_url ? <Download className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                          Download
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-border bg-surface-hover text-xs text-secondary">
          <span>Source: Live Ironclad API (Public Records Scope)</span>
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
