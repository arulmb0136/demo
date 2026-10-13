import React, { useState, useEffect } from 'react';
import { Contract, BiMetrics } from '../types';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';
import { ContractCard } from '../components/ContractCard';
import { ContractModal } from '../components/ContractModal';
import { DocumentViewer } from '../components/DocumentViewer';
import { BiTool } from '../components/BiTool';
import {
  LayoutGrid,
  Table as TableIcon,
  BarChart3,
  Files,
  Plus,
  RefreshCw,
  Search,
  Download,
  AlertCircle,
  Building2,
  Calendar,
  CheckCircle2,
} from 'lucide-react';

type TabType = 'grid' | 'table' | 'documents' | 'bi';

export const Dashboard: React.FC = () => {
  const { user, hasPermission } = useAuth();

  const [activeTab, setActiveTab] = useState<TabType>('grid');
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [biMetrics, setBiMetrics] = useState<BiMetrics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');

  // Modals state
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [viewingContract, setViewingContract] = useState<Contract | null>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const params: any = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (departmentFilter !== 'all') params.department = departmentFilter;
      if (searchQuery) params.search = searchQuery;

      const [contractsRes, biRes] = await Promise.all([
        apiClient.get<Contract[]>('/contracts', { params }),
        apiClient.get<BiMetrics>('/contracts/bi-metrics'),
      ]);

      setContracts(contractsRes.data);
      setBiMetrics(biRes.data);
    } catch (err) {
      console.error('Error fetching dashboard contracts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter, departmentFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  const handleIroncladSync = async () => {
    try {
      setIsSyncing(true);
      setSyncNotice(null);
      const res = await apiClient.post('/contracts/sync-ironclad');
      setSyncNotice(`Ironclad Sync Success: ${res.data.synced_count} contracts synchronized.`);
      await fetchData();
      setTimeout(() => setSyncNotice(null), 5000);
    } catch (err: any) {
      alert(`Ironclad sync failed: ${err?.response?.data?.detail || err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveContract = async (contractData: Partial<Contract>) => {
    if (editingContract) {
      await apiClient.put(`/contracts/${editingContract.id}`, contractData);
    } else {
      await apiClient.post('/contracts', contractData);
    }
    await fetchData();
  };

  const handleDeleteContract = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this contract?')) return;
    try {
      await apiClient.delete(`/contracts/${id}`);
      await fetchData();
    } catch (err: any) {
      alert(`Failed to delete: ${err?.response?.data?.detail || err.message}`);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const getStatusBadge = (s: string) => {
    const cls =
      s === 'signed'
        ? 'badge-signed'
        : s === 'in_review'
        ? 'badge-in_review'
        : s === 'out_for_signature'
        ? 'badge-out_for_signature'
        : 'badge-draft';
    return <span className={`badge ${cls}`}>{s.replace(/_/g, ' ')}</span>;
  };

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      {/* DASHBOARD HEADER */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
            Contracts &amp; Workflow Intelligence
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Operating via {user?.role.toUpperCase()} credentials &bull; Managing {contracts.length} active enterprise agreements
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Ironclad API Sync Trigger */}
          {hasPermission('write') && (
            <button
              onClick={handleIroncladSync}
              disabled={isSyncing}
              className="btn btn-secondary"
              title="Pull latest records directly from developer.ironcladapp.com"
            >
              <RefreshCw size={15} className={isSyncing ? 'animate-spin' : ''} />
              {isSyncing ? 'Syncing Ironclad...' : 'Sync Ironclad API'}
            </button>
          )}

          {/* New Contract Button */}
          {hasPermission('write') && (
            <button
              onClick={() => {
                setEditingContract(null);
                setIsContractModalOpen(true);
              }}
              className="btn btn-primary"
            >
              <Plus size={16} />
              New Contract
            </button>
          )}
        </div>
      </div>

      {syncNotice && (
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={18} />
          <span>{syncNotice}</span>
        </div>
      )}

      {/* FILTER & TAB BAR */}
      <div
        className="card"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          padding: '0.85rem 1.25rem',
          marginBottom: '1.75rem',
        }}
      >
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <button
            onClick={() => setActiveTab('grid')}
            className={`btn ${activeTab === 'grid' ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.825rem' }}
          >
            <LayoutGrid size={15} />
            Grid View
          </button>

          <button
            onClick={() => setActiveTab('table')}
            className={`btn ${activeTab === 'table' ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.825rem' }}
          >
            <TableIcon size={15} />
            Table View
          </button>

          <button
            onClick={() => setActiveTab('documents')}
            className={`btn ${activeTab === 'documents' ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.825rem' }}
          >
            <Files size={15} />
            Repository
          </button>

          <button
            onClick={() => setActiveTab('bi')}
            className={`btn ${activeTab === 'bi' ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.825rem' }}
          >
            <BarChart3 size={15} />
            Lite BI Tool
          </button>
        </div>

        {/* Search & Filters */}
        {activeTab !== 'bi' && (
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', width: '220px' }}>
              <input
                type="text"
                className="input"
                placeholder="Search contracts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '2rem', paddingRight: '0.5rem', fontSize: '0.825rem' }}
              />
              <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)' }} />
            </div>

            <select
              className="select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ width: '130px', fontSize: '0.825rem' }}
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="in_review">In Review</option>
              <option value="out_for_signature">Out for Signature</option>
              <option value="signed">Signed</option>
            </select>

            <select
              className="select"
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              style={{ width: '130px', fontSize: '0.825rem' }}
            >
              <option value="all">All Depts</option>
              <option value="Sales">Sales</option>
              <option value="Engineering">Engineering</option>
              <option value="Security">Security</option>
              <option value="Legal">Legal</option>
              <option value="IT Operations">IT Operations</option>
            </select>
          </form>
        )}
      </div>

      {/* TAB CONTENT VIEWS */}
      {isLoading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Retrieving contract records and synchronization stream...
        </div>
      ) : activeTab === 'grid' ? (
        /* GRID VIEW */
        contracts.length > 0 ? (
          <div className="grid-cards">
            {contracts.map((c) => (
              <ContractCard
                key={c.id}
                contract={c}
                onViewDetails={(item) => setViewingContract(item)}
                onEdit={(item) => {
                  setEditingContract(item);
                  setIsContractModalOpen(true);
                }}
                onDelete={handleDeleteContract}
              />
            ))}
          </div>
        ) : (
          <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No contracts matched the selected search criteria.
          </div>
        )
      ) : activeTab === 'table' ? (
        /* TABLE VIEW */
        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '0.85rem 1.25rem' }}>Contract Title</th>
                <th style={{ padding: '0.85rem 1rem' }}>Counterparty</th>
                <th style={{ padding: '0.85rem 1rem' }}>Department</th>
                <th style={{ padding: '0.85rem 1rem' }}>Value</th>
                <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                <th style={{ padding: '0.85rem 1rem' }}>Start Date</th>
                <th style={{ padding: '0.85rem 1rem' }}>Target Completion</th>
                <th style={{ padding: '0.85rem 1rem' }}>Timeline</th>
                <th style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {contracts.map((c) => (
                <tr key={c.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.15s ease' }}>
                  <td style={{ padding: '0.85rem 1.25rem', fontWeight: 600 }}>
                    <div style={{ cursor: 'pointer', color: 'var(--text-primary)' }} onClick={() => setViewingContract(c)}>
                      {c.title}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                      {c.template_name}
                    </div>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>{c.counterparty_name}</td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span style={{ color: 'var(--accent-primary)', fontWeight: 500 }}>{c.department}</span>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>{formatCurrency(c.contract_value)}</td>
                  <td style={{ padding: '0.85rem 1rem' }}>{getStatusBadge(c.status)}</td>
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {c.start_date ? new Date(c.start_date).toLocaleDateString() : 'N/A'}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {c.completion_date ? new Date(c.completion_date).toLocaleDateString() : 'N/A'}
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    {c.days_remaining !== undefined && c.days_remaining !== null ? (
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          backgroundColor: c.days_remaining < 30 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                          color: c.days_remaining < 30 ? '#ef4444' : '#10b981',
                        }}
                      >
                        {c.days_remaining < 0 ? `${Math.abs(c.days_remaining)}d overdue` : `${c.days_remaining}d left`}
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>-</span>
                    )}
                  </td>
                  <td style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>
                    <button
                      onClick={() => setViewingContract(c)}
                      className="btn btn-secondary"
                      style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                    >
                      View ({c.documents?.length || 0})
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : activeTab === 'documents' ? (
        /* DOCUMENT REPOSITORY VIEW */
        <div className="card" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem' }}>
            All S3 &amp; Ironclad Stored Documents
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {contracts.flatMap((c) =>
              (c.documents || []).map((doc) => (
                <div
                  key={doc.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.85rem 1.25rem',
                    backgroundColor: 'var(--bg-input)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{doc.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Belongs to: <strong>{c.title}</strong> &bull; S3 Key: {doc.s3_key}
                    </div>
                  </div>

                  <button
                    onClick={() => setViewingContract(c)}
                    className="btn btn-primary"
                    style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
                  >
                    <Download size={14} />
                    Access Document
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        /* LITE BI TOOL VIEW */
        <BiTool metrics={biMetrics} isLoading={isLoading} />
      )}

      {/* CONTRACT CREATE / EDIT MODAL */}
      <ContractModal
        isOpen={isContractModalOpen}
        onClose={() => setIsContractModalOpen(false)}
        onSave={handleSaveContract}
        contractToEdit={editingContract}
      />

      {/* DOCUMENT VIEWER & S3 UPLOAD MODAL */}
      <DocumentViewer
        isOpen={!!viewingContract}
        contract={viewingContract}
        onClose={() => setViewingContract(null)}
        onDocumentUploaded={() => {
          fetchData();
        }}
      />
    </div>
  );
};
