import React, { useState, useEffect } from 'react';
import { User, RoleDefinition } from '../types';
import { apiClient } from '../api/client';
import { RoleManagerModal } from '../components/RoleManagerModal';
import { Shield, UserCog, Check, Key, ShieldAlert } from 'lucide-react';

export const AdminRoles: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<RoleDefinition[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const fetchUsersAndRoles = async () => {
    try {
      setIsLoading(true);
      const [usersRes, rolesRes] = await Promise.all([
        apiClient.get<User[]>('/users'),
        apiClient.get<{ roles: RoleDefinition[] }>('/roles'),
      ]);
      setUsers(usersRes.data);
      setRoles(rolesRes.data.roles);
    } catch (err) {
      console.error('Failed to load RBAC administration data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersAndRoles();
  }, []);

  const handleEditRole = (user: User) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  return (
    <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '4rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-primary)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <Shield size={14} />
            Administrative Security Console
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.25rem' }}>
            Role-Based Access Control (RBAC) Matrix
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Configure and assign system roles and granular read/write/edit/admin permissions per user.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Loading user identities and role definitions...
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '1rem 1.25rem' }}>User Identity</th>
                <th style={{ padding: '1rem' }}>Active Role</th>
                <th style={{ padding: '1rem' }}>Granular Permissions</th>
                <th style={{ padding: '1rem' }}>Account Status</th>
                <th style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u.full_name}</div>
                    <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>{u.email}</div>
                  </td>

                  <td style={{ padding: '1rem' }}>
                    <span
                      className="badge"
                      style={{
                        backgroundColor:
                          u.role === 'admin'
                            ? 'rgba(239, 68, 68, 0.15)'
                            : u.role === 'manager'
                            ? 'rgba(245, 158, 11, 0.15)'
                            : u.role === 'editor'
                            ? 'rgba(2, 132, 199, 0.15)'
                            : 'rgba(16, 185, 129, 0.15)',
                        color:
                          u.role === 'admin'
                            ? '#ef4444'
                            : u.role === 'manager'
                            ? '#f59e0b'
                            : u.role === 'editor'
                            ? 'var(--accent-primary)'
                            : '#10b981',
                        border: '1px solid currentColor',
                      }}
                    >
                      {u.role.toUpperCase()}
                    </span>
                  </td>

                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                      {u.permissions && u.permissions.length > 0 ? (
                        u.permissions.map((p) => (
                          <span
                            key={p}
                            style={{
                              padding: '0.15rem 0.45rem',
                              backgroundColor: 'var(--bg-input)',
                              borderRadius: '4px',
                              fontSize: '0.725rem',
                              border: '1px solid var(--border-color)',
                            }}
                          >
                            {p}
                          </span>
                        ))
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>None</span>
                      )}
                    </div>
                  </td>

                  <td style={{ padding: '1rem' }}>
                    <span style={{ color: u.is_active ? 'var(--success)' : 'var(--danger)', fontSize: '0.8rem', fontWeight: 600 }}>
                      {u.is_active ? 'Active' : 'Disabled'}
                    </span>
                  </td>

                  <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                    <button
                      onClick={() => handleEditRole(u)}
                      className="btn btn-primary"
                      style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
                    >
                      <UserCog size={14} />
                      Edit Role &amp; Perms
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ROLE MANAGER MODAL */}
      <RoleManagerModal
        isOpen={isModalOpen}
        user={selectedUser}
        onClose={() => setIsModalOpen(false)}
        onUserUpdated={fetchUsersAndRoles}
        availableRoles={roles}
      />
    </div>
  );
};
