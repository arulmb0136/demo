import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCircle, FileText, X } from 'lucide-react';
import { apiClient } from '../api/client';
import { ContractNotification } from '../types';
import { useAuth } from '../context/AuthContext';

interface NotificationCenterProps {
  onSelectContract?: (recordId: string) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ onSelectContract }) => {
  const navigate = useNavigate();
  const { isAuthenticated, hasPermission } = useAuth();
  const [notifications, setNotifications] = useState<ContractNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toastMessage, setToastMessage] = useState<ContractNotification | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const lastCheckRef = useRef<string>(new Date(Date.now() - 24 * 3600 * 1000).toISOString());

  // Polling for new contracts
  useEffect(() => {
    if (!isAuthenticated || !hasPermission('contracts:view')) return;

    const pollNotifications = async () => {
      try {
        const res = await apiClient.get<ContractNotification[]>('/contracts/notifications/check', {
          params: { since: lastCheckRef.current },
        });
        if (res.data && res.data.length > 0) {
          setNotifications((prev) => {
            const existingIds = new Set(prev.map((n) => n.id));
            const newOnes = res.data.filter((n) => !existingIds.has(n.id));
            if (newOnes.length > 0) {
              setUnreadCount((c) => c + newOnes.length);
              setToastMessage(newOnes[0]);
              setTimeout(() => setToastMessage(null), 6000);
            }
            return [...newOnes, ...prev].slice(0, 20);
          });
        }
        lastCheckRef.current = new Date().toISOString();
      } catch (err) {
        // Silently handle polling errors
      }
    };

    pollNotifications();
    const interval = setInterval(pollNotifications, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setUnreadCount(0);
    }
  };

  const handleSelect = (id: string) => {
    setIsOpen(false);
    setToastMessage(null);
    navigate(`/contracts/${id}`);
    if (onSelectContract) {
      onSelectContract(id);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      {/* Toast Alert for newly arrived contract */}
      {toastMessage && (
        <div
          onClick={() => handleSelect(toastMessage.id)}
          style={{
            position: 'fixed',
            bottom: '1.5rem',
            right: '1.5rem',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--accent-primary)',
            backgroundColor: 'var(--bg-card)',
            color: 'var(--text-primary)',
            boxShadow: 'var(--shadow-lg)',
            maxWidth: 'min(380px, calc(100vw - 3rem))',
            width: '100%',
            cursor: 'pointer',
            animation: 'slideInRight 0.25s ease-out',
          }}
          title="Click to view full contract details"
        >
          <div
            style={{
              padding: '0.5rem',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--accent-soft)',
              color: 'var(--accent-primary)',
              flexShrink: 0,
            }}
          >
            <Bell size={18} style={{ animation: 'spin 2s ease infinite' }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: '0.675rem',
                fontWeight: 800,
                color: 'var(--accent-primary)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              New Agreement Arrived
            </div>
            {/* Document Title prominently shown */}
            <div
              style={{
                fontSize: '0.875rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginTop: '0.2rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {toastMessage.title || 'Contract Document'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.25rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--accent-primary)' }}>
                ID: {toastMessage.id}
              </span>
              <span>&bull;</span>
              <span>{toastMessage.record_type}</span>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setToastMessage(null);
            }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              padding: '0.2rem',
            }}
            aria-label="Close notification"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Bell Button */}
      <button
        onClick={handleToggle}
        style={{
          position: 'relative',
          padding: '0.5rem',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-card)',
          color: 'var(--text-primary)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.15s ease',
        }}
        title="Live Contract Notifications"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '18px',
              minWidth: '18px',
              padding: '0 4px',
              borderRadius: '9999px',
              backgroundColor: '#ef4444',
              color: '#ffffff',
              fontSize: '10px',
              fontWeight: 800,
              boxShadow: '0 0 8px rgba(239, 68, 68, 0.7)',
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Responsive Dropdown Menu */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            marginTop: '0.5rem',
            width: 'min(380px, calc(100vw - 2rem))',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-card)',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 1000,
            overflow: 'hidden',
            animation: 'modalIn 0.15s ease-out',
          }}
        >
          {/* Dropdown Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.85rem 1rem',
              borderBottom: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-secondary)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Bell size={16} style={{ color: 'var(--accent-primary)' }} />
              <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Notifications
              </span>
            </div>
            <span
              style={{
                fontSize: '0.675rem',
                fontWeight: 700,
                padding: '0.15rem 0.5rem',
                borderRadius: '9999px',
                backgroundColor: 'var(--accent-soft)',
                color: 'var(--accent-primary)',
                border: '1px solid var(--border-color)',
              }}
            >
              {notifications.length} {notifications.length === 1 ? 'Record' : 'Records'}
            </span>
          </div>

          {/* Notifications List */}
          <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <CheckCircle size={32} style={{ color: 'var(--success)', margin: '0 auto 0.75rem', opacity: 0.8 }} />
                <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  All Caught Up
                </p>
                <p style={{ margin: '0.35rem 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  New incoming contract agreements will notify you in real-time.
                </p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleSelect(n.id)}
                  style={{
                    padding: '0.85rem 1rem',
                    borderBottom: '1px solid var(--border-color)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    transition: 'background-color 0.15s ease',
                  }}
                  className="hover-row"
                  title="Click to view complete details with ID"
                >
                  <div
                    style={{
                      padding: '0.45rem',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--accent-soft)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--accent-primary)',
                      flexShrink: 0,
                      marginTop: '2px',
                    }}
                  >
                    <FileText size={16} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Document Name as primary title */}
                    <div
                      style={{
                        fontSize: '0.875rem',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      title={n.title}
                    >
                      {n.title || 'Contract Agreement'}
                    </div>

                    {/* Metadata: ID badge, type, counterparty */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        marginTop: '0.25rem',
                        fontSize: '0.725rem',
                        flexWrap: 'wrap',
                      }}
                    >
                      <span
                        style={{
                          fontFamily: 'monospace',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          color: 'var(--accent-primary)',
                          backgroundColor: 'var(--bg-input)',
                          padding: '0.1rem 0.4rem',
                          borderRadius: '4px',
                          border: '1px solid var(--border-color)',
                        }}
                      >
                        ID: {n.id}
                      </span>
                      <span style={{ color: 'var(--text-muted)' }}>&bull;</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{n.record_type}</span>
                      {n.counterparty_name && (
                        <>
                          <span style={{ color: 'var(--text-muted)' }}>&bull;</span>
                          <span style={{ color: 'var(--text-muted)' }} className="truncate">
                            {n.counterparty_name}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
