import React, { useState } from 'react';
import { ContractAttachment } from '../types';
import {
  X,
  Download,
  ExternalLink,
  FileText,
  Lock,
  Maximize2,
  Minimize2,
  FileCode,
  Image as ImageIcon,
  ShieldAlert,
} from 'lucide-react';

interface AttachmentViewerModalProps {
  attachment: ContractAttachment | null;
  isOpen: boolean;
  onClose: () => void;
  canDownload?: boolean;
}

export const AttachmentViewerModal: React.FC<AttachmentViewerModalProps> = ({
  attachment,
  isOpen,
  onClose,
  canDownload = true,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!isOpen || !attachment) return null;

  const token = localStorage.getItem('auth_token') || '';
  const rawUrl = attachment.view_url || attachment.url || attachment.download_url || '';
  const directUrl = rawUrl.startsWith('http') ? rawUrl : `${window.location.origin}${rawUrl}`;
  // Secure Stream Gateway authenticated URL with token parameter for iframe / direct preview
  const authenticatedUrl = token
    ? (directUrl.includes('token=') ? directUrl : `${directUrl}${directUrl.includes('?') ? '&' : '?'}token=${encodeURIComponent(token)}`)
    : directUrl;

  const contentType = (attachment.content_type || 'application/pdf').toLowerCase();
  const isPdf = contentType.includes('pdf') || attachment.name?.toLowerCase().endsWith('.pdf');
  const isImage = contentType.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg)$/i.test(attachment.name || '');

  const handleDownload = () => {
    if (!canDownload || !attachment.download_url) return;
    const rawDl = attachment.download_url.startsWith('http')
      ? attachment.download_url
      : `${window.location.origin}${attachment.download_url}`;
    const downloadUrl = token
      ? (rawDl.includes('token=') ? rawDl : `${rawDl}${rawDl.includes('?') ? '&' : '?'}token=${encodeURIComponent(token)}`)
      : rawDl;

    const link = document.createElement('a');
    link.href = downloadUrl;
    link.target = '_blank';
    link.download = attachment.filename || attachment.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isFullscreen ? '0' : '1rem',
        animation: 'modalIn 0.2s ease-out',
      }}
      onClick={onClose}
    >
      <div
        style={{
          position: 'relative',
          width: isFullscreen ? '100vw' : 'min(1100px, 96vw)',
          height: isFullscreen ? '100vh' : 'min(860px, 90vh)',
          backgroundColor: 'var(--bg-card)',
          borderRadius: isFullscreen ? '0' : 'var(--radius-lg)',
          border: isFullscreen ? 'none' : '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          transition: 'all 0.2s ease',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.85rem 1.25rem',
            borderBottom: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-secondary)',
            gap: '0.75rem',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
            <div
              style={{
                padding: '0.45rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--accent-soft)',
                color: 'var(--accent-primary)',
                flexShrink: 0,
              }}
            >
              {isImage ? <ImageIcon size={18} /> : <FileText size={18} />}
            </div>
            <div style={{ minWidth: 0 }}>
              <h3
                style={{
                  margin: 0,
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: 'min(450px, 45vw)',
                }}
                title={attachment.filename || attachment.name}
              >
                {attachment.filename || attachment.name}
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                <span>{contentType}</span>
                <span>&bull;</span>
                <span style={{ fontFamily: 'monospace' }}>Key: {attachment.key}</span>
              </div>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {/* Download Button (respecting permissions) */}
            <button
              onClick={handleDownload}
              disabled={!canDownload || !attachment.download_url}
              className="btn btn-primary"
              style={{
                padding: '0.4rem 0.75rem',
                fontSize: '0.775rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                opacity: canDownload ? 1 : 0.5,
                cursor: canDownload ? 'pointer' : 'not-allowed',
              }}
              title={canDownload ? 'Download Document' : 'Requires contracts:download permission'}
            >
              {canDownload ? <Download size={14} /> : <Lock size={14} />}
              <span>Download</span>
            </button>

            {/* Open Direct in New Tab */}
            {directUrl && (
              <a
                href={authenticatedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary"
                style={{
                  padding: '0.4rem 0.65rem',
                  fontSize: '0.775rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  textDecoration: 'none',
                }}
                title="Open Direct Ironclad Link in New Window"
              >
                <ExternalLink size={14} />
                <span>Open Tab</span>
              </a>
            )}

            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              className="btn btn-secondary"
              style={{ padding: '0.4rem 0.5rem', display: 'inline-flex', alignItems: 'center' }}
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen View'}
            >
              {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                padding: '0.4rem',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
              }}
              title="Close Preview"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Viewer Body Area */}
        <div
          style={{
            flex: 1,
            position: 'relative',
            backgroundColor: '#05070d',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'auto',
          }}
        >
          {isPdf ? (
            /* PDF In-App Viewer */
            <iframe
              src={authenticatedUrl}
              title={attachment.name}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                backgroundColor: '#ffffff',
              }}
            />
          ) : isImage ? (
            /* Image In-App Viewer */
            <div style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
              <img
                src={authenticatedUrl}
                alt={attachment.name}
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                  borderRadius: 'var(--radius-sm)',
                  boxShadow: 'var(--shadow-lg)',
                }}
              />
            </div>
          ) : (
            /* Other Document Types Preview Card */
            <div
              style={{
                padding: '3rem 2rem',
                textAlign: 'center',
                maxWidth: '520px',
                backgroundColor: 'var(--bg-card)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                boxShadow: 'var(--shadow-md)',
                margin: '1.5rem',
              }}
            >
              <FileCode size={48} style={{ color: 'var(--accent-primary)', margin: '0 auto 1rem' }} />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                {attachment.filename || attachment.name}
              </h3>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                This file format ({contentType}) can be opened directly or downloaded using the direct Ironclad document link.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <a
                  href={authenticatedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                  style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <ExternalLink size={15} />
                  <span>Open in External Tab</span>
                </a>
                {canDownload && (
                  <button
                    onClick={handleDownload}
                    className="btn btn-secondary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    <Download size={15} />
                    <span>Download File</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
