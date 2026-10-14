import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCircle, FileText, X } from 'lucide-react';
import { apiClient } from '../api/client';
import { ContractNotification } from '../types';
import { useAuth } from '../context/AuthContext';

interface NotificationCenterProps {
  onSelectContract?: (recordId: string) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ onSelectContract }) => {
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
          params: { since: lastCheckRef.current }
        });
        if (res.data && res.data.length > 0) {
          // Identify newly arrived ones
          setNotifications((prev) => {
            const existingIds = new Set(prev.map((n) => n.id));
            const newOnes = res.data.filter((n) => !existingIds.has(n.id));
            if (newOnes.length > 0) {
              setUnreadCount((c) => c + newOnes.length);
              setToastMessage(newOnes[0]); // Trigger toast for newest
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

    // Run initial poll immediately
    pollNotifications();

    // Poll every 30 seconds
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
    if (onSelectContract) {
      onSelectContract(id);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Toast Alert for incoming contract */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-start gap-3 p-4 rounded-xl border border-primary bg-surface shadow-2xl animate-bounce-in max-w-sm">
          <div className="p-2 rounded-lg bg-accent/20 text-accent flex-shrink-0">
            <Bell className="w-5 h-5 animate-pulse" />
          </div>
          <div className="flex-1">
            <h4 className="text-xs font-bold text-accent uppercase tracking-wider">New Agreement Arrived</h4>
            <p className="text-sm font-semibold text-primary line-clamp-1 mt-0.5">{toastMessage.title}</p>
            <p className="text-xs text-secondary mt-0.5">
              {toastMessage.record_type} • {toastMessage.counterparty_name}
            </p>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-secondary hover:text-primary transition-colors p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Bell Button */}
      <button
        onClick={handleToggle}
        className="relative p-2 rounded-lg border border-border bg-surface text-secondary hover:text-primary hover:border-accent transition-all duration-200"
        title="Live Contract Notifications"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-black ring-2 ring-surface">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 md:w-96 rounded-xl border border-border bg-surface shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface-hover">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-accent" />
              <h3 className="text-sm font-semibold text-primary">Live Ironclad Notifications</h3>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-accent/20 text-accent font-medium">
              Live Polling
            </span>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-border">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-secondary">
                <CheckCircle className="w-8 h-8 mx-auto text-success/60 mb-2" />
                <p className="text-sm">No new contracts at this moment.</p>
                <p className="text-xs text-muted mt-1">Incoming Ironclad agreements will alert you here.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleSelect(n.id)}
                  className="p-3.5 hover:bg-surface-hover cursor-pointer transition-colors flex items-start gap-3"
                >
                  <div className="p-2 rounded-lg bg-surface border border-border text-accent flex-shrink-0 mt-0.5">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono text-accent truncate">{n.id}</p>
                    <p className="text-sm font-medium text-primary line-clamp-1">{n.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs px-2 py-0.5 rounded bg-surface border border-border text-secondary">
                        {n.record_type}
                      </span>
                      <span className="text-xs text-secondary truncate">{n.counterparty_name}</span>
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
