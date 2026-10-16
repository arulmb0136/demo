import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Contract, ContractAttachment } from '../types';
import { AttachmentViewerModal } from '../components/AttachmentViewerModal';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';
import {
  ArrowLeft,
  FileText,
  Download,
  Eye,
  Lock,
  Copy,
  Check,
  Building2,
  Calendar,
  Clock,
  ShieldCheck,
  ShieldAlert,
  Tag,
  RefreshCw,
  ExternalLink,
  Info,
  Layers,
  AlertCircle,
  FileCode,
} from 'lucide-react';

export const ContractDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission, user } = useAuth();

  const [contract, setContract] = useState<Contract | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [copiedLinkKey, setCopiedLinkKey] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [previewAttachment, setPreviewAttachment] = useState<ContractAttachment | null>(null);

  const fetchContractDetail = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      setErrorMsg(null);
      const res = await apiClient.get<Contract>(`/contracts/${id}`);
      setContract(res.data);
    } catch (err: any) {
      console.error('Failed to load contract details:', err);
      const msg = err.response?.data?.detail || err.message || 'Unable to retrieve contract record from Ironclad.';
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContractDetail();
  }, [id]);

  const copyToClipboard = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  const token = localStorage.getItem('ironclad_token') || '';

  const copyDocumentLink = (url: string, keyName: string) => {
    const baseStreamUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
    const authenticatedUrl = token ? `${baseStreamUrl}${baseStreamUrl.includes('?') ? '&' : '?'}token=${encodeURIComponent(token)}` : baseStreamUrl;
    navigator.clipboard.writeText(authenticatedUrl);
    setCopiedLinkKey(keyName);
    setTimeout(() => setCopiedLinkKey(null), 2000);
  };

  const handleViewDocument = (att: ContractAttachment) => {
    if (!att.can_view || !att.view_url) return;
    setPreviewAttachment(att);
  };

  const handleDownloadDocument = (att: ContractAttachment) => {
    if (!att.can_download || !att.download_url) return;
    const baseDlUrl = att.download_url.startsWith('http') ? att.download_url : `${API_BASE_URL}${att.download_url}`;
    const authenticatedDl = token ? `${baseDlUrl}${baseDlUrl.includes('?') ? '&' : '?'}token=${encodeURIComponent(token)}` : baseDlUrl;
    const link = document.createElement('a');
    link.href = authenticatedDl;
    link.download = att.filename || att.name;
    link.target = '_blank';
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

  // Evaluate permissions directly from backend response and user context
  const canViewAttachments = contract?.permissions?.can_view_attachments ?? hasPermission('contracts:view');
  const canDownloadAttachments = contract?.permissions?.can_download_attachments ?? hasPermission('contracts:download');

  const getRecordTypeBadge = (type?: string) => {
    const t = type || '';
    if (t.includes('Property') || t.includes('propertyServiceContractBh')) {
      return { label: 'Property Service Contract (BH)', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)', border: 'rgba(56, 189, 248, 0.3)' };
    }
    if (t.includes('Purchase') || t.includes('purchaseSaleAgreementBh')) {
      return { label: 'Purchase & Sale Agreement (BH)', color: '#c084fc', bg: 'rgba(192, 132, 252, 0.15)', border: 'rgba(192, 132, 252, 0.3)' };
    }
    if (t.includes('General') || t.includes('generalServicesAgreementBh')) {
      return { label: 'General Services Agreement (BH)', color: '#4ade80', bg: 'rgba(74, 222, 128, 0.15)', border: 'rgba(74, 222, 128, 0.3)' };
    }
    return { label: t || 'Contract Record', color: 'var(--text-secondary)', bg: 'var(--bg-card)', border: 'var(--border-color)' };
  };

  if (isLoading) {
    return (
      <div className="container" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto 1.5rem' }} />
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          Loading Live Contract Details...
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
          Querying Ironclad repository &amp; applying server-side permissions
        </p>
      </div>
    );
  }

  if (errorMsg || !contract) {
    return (
      <div className="container" style={{ padding: '4rem 1rem', maxWidth: '640px' }}>
        <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <AlertCircle size={48} style={{ color: 'var(--danger)', margin: '0 auto 1rem' }} />
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
            Unable to Load Contract Details
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.75rem' }}>
            {errorMsg || 'The requested contract record could not be found or you lack permission to view it.'}
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <button onClick={() => navigate('/dashboard')} className="btn btn-secondary">
              <ArrowLeft size={16} />
              <span>Back to Dashboard</span>
            </button>
            <button onClick={fetchContractDetail} className="btn btn-primary">
              <RefreshCw size={16} />
              <span>Retry</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const typeBadge = getRecordTypeBadge(contract.type_display_name || contract.type || contract.record_type);

  return (
    <div className="container" style={{ padding: '2rem 1rem', maxWidth: '1280px' }}>
      {/* Top Breadcrumb & Action Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={() => navigate('/dashboard')}
            className="btn btn-secondary"
            style={{
              padding: '0.45rem 0.85rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.825rem',
            }}
          >
            <ArrowLeft size={15} />
            <span>Back to Dashboard</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <Link to="/dashboard" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
              Contracts
            </Link>
            <span>/</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontFamily: 'monospace' }}>
              {contract.ironclad_id || contract.id}
            </span>
          </div>
        </div>


      </div>

      {/* Main Hero Card: Contract Title, Badges, & Live Status */}
      <div
        className="card"
        style={{
          marginBottom: '1.5rem',
          padding: '1.75rem',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
              {/* Ironclad ID Badge */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.25rem 0.65rem',
                  borderRadius: '6px',
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--accent-primary)',
                  fontFamily: 'monospace',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                }}
              >
                <span>{contract.ironclad_id || contract.id}</span>
                <button
                  onClick={() => copyToClipboard(contract.ironclad_id || contract.id, 'ironcladId')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'inherit' }}
                  title="Copy ID"
                >
                  {copiedKey === 'ironcladId' ? <Check size={12} style={{ color: 'var(--success)' }} /> : <Copy size={12} />}
                </button>
              </div>

              {/* Record Type Badge */}
              <span
                style={{
                  padding: '0.25rem 0.75rem',
                  borderRadius: '9999px',
                  backgroundColor: typeBadge.bg,
                  color: typeBadge.color,
                  border: `1px solid ${typeBadge.border}`,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                }}
              >
                {typeBadge.label}
              </span>

              {/* Enhanced Contract Status Badge */}
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '9999px',
                  backgroundColor: 'rgba(34, 197, 94, 0.15)',
                  color: '#22c55e',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#22c55e' }} />
                <span>{contract.enhanced_status || contract.status || 'Active'}</span>
              </span>
            </div>

            <h1
              style={{
                fontSize: '1.65rem',
                fontWeight: 800,
                color: 'var(--text-primary)',
                margin: '0 0 0.5rem',
                lineHeight: 1.3,
              }}
            >
              {contract.name || contract.title}
            </h1>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Ironclad Record UUID: <span style={{ fontFamily: 'monospace' }}>{contract.id}</span>
            </p>
          </div>
        </div>

        {/* Live Status Alert Callout */}
        {contract.status_message && (
          <div
            style={{
              marginTop: '1.25rem',
              padding: '0.85rem 1.15rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--accent-soft)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
            }}
          >
            <Info size={18} style={{ color: 'var(--accent-primary)', flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '0.85rem' }}>
              <strong style={{ color: 'var(--text-primary)' }}>Repository Lifecycle Status: </strong>
              <span style={{ color: 'var(--text-secondary)' }}>{contract.status_message}</span>
              {contract.remaining_duration && (
                <span
                  style={{
                    marginLeft: '0.5rem',
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    color: 'var(--accent-primary)',
                    backgroundColor: 'var(--bg-input)',
                    padding: '0.15rem 0.45rem',
                    borderRadius: '4px',
                  }}
                >
                  Duration: {contract.remaining_duration}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 4-Metric Key Overview Bar */}
      <div className="summary-cards-grid">
        <div className="card" style={{ padding: '1.15rem', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.4rem' }}>
            <Building2 size={15} style={{ color: 'var(--accent-primary)' }} />
            <span>COUNTERPARTY</span>
          </div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }} className="truncate">
            {contract.counterparty_name || 'N/A'}
          </div>
        </div>

        <div className="card" style={{ padding: '1.15rem', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.4rem' }}>
            <Building2 size={15} style={{ color: 'var(--accent-primary)' }} />
            <span>CONTRACTING ENTITY</span>
          </div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }} className="truncate">
            {contract.contracting_entity || 'N/A'}
          </div>
        </div>

        <div className="card" style={{ padding: '1.15rem', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.4rem' }}>
            <Tag size={15} style={{ color: 'var(--accent-primary)' }} />
            <span>COMMUNITY &amp; PROPERTY ID</span>
          </div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }} className="truncate">
            {contract.community_name || 'General'}
            {contract.property_id && (
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginLeft: '0.4rem', fontFamily: 'monospace' }}>
                (ID: {contract.property_id})
              </span>
            )}
          </div>
        </div>

        <div className="card" style={{ padding: '1.15rem', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.4rem' }}>
            <Calendar size={15} style={{ color: 'var(--accent-primary)' }} />
            <span>EXPIRATION / TERM DATE</span>
          </div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {formatDate(contract.expiration_date || contract.termination_date || contract.completion_date)}
          </div>
        </div>
      </div>

      {/* Main Grid: Left Column Properties & Terms | Right Column Attachments & Permission Control */}
      <div className="contract-detail-grid">
        {/* LEFT COLUMN: Properties & Lifecycle Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Agreement Lifecycle & Key Dates */}
          <div
            className="card"
            style={{
              padding: '1.5rem',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <Clock size={18} style={{ color: 'var(--accent-primary)' }} />
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Agreement Lifecycle &amp; Key Dates
              </h2>
            </div>

            <div className="lifecycle-grid">
              <div style={{ padding: '0.85rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>
                  Formal Agreement Date
                </span>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {formatDate(contract.agreement_date)}
                </span>
              </div>

              <div style={{ padding: '0.85rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>
                  Effective Date
                </span>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {formatDate(contract.effective_date)}
                </span>
              </div>

              <div style={{ padding: '0.85rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>
                  Expiration Date
                </span>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {formatDate(contract.expiration_date)}
                </span>
              </div>

              <div style={{ padding: '0.85rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>
                  Ironclad Last Updated
                </span>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-primary)', fontFamily: 'monospace' }}>
                  {formatDate(contract.last_updated || contract.last_synced_date)}
                </span>
              </div>
            </div>
          </div>

          {/* Renewal & Terms Properties */}
          <div
            className="card"
            style={{
              padding: '1.5rem',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <RefreshCw size={18} style={{ color: 'var(--accent-primary)' }} />
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Renewal Terms &amp; Notice Periods
              </h2>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '0.85rem',
              }}
            >
              <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                  Renewal Type
                </span>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {contract.renewal_type || 'N/A'}
                </span>
              </div>

              <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                  Initial Term Length
                </span>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {contract.initial_term_length || 'N/A'}
                </span>
              </div>

              <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                  Renewal Term Length
                </span>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {contract.renewal_term_length || 'N/A'}
                </span>
              </div>

              <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                  Renewal Opt-Out Date
                </span>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {formatDate(contract.renewal_opt_out_date)}
                </span>
              </div>

              <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                  Opt-Out Period
                </span>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {contract.renewal_opt_out_period || 'N/A'}
                </span>
              </div>

              <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                  Termination Notice
                </span>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {contract.termination_notice_period || 'N/A'}
                </span>
              </div>

              <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                  Times Renewed
                </span>
                <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--accent-primary)' }}>
                  {contract.times_renewed ?? 0}
                </span>
              </div>
            </div>
          </div>

          {/* Full Properties Inspector (Clean Explorer) */}
          {contract.properties && Object.keys(contract.properties).length > 0 && (
            <div
              className="card"
              style={{
                padding: '1.5rem',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <Layers size={18} style={{ color: 'var(--accent-primary)' }} />
                <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  Repository Schema Attributes
                </h2>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.65rem' }}>
                {Object.entries(contract.properties).map(([k, v]) => (
                  <div
                    key={k}
                    style={{
                      padding: '0.65rem 0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--bg-input)',
                      border: '1px solid var(--border-color)',
                      fontSize: '0.75rem',
                    }}
                  >
                    <span style={{ fontFamily: 'monospace', color: 'var(--text-muted)', display: 'block', marginBottom: '0.15rem' }}>
                      {k}
                    </span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)', wordBreak: 'break-all' }}>
                      {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Document Attachments & Server Permissions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Security & Access Rights Card */}
          <div
            className="card"
            style={{
              padding: '1.25rem',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <ShieldCheck size={18} style={{ color: 'var(--accent-primary)' }} />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Security &amp; Permissions Enforcement
              </h3>
            </div>
            <p style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', margin: '0 0 1rem' }}>
              Document streaming and downloading are validated server-side based on your authenticated role ({user?.role || 'user'}).
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <div
                style={{
                  flex: 1,
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: canViewAttachments ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  border: canViewAttachments ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                  color: canViewAttachments ? '#22c55e' : '#ef4444',
                  fontSize: '0.775rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                {canViewAttachments ? <Check size={14} /> : <Lock size={14} />}
                <span>View Permission: {canViewAttachments ? 'Granted' : 'Restricted'}</span>
              </div>

              <div
                style={{
                  flex: 1,
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: canDownloadAttachments ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  border: canDownloadAttachments ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                  color: canDownloadAttachments ? '#22c55e' : '#ef4444',
                  fontSize: '0.775rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                {canDownloadAttachments ? <Check size={14} /> : <Lock size={14} />}
                <span>Download Permission: {canDownloadAttachments ? 'Granted' : 'Restricted'}</span>
              </div>
            </div>
          </div>

          {/* Document Attachments List Card */}
          <div
            className="card"
            style={{
              padding: '1.5rem',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={18} style={{ color: 'var(--accent-primary)' }} />
                <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  Attachments ({contract.attachments?.length || 0})
                </h2>
              </div>
            </div>

            {(!contract.attachments || contract.attachments.length === 0) ? (
              <div
                style={{
                  padding: '2.5rem 1rem',
                  textAlign: 'center',
                  backgroundColor: 'var(--bg-input)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-muted)',
                  fontSize: '0.85rem',
                }}
              >
                <FileText size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
                <p style={{ margin: 0 }}>No document attachments linked to this Ironclad record.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {contract.attachments.map((att) => {
                  const itemCanView = att.can_view ?? canViewAttachments;
                  const itemCanDownload = att.can_download ?? canDownloadAttachments;

                  return (
                    <div
                      key={att.key}
                      style={{
                        padding: '1.15rem',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--bg-input)',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.85rem',
                      }}
                    >
                      {/* Document Details Header */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                        <div
                          style={{
                            padding: '0.65rem',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: 'var(--accent-soft)',
                            color: 'var(--accent-primary)',
                            flexShrink: 0,
                          }}
                        >
                          <FileText size={20} />
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h4
                            style={{
                              margin: '0 0 0.25rem',
                              fontSize: '0.925rem',
                              fontWeight: 700,
                              color: 'var(--text-primary)',
                              wordBreak: 'break-all',
                            }}
                          >
                            {att.filename || att.name}
                          </h4>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                            <span>{att.content_type || 'application/pdf'}</span>
                            <span>&bull;</span>
                            <span style={{ fontFamily: 'monospace' }}>Key: {att.key}</span>
                          </div>

                          {/* SHA256 Hash Display */}
                          {att.file_hash && (
                            <div
                              style={{
                                marginTop: '0.4rem',
                                fontSize: '0.7rem',
                                color: 'var(--text-muted)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                              }}
                            >
                              <span style={{ fontFamily: 'monospace' }}>SHA256: {att.file_hash.substring(0, 16)}...</span>
                              <button
                                onClick={() => copyToClipboard(att.file_hash!, `hash-${att.key}`)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'inherit' }}
                                title="Copy SHA256 hash"
                              >
                                {copiedKey === `hash-${att.key}` ? <Check size={11} style={{ color: 'var(--success)' }} /> : <Copy size={11} />}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons: View Document & Link/Download Document */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.65rem',
                          paddingTop: '0.75rem',
                          borderTop: '1px solid var(--border-color)',
                          flexWrap: 'wrap',
                        }}
                      >
                        {/* 1. View Document Button */}
                        <button
                          onClick={() => handleViewDocument(att)}
                          disabled={!itemCanView || !att.view_url}
                          className="btn"
                          style={{
                            flex: 1,
                            padding: '0.45rem 0.75rem',
                            fontSize: '0.8rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.4rem',
                            backgroundColor: itemCanView ? 'var(--bg-card)' : 'transparent',
                            color: itemCanView ? 'var(--text-primary)' : 'var(--text-muted)',
                            border: '1px solid var(--border-color)',
                            cursor: itemCanView ? 'pointer' : 'not-allowed',
                            opacity: itemCanView ? 1 : 0.6,
                          }}
                          title={itemCanView ? 'View document in browser tab' : 'Requires contracts:view permission'}
                        >
                          {itemCanView ? <Eye size={14} style={{ color: 'var(--accent-primary)' }} /> : <Lock size={14} />}
                          <span>View Document</span>
                        </button>

                        {/* 2. Download File Button */}
                        <button
                          onClick={() => handleDownloadDocument(att)}
                          disabled={!itemCanDownload || !att.download_url}
                          className="btn btn-primary"
                          style={{
                            flex: 1,
                            padding: '0.45rem 0.75rem',
                            fontSize: '0.8rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.4rem',
                            cursor: itemCanDownload ? 'pointer' : 'not-allowed',
                            opacity: itemCanDownload ? 1 : 0.6,
                          }}
                          title={itemCanDownload ? 'Download official attachment file' : 'Requires contracts:download permission'}
                        >
                          {itemCanDownload ? <Download size={14} /> : <Lock size={14} />}
                          <span>Download</span>
                        </button>

                        {/* 3. Copy Document Link Button */}
                        {att.download_url && itemCanDownload && (
                          <button
                            onClick={() => copyDocumentLink(att.download_url!, att.key)}
                            className="btn btn-secondary"
                            style={{
                              padding: '0.45rem 0.65rem',
                              fontSize: '0.8rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                            }}
                            title="Copy authenticated link to document"
                          >
                            {copiedLinkKey === att.key ? <Check size={14} style={{ color: 'var(--success)' }} /> : <Copy size={14} />}
                            <span>Link</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Responsive In-App Document Viewer Popup Modal */}
      <AttachmentViewerModal
        attachment={previewAttachment}
        isOpen={!!previewAttachment}
        onClose={() => setPreviewAttachment(null)}
        canDownload={canDownloadAttachments}
      />
    </div>
  );
};
