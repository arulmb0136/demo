import React, { useState, useEffect } from 'react';
import { User, RoleDefinition, PermissionOption } from '../types';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';
import {
  Shield,
  UserPlus,
  UserCog,
  PlusCircle,
  Edit2,
  Key,
  Check,
  X,
  FileCheck,
  Download,
  Eye,
  Lock,
  Layers,
  Building,
} from 'lucide-react';

export const AdminRoles: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'manager';
  const isEditor = user?.role === 'editor';
  const canAddUser = isAdmin || isManager;
  const canEditUser = isAdmin;

  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'categories'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<RoleDefinition[]>([]);
  const [permissions, setPermissions] = useState<PermissionOption[]>([]);
  const [allowedCategories, setAllowedCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // User Modals
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Role Modals
  const [isAddRoleOpen, setIsAddRoleOpen] = useState(false);
  const [isEditRoleOpen, setIsEditRoleOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleDefinition | null>(null);

  // Form states
  const [userFormData, setUserFormData] = useState({
    email: '',
    full_name: '',
    password: '',
    role: 'viewer',
    permissions: ['contracts:view'],
  });

  const [roleFormData, setRoleFormData] = useState({
    role_key: '',
    display_name: '',
    description: '',
    default_permissions: ['contracts:view'],
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsersAndRoles = async () => {
    try {
      setIsLoading(true);
      const [usersRes, matrixRes] = await Promise.all([
        apiClient.get<User[]>('/users'),
        apiClient.get<{
          roles: RoleDefinition[];
          available_permissions: PermissionOption[];
          allowed_categories: string[];
        }>('/roles'),
      ]);
      setUsers(usersRes.data);
      setRoles(matrixRes.data.roles);
      setPermissions(matrixRes.data.available_permissions || []);
      setAllowedCategories(matrixRes.data.allowed_categories || [
        'Property Service Contract',
        'Purchase & Sales Agreement',
        'General Services Agreement',
      ]);
    } catch (err) {
      console.error('Failed to load RBAC data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersAndRoles();
  }, []);

  // ----------------------------------------------------------------
  // User Handlers
  // ----------------------------------------------------------------
  const handleOpenAddUser = () => {
    setUserFormData({
      email: '',
      full_name: '',
      password: '',
      role: 'viewer',
      permissions: ['contracts:view'],
    });
    setFormError(null);
    setIsAddUserOpen(true);
  };

  const handleOpenEditUser = (user: User) => {
    setSelectedUser(user);
    setUserFormData({
      email: user.email,
      full_name: user.full_name,
      password: '',
      role: user.role,
      permissions: user.permissions || ['contracts:view'],
    });
    setFormError(null);
    setIsEditUserOpen(true);
  };

  const handleSaveAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setFormError(null);
      await apiClient.post('/users', userFormData);
      await fetchUsersAndRoles();
      setIsAddUserOpen(false);
    } catch (err: any) {
      setFormError(err?.response?.data?.detail || 'Failed to add user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      setIsSubmitting(true);
      setFormError(null);
      await apiClient.put(`/users/${selectedUser.id}`, {
        full_name: userFormData.full_name,
        role: userFormData.role,
        permissions: userFormData.permissions,
      });
      await fetchUsersAndRoles();
      setIsEditUserOpen(false);
    } catch (err: any) {
      setFormError(err?.response?.data?.detail || 'Failed to update user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleUserPerm = (perm: string) => {
    const current = userFormData.permissions;
    if (current.includes(perm)) {
      setUserFormData({ ...userFormData, permissions: current.filter((p) => p !== perm) });
    } else {
      setUserFormData({ ...userFormData, permissions: [...current, perm] });
    }
  };

  // ----------------------------------------------------------------
  // Role Handlers
  // ----------------------------------------------------------------
  const handleOpenAddRole = () => {
    setRoleFormData({
      role_key: '',
      display_name: '',
      description: '',
      default_permissions: ['contracts:view'],
    });
    setFormError(null);
    setIsAddRoleOpen(true);
  };

  const handleOpenEditRole = (role: RoleDefinition) => {
    setSelectedRole(role);
    setRoleFormData({
      role_key: role.role_key,
      display_name: role.display_name,
      description: role.description,
      default_permissions: role.default_permissions || ['contracts:view'],
    });
    setFormError(null);
    setIsEditRoleOpen(true);
  };

  const handleSaveAddRole = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setFormError(null);
      await apiClient.post('/roles', roleFormData);
      await fetchUsersAndRoles();
      setIsAddRoleOpen(false);
    } catch (err: any) {
      setFormError(err?.response?.data?.detail || 'Failed to create role');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEditRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;
    try {
      setIsSubmitting(true);
      setFormError(null);
      await apiClient.put(`/roles/${selectedRole.id}`, {
        display_name: roleFormData.display_name,
        description: roleFormData.description,
        default_permissions: roleFormData.default_permissions,
      });
      await fetchUsersAndRoles();
      setIsEditRoleOpen(false);
    } catch (err: any) {
      setFormError(err?.response?.data?.detail || 'Failed to update role');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleRolePerm = (perm: string) => {
    const current = roleFormData.default_permissions;
    if (current.includes(perm)) {
      setRoleFormData({ ...roleFormData, default_permissions: current.filter((p) => p !== perm) });
    } else {
      setRoleFormData({ ...roleFormData, default_permissions: [...current, perm] });
    }
  };

  return (
    <div className="container" style={{ padding: '2.5rem 1rem 4rem' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-primary)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <Shield size={14} />
            PostgreSQL Security &amp; Access Layer
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.25rem', color: 'var(--text-primary)' }}>
            User &amp; Role Management (RBAC)
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Manage platform users, roles, view &amp; download authorization policies, and category controls.
          </p>
        </div>

        {/* Action Button */}
        {activeTab === 'users' && canAddUser && (
          <button onClick={handleOpenAddUser} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <UserPlus size={16} />
            + Add New User
          </button>
        )}
        {activeTab === 'roles' && isAdmin && (
          <button onClick={handleOpenAddRole} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <PlusCircle size={16} />
            + Add New Role
          </button>
        )}
      </div>



            {/* Navigation Tabs */}
      <div className="admin-tabs-nav">
        <button
          onClick={() => setActiveTab('users')}
          className={`admin-tab-btn ${activeTab === 'users' ? 'active' : ''}`}
        >
          Users List ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('roles')}
          className={`admin-tab-btn ${activeTab === 'roles' ? 'active' : ''}`}
        >
          Roles &amp; Policies ({roles.length})
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`admin-tab-btn ${activeTab === 'categories' ? 'active' : ''}`}
        >
          Whitelisted Categories ({allowedCategories.length})
        </button>
      </div>

      {isLoading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem' }} />
          Loading User Identities &amp; Access Policies from PostgreSQL...
        </div>
      ) : activeTab === 'users' ? (
        /* USERS TABLE */
        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '1rem 1.25rem' }}>User Identity</th>
                <th style={{ padding: '1rem' }}>Active Role</th>
                <th style={{ padding: '1rem' }}>Permission Policies</th>
                <th style={{ padding: '1rem' }}>Status</th>
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
                    <span className="badge" style={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>
                      {u.role}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                      {(u.permissions || []).map((p) => (
                        <span
                          key={p}
                          style={{
                            padding: '0.15rem 0.45rem',
                            backgroundColor: 'var(--bg-input)',
                            borderRadius: '4px',
                            fontSize: '0.725rem',
                            border: '1px solid var(--border-color)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                          }}
                        >
                          {p.includes('download') ? <Download size={11} color="var(--accent-primary)" /> : <Eye size={11} />}
                          {p}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ color: u.is_active ? 'var(--success)' : 'var(--danger)', fontSize: '0.8rem', fontWeight: 600 }}>
                      {u.is_active ? '● Active' : '○ Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                    {canEditUser ? (
                      <button
                        onClick={() => handleOpenEditUser(u)}
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                      >
                        <UserCog size={14} />
                        Edit User
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        Read Only
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : activeTab === 'roles' ? (
        /* ROLES GRID */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {roles.map((r) => (
            <div
              key={r.id}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '1.25rem',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-primary)' }}>
                    ROLE: {r.role_key.toUpperCase()}
                  </span>
                  {isAdmin && (
                    <button
                      onClick={() => handleOpenEditRole(r)}
                      className="btn btn-outline"
                      style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem' }}
                    >
                      <Edit2 size={13} />
                      Edit
                    </button>
                  )}
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                  {r.display_name}
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.4 }}>
                  {r.description}
                </p>
              </div>

              <div>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.35rem' }}>
                  Default Permission Policy:
                </span>
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                  {(r.default_permissions || []).map((perm) => (
                    <span
                      key={perm}
                      style={{
                        padding: '0.15rem 0.45rem',
                        backgroundColor: 'var(--bg-input)',
                        borderRadius: '4px',
                        fontSize: '0.725rem',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      {perm}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* CATEGORIES & AUTHORIZATION TAB */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Layers size={18} color="var(--accent-primary)" />
              Authorized Live Ironclad Record Types
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              The backend enforces strict record-level filtering. Only agreements matching one of the following 3 allowed record types are processed and rendered:
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
              {allowedCategories.map((cat, idx) => (
                <div
                  key={cat}
                  style={{
                    padding: '1rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-input)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                    <span style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'var(--accent-soft)', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>
                      {idx + 1}
                    </span>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {cat}
                    </h4>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Authorized for live query via GET /records/ids &amp; GET /records/:id.
                  </p>
                  <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.35rem' }}>
                    <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: '4px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                      View: Allowed
                    </span>
                    <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: '4px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                      Download: RBAC Governed
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ADD USER MODAL */}
      {isAddUserOpen && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '540px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem', borderBottom: '1px solid var(--border-color)' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Add New Platform User</h2>
              <button onClick={() => setIsAddUserOpen(false)} className="btn btn-outline" style={{ padding: '0.35rem' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveAddUser} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {formError && (
                <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', padding: '0.65rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
                  {formError}
                </div>
              )}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Full Name</label>
                <input
                  type="text"
                  required
                  className="input"
                  value={userFormData.full_name}
                  onChange={(e) => setUserFormData({ ...userFormData, full_name: e.target.value })}
                  placeholder="e.g. Rachel Martinez"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Email Address</label>
                <input
                  type="email"
                  required
                  className="input"
                  value={userFormData.email}
                  onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                  placeholder="user@ironclad.demo"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Password</label>
                <input
                  type="password"
                  required
                  className="input"
                  value={userFormData.password}
                  onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                  placeholder="Minimum 6 characters"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Assigned Role</label>
                <select
                  className="select"
                  value={userFormData.role}
                  onChange={(e) => {
                    const rKey = e.target.value;
                    const rDef = roles.find((r) => r.role_key === rKey);
                    setUserFormData({
                      ...userFormData,
                      role: rKey,
                      permissions: rDef ? rDef.default_permissions : ['contracts:view'],
                    });
                  }}
                >
                  {roles.map((r) => (
                    <option key={r.role_key} value={r.role_key}>
                      {r.display_name} ({r.role_key.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.45rem' }}>
                  Permission Policies
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {permissions.map((p) => (
                    <label key={p.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', fontSize: '0.8rem', cursor: 'pointer' }}>
                      <span>{p.label} <small style={{ color: 'var(--text-muted)' }}>({p.key})</small></span>
                      <input
                        type="checkbox"
                        checked={userFormData.permissions.includes(p.key)}
                        onChange={() => toggleUserPerm(p.key)}
                      />
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
                <button type="button" onClick={() => setIsAddUserOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="btn btn-primary">
                  {isSubmitting ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {isEditUserOpen && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '540px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem', borderBottom: '1px solid var(--border-color)' }}>
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Edit User &amp; Access Policies</h2>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{userFormData.email}</div>
              </div>
              <button onClick={() => setIsEditUserOpen(false)} className="btn btn-outline" style={{ padding: '0.35rem' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveEditUser} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {formError && (
                <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', padding: '0.65rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
                  {formError}
                </div>
              )}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Full Name</label>
                <input
                  type="text"
                  required
                  className="input"
                  value={userFormData.full_name}
                  onChange={(e) => setUserFormData({ ...userFormData, full_name: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Assigned Role</label>
                <select
                  className="select"
                  value={userFormData.role}
                  onChange={(e) => {
                    const rKey = e.target.value;
                    const rDef = roles.find((r) => r.role_key === rKey);
                    setUserFormData({
                      ...userFormData,
                      role: rKey,
                      permissions: rDef ? rDef.default_permissions : userFormData.permissions,
                    });
                  }}
                >
                  {roles.map((r) => (
                    <option key={r.role_key} value={r.role_key}>
                      {r.display_name} ({r.role_key.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.45rem' }}>
                  Permission Policies
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {permissions.map((p) => (
                    <label key={p.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', fontSize: '0.8rem', cursor: 'pointer' }}>
                      <span>{p.label} <small style={{ color: 'var(--text-muted)' }}>({p.key})</small></span>
                      <input
                        type="checkbox"
                        checked={userFormData.permissions.includes(p.key)}
                        onChange={() => toggleUserPerm(p.key)}
                      />
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
                <button type="button" onClick={() => setIsEditUserOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="btn btn-primary">
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD ROLE MODAL */}
      {isAddRoleOpen && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '540px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem', borderBottom: '1px solid var(--border-color)' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Add New System Role</h2>
              <button onClick={() => setIsAddRoleOpen(false)} className="btn btn-outline" style={{ padding: '0.35rem' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveAddRole} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {formError && (
                <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', padding: '0.65rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
                  {formError}
                </div>
              )}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Role Key (Identifier)</label>
                <input
                  type="text"
                  required
                  className="input"
                  value={roleFormData.role_key}
                  onChange={(e) => setRoleFormData({ ...roleFormData, role_key: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                  placeholder="e.g. legal_auditor"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Display Name</label>
                <input
                  type="text"
                  required
                  className="input"
                  value={roleFormData.display_name}
                  onChange={(e) => setRoleFormData({ ...roleFormData, display_name: e.target.value })}
                  placeholder="e.g. Legal Operations Auditor"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Description</label>
                <input
                  type="text"
                  required
                  className="input"
                  value={roleFormData.description}
                  onChange={(e) => setRoleFormData({ ...roleFormData, description: e.target.value })}
                  placeholder="Brief summary of duties and access level"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.45rem' }}>
                  Default Permission Policy
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {permissions.map((p) => (
                    <label key={p.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', fontSize: '0.8rem', cursor: 'pointer' }}>
                      <span>{p.label} <small style={{ color: 'var(--text-muted)' }}>({p.key})</small></span>
                      <input
                        type="checkbox"
                        checked={roleFormData.default_permissions.includes(p.key)}
                        onChange={() => toggleRolePerm(p.key)}
                      />
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
                <button type="button" onClick={() => setIsAddRoleOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="btn btn-primary">
                  {isSubmitting ? 'Creating...' : 'Create Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT ROLE MODAL */}
      {isEditRoleOpen && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '540px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem', borderBottom: '1px solid var(--border-color)' }}>
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Edit Role: {roleFormData.display_name}</h2>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>KEY: {roleFormData.role_key}</div>
              </div>
              <button onClick={() => setIsEditRoleOpen(false)} className="btn btn-outline" style={{ padding: '0.35rem' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveEditRole} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {formError && (
                <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', padding: '0.65rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
                  {formError}
                </div>
              )}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Display Name</label>
                <input
                  type="text"
                  required
                  className="input"
                  value={roleFormData.display_name}
                  onChange={(e) => setRoleFormData({ ...roleFormData, display_name: e.target.value })}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Description</label>
                <input
                  type="text"
                  required
                  className="input"
                  value={roleFormData.description}
                  onChange={(e) => setRoleFormData({ ...roleFormData, description: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.45rem' }}>
                  Default Permission Policy
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {permissions.map((p) => (
                    <label key={p.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', fontSize: '0.8rem', cursor: 'pointer' }}>
                      <span>{p.label} <small style={{ color: 'var(--text-muted)' }}>({p.key})</small></span>
                      <input
                        type="checkbox"
                        checked={roleFormData.default_permissions.includes(p.key)}
                        onChange={() => toggleRolePerm(p.key)}
                      />
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
                <button type="button" onClick={() => setIsEditRoleOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="btn btn-primary">
                  {isSubmitting ? 'Saving...' : 'Save Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
