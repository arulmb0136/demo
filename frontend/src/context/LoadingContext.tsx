import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AlertTriangle, X, RefreshCw } from 'lucide-react';

interface ErrorNotification {
  id: string;
  message: string;
  details?: string;
  isTimeout?: boolean;
}

interface LoadingContextType {
  isLoading: boolean;
  activeRequests: number;
  startLoading: () => void;
  stopLoading: () => void;
  reportError: (message: string, details?: string, isTimeout?: boolean) => void;
  clearError: (id: string) => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

// Listeners for external integrations (such as Axios interceptors)
type LoadingListener = (count: number) => void;
type ErrorListener = (err: ErrorNotification) => void;

let requestCount = 0;
const loadingListeners: Set<LoadingListener> = new Set();
const errorListeners: Set<ErrorListener> = new Set();

export const notifyRequestStart = () => {
  requestCount++;
  loadingListeners.forEach((fn) => fn(requestCount));
};

export const notifyRequestEnd = () => {
  requestCount = Math.max(0, requestCount - 1);
  loadingListeners.forEach((fn) => fn(requestCount));
};

export const notifyApiError = (message: string, details?: string, isTimeout?: boolean) => {
  const errItem: ErrorNotification = {
    id: `err-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    message,
    details,
    isTimeout,
  };
  errorListeners.forEach((fn) => fn(errItem));
};

export const LoadingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeRequests, setActiveRequests] = useState<number>(0);
  const [errors, setErrors] = useState<ErrorNotification[]>([]);

  useEffect(() => {
    const handleLoadingChange: LoadingListener = (count) => {
      setActiveRequests(count);
    };

    const handleError: ErrorListener = (err) => {
      setErrors((prev) => [...prev.slice(-3), err]); // Keep last 4 max
    };

    loadingListeners.add(handleLoadingChange);
    errorListeners.add(handleError);

    return () => {
      loadingListeners.delete(handleLoadingChange);
      errorListeners.delete(handleError);
    };
  }, []);

  const startLoading = useCallback(() => {
    notifyRequestStart();
  }, []);

  const stopLoading = useCallback(() => {
    notifyRequestEnd();
  }, []);

  const reportError = useCallback((message: string, details?: string, isTimeout?: boolean) => {
    notifyApiError(message, details, isTimeout);
  }, []);

  const clearError = useCallback((id: string) => {
    setErrors((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const isLoading = activeRequests > 0;

  return (
    <LoadingContext.Provider
      value={{
        isLoading,
        activeRequests,
        startLoading,
        stopLoading,
        reportError,
        clearError,
      }}
    >
      {/* Top Global Progress Bar for every API call */}
      {isLoading && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '3px',
            zIndex: 9999,
            backgroundColor: 'transparent',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              backgroundColor: 'var(--accent-primary)',
              boxShadow: '0 0 10px var(--accent-primary)',
              animation: 'indeterminateProgress 1.6s infinite ease-in-out',
            }}
          />
        </div>
      )}

      {/* Floating Active Request Indicator */}
      {isLoading && (
        <div
          style={{
            position: 'fixed',
            bottom: '1.5rem',
            left: '1.5rem',
            zIndex: 9998,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.45rem 0.85rem',
            borderRadius: '9999px',
            backgroundColor: 'var(--bg-card)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-md)',
            fontSize: '0.75rem',
            fontWeight: 600,
          }}
        >
          <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent-primary)' }} />
          <span>Synchronizing with Ironclad API...</span>
        </div>
      )}

      {/* Global Error & Timeout Notifications Banner */}
      {errors.length > 0 && (
        <div
          style={{
            position: 'fixed',
            top: '1.25rem',
            right: '1.25rem',
            zIndex: 10000,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            maxWidth: '420px',
            width: 'calc(100vw - 2.5rem)',
          }}
        >
          {errors.map((err) => (
            <div
              key={err.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '0.75rem',
                padding: '0.85rem 1rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: err.isTimeout ? '#451a03' : 'var(--bg-card)',
                color: err.isTimeout ? '#fed7aa' : 'var(--text-primary)',
                border: err.isTimeout ? '1px solid #f97316' : '1px solid var(--danger)',
                boxShadow: 'var(--shadow-lg)',
                animation: 'slideInRight 0.25s ease-out',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                <AlertTriangle
                  size={18}
                  style={{
                    color: err.isTimeout ? '#f97316' : 'var(--danger)',
                    flexShrink: 0,
                    marginTop: '2px',
                  }}
                />
                <div>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, margin: 0 }}>
                    {err.isTimeout ? 'Request Timed Out (20s Exceeded)' : 'API Request Failed'}
                  </h4>
                  <p style={{ fontSize: '0.75rem', margin: '0.2rem 0 0', opacity: 0.9 }}>
                    {err.message}
                  </p>
                  {err.details && (
                    <span style={{ display: 'block', fontSize: '0.7rem', opacity: 0.75, marginTop: '0.25rem', fontFamily: 'monospace' }}>
                      {err.details}
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() => clearError(err.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'inherit',
                  opacity: 0.7,
                  padding: '2px',
                }}
                aria-label="Dismiss error"
              >
                <X size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      {children}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};
