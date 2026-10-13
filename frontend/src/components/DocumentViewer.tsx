import React, { useState } from 'react';
import { Contract, Document } from '../types';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';
import { X, FileText, Download, Upload, Eye, CheckCircle2, AlertCircle, Calendar, Clock, Activity, ArrowRight, ShieldCheck } from 'lucide-react';

interface DocumentViewerProps {
  contract: Contract | null;
  isOpen: boolean;
  onClose: () => void;
  onDocumentUploaded: () => void;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  contract,
  isOpen,
  onClose,
  onDocumentUploaded,
}) => {
  const { hasPermission } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isOpen || !contract) return null;

  const formatDateDisplay = (dateStr?: string) => {
    if (!dateStr) return 'Not Set';
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

  const getTrackingBadgeColor = (status?: string) => {
    switch (status) {
      case 'active':
        return { bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981', border: 'rgba(16, 185, 129, 0.3)' };
      case 'completed':
        return { bg: 'rgba(59, 130, 246, 0.15)', text: '#3b82f6', border: 'rgba(59, 130, 246, 0.3)' };
      case 'pending_start':
        return { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b', border: 'rgba(245, 158, 11, 0.3)' };
      case 'expired':
        return { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', border: 'rgba(239, 68, 68, 0.3)' };
      default:
        return { bg: 'rgba(100, 116, 139, 0.15)', text: '#94a3b8', border: 'rgba(100, 116, 139, 0.3)' };
    }
  };

  const badgeTheme = getTrackingBadgeColor(contract.tracking_status);

  const handleDownload = async (doc: Document) => {
    try {
      setDownloadingId(doc.id);
      const res = await apiClient.get<{ download_url: string }>(`/files/${doc.id}/download`);
      const downloadUrl = res.data.download_url;
      // Trigger download or open preview
      const link = document.createElement('a');
      link.href = downloadUrl.startsWith('http')
        ? downloadUrl
        : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}${downloadUrl}`;
      link.target = '_blank';
      link.rel = 'noreferrer';
      link.download = doc.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      alert(`Download failed: ${err?.response?.data?.detail || err.message}`);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    try {
      setIsUploading(true);
      setStatusMessage(null);
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('contract_id', contract.id.toString());

      await apiClient.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setStatusMessage('File successfully stored in S3 document repository.');
      setSelectedFile(null);
      onDocumentUploaded();
    } catch (err: any) {
      alert(`Upload failed: ${err?.response?.data?.detail || err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '1.2 MB';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ maxWidth: '750px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem', borderBottom: '1px solid var(--border-color)' }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{contract.title}</h2>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Ironclad ID: {contract.ironclad_id || `local_cnt_${contract.id}`} &bull; {contract.counterparty_name}
            </div>
          </div>
          <button onClick={onClose} className="btn btn-outline" style={{ padding: '0.35rem' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '1.25rem' }}>
          {statusMessage && (
            <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '0.65rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 size={16} />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Ironclad Data Lake Lifecycle & Tracking Timeline */}
          <div
            style={{
              marginBottom: '1.5rem',
              padding: '1.15rem',
              backgroundColor: 'var(--bg-card)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Activity size={18} color="var(--accent-primary)" />
                <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>
                  Contract Lifecycle & Tracking Timeline
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  (developer.ironcladapp.com Data Lake Schema)
                </span>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                {contract.days_remaining !== undefined && contract.days_remaining !== null && (
                  <span
                    style={{
                      padding: '0.2rem 0.55rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      backgroundColor: contract.days_remaining < 30 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                      color: contract.days_remaining < 30 ? '#ef4444' : '#10b981',
                      border: `1px solid ${contract.days_remaining < 30 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                    }}
                  >
                    {contract.days_remaining < 0
                      ? `${Math.abs(contract.days_remaining)}d Overdue`
                      : `${contract.days_remaining}d Remaining`}
                  </span>
                )}
                <span
                  style={{
                    padding: '0.2rem 0.55rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    backgroundColor: badgeTheme.bg,
                    color: badgeTheme.text,
                    border: `1px solid ${badgeTheme.border}`,
                  }}
                >
                  {contract.tracking_status?.replace('_', ' ') || 'ACTIVE'}
                </span>
              </div>
            </div>

            {/* Visual Timeline Progress Bar */}
            <div style={{ marginBottom: '1.1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                <span>Start: {formatDateDisplay(contract.start_date)}</span>
                <span style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>
                  {contract.progress_percent ?? 50}% Term Elapsed
                </span>
                <span>Completion: {formatDateDisplay(contract.completion_date)}</span>
              </div>
              <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--bg-input)', borderRadius: '999px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${Math.min(100, Math.max(0, contract.progress_percent ?? 50))}%`,
                    backgroundColor: contract.tracking_status === 'expired' ? '#ef4444' : 'var(--accent-primary)',
                    borderRadius: '999px',
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
            </div>

            {/* Key Tracking Date Metric Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
              <div style={{ padding: '0.65rem', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Calendar size={12} />
                  Agreement Date
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                  {formatDateDisplay(contract.agreement_date)}
                </div>
              </div>

              <div style={{ padding: '0.65rem', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Calendar size={12} />
                  Term Start Date
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                  {formatDateDisplay(contract.start_date)}
                </div>
              </div>

              <div style={{ padding: '0.65rem', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Clock size={12} />
                  Reference Current Date
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-primary)' }}>
                  {formatDateDisplay(contract.current_date || new Date().toISOString())}
                </div>
              </div>

              <div style={{ padding: '0.65rem', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Calendar size={12} />
                  Completion Date
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                  {formatDateDisplay(contract.completion_date)}
                </div>
              </div>
            </div>

            {/* Supplemental Metadata (Signed, Sync Timestamp, Renewal Cutoff) */}
            <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.85rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              <div>
                <strong>Signed:</strong> {formatDateDisplay(contract.signed_date)}
              </div>
              <div>
                <strong>Renewal Cutoff:</strong> {formatDateDisplay(contract.renewal_notice_date)}
              </div>
              <div>
                <strong>Ironclad Last Synced:</strong> {contract.last_synced_date ? new Date(contract.last_synced_date).toLocaleString() : 'Live Synced'}
              </div>
            </div>
          </div>

          {/* Attached Documents List */}
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.75rem' }}>
            Attached Documents ({contract.documents ? contract.documents.length : 0})
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1.5rem' }}>
            {contract.documents && contract.documents.length > 0 ? (
              contract.documents.map((doc) => (
                <div
                  key={doc.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    backgroundColor: 'var(--bg-input)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <FileText size={20} color="var(--accent-primary)" />
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {doc.name}
                      </div>
                      <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                        {formatFileSize(doc.file_size_bytes)} &bull; {doc.content_type}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDownload(doc)}
                    disabled={downloadingId === doc.id}
                    className="btn btn-primary"
                    style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
                  >
                    <Download size={14} />
                    {downloadingId === doc.id ? 'Fetching...' : 'Download'}
                  </button>
                </div>
              ))
            ) : (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
                No document attachments found for this contract record.
              </div>
            )}
          </div>

          {/* Related Records Links (developer.ironcladapp.com/docs/create-a-record-1) */}
          {contract.related_records && contract.related_records.length > 0 && (
            <div style={{ marginBottom: '1.5rem', backgroundColor: 'var(--bg-input)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                Ironclad Related Record Links ({contract.related_records.length})
              </h4>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {contract.related_records.map((r, i) => (
                  <span key={i} style={{ padding: '0.2rem 0.5rem', backgroundColor: 'var(--bg-card)', borderRadius: '4px', fontSize: '0.75rem', border: '1px solid var(--border-color)' }}>
                    Record ID: <code>{r.recordId}</code>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* S3 Document Upload Section (Guarded by 'write' permission) */}
          {hasPermission('write') ? (
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                Upload Document Attachment to S3 Storage
              </h3>
              <form onSubmit={handleUpload} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <input
                  type="file"
                  className="input"
                  style={{ padding: '0.4rem', flex: 1 }}
                  onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                  required
                />
                <button
                  type="submit"
                  disabled={isUploading || !selectedFile}
                  className="btn btn-primary"
                >
                  <Upload size={16} />
                  {isUploading ? 'Uploading to S3...' : 'Upload File'}
                </button>
              </form>
            </div>
          ) : (
            <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', fontStyle: 'italic', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              Note: Document uploading is restricted to users with 'write' permission.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
