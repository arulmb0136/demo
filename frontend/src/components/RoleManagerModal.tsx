import React, { useState, useEffect } from 'react';
import { User, RoleDefinition } from '../types';
import { apiClient } from '../api/client';
import { X, ShieldCheck, Save, Check } from 'lucide-react';

interface RoleManagerModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onUserUpdated: () => void;
  availableRoles: RoleDefinition[];
}

export const RoleManagerModal: React.FC<RoleManagerModalProps> = ({
  user,
  isOpen,
  onClose,
  onUserUpdated,
  availableRoles,
}) => {
  const [selectedRole, setSelectedRole] = useState<string>('viewer');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(['read']);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setSelectedRole(user.role);
      setSelectedPermissions(user.permissions || ['read']);
      setError(null);
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const handleRoleChange = (newRole: string) => {
    setSelectedRole(newRole);
    const roleDef = availableRoles.find((r) => r.role_key === newRole);
    if (roleDef) {
      setSelectedPermissions(roleDef.default_permissions);
    }
  };

  const togglePermission = (perm: string) => {
    if (selectedPermissions.includes(perm)) {
      setSelectedPermissions(selectedPermissions.filter((p) => p !== perm));
    } else {
      setSelectedPermissions([...selectedPermissions, perm]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      setError(null);
      await apiClient.put(`/users/${user.id}/role`, {
        role: selectedRole,
        permissions: selectedPermissions,
      });
      onUserUpdated();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to update user permissions');
    } finally {
      setIsSaving(false);
    }
  };

  const PERMISSION_OPTIONS = [
    { key: 'read', label: 'Read Access', desc: 'Can view contracts, document metadata, and BI metrics' },
    { key: 'write', label: 'Write Access', desc: 'Can draft new contracts and upload attachments to S3' },
    { key: 'edit', label: 'Edit Access', desc: 'Can modify contract statuses, values, and attributes' },
    { key: 'delete', label: 'Delete Access', desc: 'Can archive or permanently remove contract records' },
    { key: 'admin', label: 'Administrator Access', desc: 'Full control over RBAC matrix, users, and external sync' },
  ];

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ maxWidth: '620px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <ShieldCheck size={22} color="var(--accent-primary)" />
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Manage RBAC Permissions</h2>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Target User: {user.email} ({user.full_name})
              </div>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-outline" style={{ padding: '0.35rem' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {error && (
            <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', padding: '0.65rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
              {error}
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              Assigned Role
            </label>
            <select
              className="select"
              value={selectedRole}
              onChange={(e) => handleRoleChange(e.target.value)}
            >
              {availableRoles.map((role) => (
                <option key={role.role_key} value={role.role_key}>
                  {role.display_name} ({role.role_key.toUpperCase()})
                </option>
              ))}
            </select>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
              {availableRoles.find((r) => r.role_key === selectedRole)?.description}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.65rem' }}>
              Granular Permission Overrides
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {PERMISSION_OPTIONS.map((perm) => {
                const isChecked = selectedPermissions.includes(perm.key);
                return (
                  <label
                    key={perm.key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.65rem 0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: isChecked ? 'var(--accent-soft)' : 'var(--bg-input)',
                      border: isChecked ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                      cursor: 'pointer',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {perm.label}
                      </div>
                      <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                        {perm.desc}
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => togglePermission(perm.key)}
                      style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                    />
                  </label>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={isSaving} className="btn btn-primary">
              <Save size={16} />
              {isSaving ? 'Updating...' : 'Save Permissions'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
