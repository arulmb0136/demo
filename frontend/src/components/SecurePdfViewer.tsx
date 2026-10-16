import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  AlertCircle,
  Shield,
  Eye,
} from 'lucide-react';

// Configure PDF.js Worker to match installed version
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface SecurePdfViewerProps {
  url: string;
  token?: string;
  title?: string;
  canDownload?: boolean;
}

export const SecurePdfViewer: React.FC<SecurePdfViewerProps> = ({
  url,
  token,
  title = 'Document',
  canDownload = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<any>(null);

  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [scale, setScale] = useState<number>(1.2);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load the PDF Document via authenticated binary stream
  const loadPdf = async () => {
    try {
      setIsLoading(true);
      setErrorMsg(null);

      // Cancel previous render task if active
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {
          // ignore cancel error
        }
      }

      // Fetch PDF as binary ArrayBuffer with auth headers
      const headers: Record<string, string> = { Accept: '*/*' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(url, { headers });
      if (!res.ok) {
        throw new Error(`Failed to stream document: HTTP ${res.status} ${res.statusText}`);
      }

      const arrayBuffer = await res.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer,
        cMapUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/cmaps/`,
        cMapPacked: true,
      });

      const doc = await loadingTask.promise;
      setPdfDoc(doc);
      setTotalPages(doc.numPages);
      setCurrentPage(1);
    } catch (err: any) {
      console.error('Error loading secure PDF:', err);
      setErrorMsg(err.message || 'Unable to render PDF document securely.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (url) {
      loadPdf();
    }
    return () => {
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {
          // cleanup
        }
      }
    };
  }, [url, token]);

  // Render the current page onto the HTML5 Canvas
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;

    let isCancelled = false;

    const renderPage = async () => {
      try {
        if (renderTaskRef.current) {
          try {
            renderTaskRef.current.cancel();
          } catch {
            // ignore
          }
        }

        const page = await pdfDoc.getPage(currentPage);
        if (isCancelled || !canvasRef.current) return;

        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) return;

        // Support High-DPI / Retina displays for crystal-clear text
        const outputScale = window.devicePixelRatio || 1;
        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : undefined;

        const renderContext = {
          canvasContext: context,
          transform: transform,
          viewport: viewport,
        };

        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;
        await renderTask.promise;
      } catch (err: any) {
        if (err.name !== 'RenderingCancelledException') {
          console.error('Canvas render error:', err);
        }
      }
    };

    renderPage();

    return () => {
      isCancelled = true;
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {
          // ignore
        }
      }
    };
  }, [pdfDoc, currentPage, scale]);

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage((p) => p - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((p) => p + 1);
  };

  const handleZoomIn = () => {
    setScale((s) => Math.min(s + 0.2, 3.0));
  };

  const handleZoomOut = () => {
    setScale((s) => Math.max(s - 0.2, 0.6));
  };

  const handleResetZoom = () => {
    setScale(1.2);
  };

  return (
    <div
      ref={containerRef}
      onContextMenu={(e) => !canDownload && e.preventDefault()}
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        backgroundColor: '#0a0d14',
        userSelect: canDownload ? 'auto' : 'none',
      }}
    >
      {/* Secure Navigation & Zoom Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.65rem 1rem',
          backgroundColor: '#121722',
          borderBottom: '1px solid var(--border-color)',
          gap: '0.75rem',
          flexWrap: 'wrap',
          zIndex: 10,
        }}
      >
        {/* Left: View Mode Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.25rem 0.55rem',
              borderRadius: '4px',
              backgroundColor: canDownload ? 'rgba(56, 189, 248, 0.15)' : 'rgba(234, 179, 8, 0.15)',
              border: canDownload ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid rgba(234, 179, 8, 0.3)',
              color: canDownload ? '#38bdf8' : '#eab308',
              fontSize: '0.72rem',
              fontWeight: 600,
            }}
          >
            {canDownload ? <Shield size={12} /> : <Eye size={12} />}
            <span>{canDownload ? 'Full Access Viewer' : 'Protected View-Only Mode'}</span>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }} className="truncate">
            {title}
          </span>
        </div>

        {/* Center: Page Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <button
            onClick={handlePrevPage}
            disabled={currentPage <= 1 || isLoading}
            className="btn btn-secondary"
            style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
            title="Previous Page"
          >
            <ChevronLeft size={15} />
          </button>

          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', minWidth: '70px', textAlign: 'center' }}>
            {totalPages > 0 ? `${currentPage} / ${totalPages}` : '- / -'}
          </span>

          <button
            onClick={handleNextPage}
            disabled={currentPage >= totalPages || isLoading}
            className="btn btn-secondary"
            style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
            title="Next Page"
          >
            <ChevronRight size={15} />
          </button>
        </div>

        {/* Right: Zoom Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <button
            onClick={handleZoomOut}
            disabled={scale <= 0.6 || isLoading}
            className="btn btn-secondary"
            style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem' }}
            title="Zoom Out"
          >
            <ZoomOut size={14} />
          </button>

          <button
            onClick={handleResetZoom}
            className="btn btn-secondary"
            style={{ padding: '0.35rem 0.55rem', fontSize: '0.75rem', fontFamily: 'monospace' }}
            title="Reset Zoom (120%)"
          >
            {Math.round(scale * 100)}%
          </button>

          <button
            onClick={handleZoomIn}
            disabled={scale >= 3.0 || isLoading}
            className="btn btn-secondary"
            style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem' }}
            title="Zoom In"
          >
            <ZoomIn size={14} />
          </button>
        </div>
      </div>

      {/* Main Document Canvas Viewport */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
          position: 'relative',
        }}
      >
        {isLoading && (
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
            <div className="spinner" style={{ margin: '0 auto 1rem' }} />
            <p style={{ fontSize: '0.875rem' }}>Rendering Document Pages Securely...</p>
          </div>
        )}

        {errorMsg && (
          <div
            style={{
              padding: '2rem',
              maxWidth: '450px',
              backgroundColor: 'var(--bg-card)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              textAlign: 'center',
            }}
          >
            <AlertCircle size={36} style={{ color: 'var(--danger)', margin: '0 auto 0.75rem' }} />
            <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              Preview Unavailable
            </h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              {errorMsg}
            </p>
            <button onClick={loadPdf} className="btn btn-primary" style={{ fontSize: '0.8rem' }}>
              <RefreshCw size={14} />
              <span>Retry Rendering</span>
            </button>
          </div>
        )}

        {/* HTML5 Canvas (Direct Pixel Render - No Browser Plugin / Toolbar) */}
        <canvas
          ref={canvasRef}
          style={{
            display: !isLoading && !errorMsg ? 'block' : 'none',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.65)',
            borderRadius: '4px',
            backgroundColor: '#ffffff',
            maxWidth: '100%',
          }}
        />
      </div>
    </div>
  );
};
