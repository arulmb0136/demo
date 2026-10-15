import React, { useState, useEffect } from 'react';
import { Contract, BiMetrics } from '../types';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';
import { ContractCard } from '../components/ContractCard';
import { ContractDetailModal } from '../components/ContractDetailModal';
import { BiTool } from '../components/BiTool';
import {
  LayoutGrid,
  Table as TableIcon,
  BarChart3,
  Search,
  Building2,
  FileText,
  Eye,
  AlertCircle,
  Filter,
} from 'lucide-react';

type TabType = 'grid' | 'table' | 'bi';

const ALLOWED_TYPES = [
  'All Types',
  'Property Service Contract (BH)',
  'Purchase & Sale Agreement (BH)',
  'General Services Agreement (BH)',
];

export const Dashboard: React.FC = () => {
  const { user, hasPermission } = useAuth();

  const [activeTab, setActiveTab] = useState<TabType>('grid');
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [recordIds, setRecordIds] = useState<string[]>([]);
  const [biMetrics, setBiMetrics] = useState<BiMetrics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All Types');

  // Modal State
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const params: any = {};
      if (selectedType !== 'All Types') params.record_type = selectedType;
      if (searchQuery) params.search = searchQuery;

      const [contractsRes, idsRes, biRes] = await Promise.all([
        apiClient.get<Contract[]>('/contracts', { params }),
        apiClient.get<string[]>('/contracts/ids'),
        apiClient.get<BiMetrics>('/contracts/bi-metrics'),
      ]);

      setContracts(contractsRes.data);
      setRecordIds(idsRes.data);
      setBiMetrics(biRes.data);
    } catch (err) {
      console.error('Error fetching live Ironclad contracts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedType]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  const handleOpenDetail = (contract: Contract) => {
    setSelectedContract(contract);
    setIsDetailModalOpen(true);
  };

  const formatCurrency = (val: number, cur: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: cur,
      maximumFractionDigits: 0,
    }).format(val);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="container" style={{ padding: '2rem 1rem' }}>
      {/* Top Banner: Ironclad Live Repository Indicator */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.75rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Contract Repository
            </h1>
            <span
              style={{
                fontSize: '0.75rem',
                padding: '0.2rem 0.6rem',
                borderRadius: '9999px',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                fontWeight: 700,
                border: '1px solid rgba(16, 185, 129, 0.3)',
              }}
            >
              ● LIVE IRONCLAD API
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Live Ironclad Repository • Whitelisted Types: Property Service Contract, Purchase &amp; Sales Agreement, General Services Agreement.
          </p>
        </div>
      </div>

      {/* Record IDs Bar */}
      <div
        style={{
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          padding: '0.85rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Live Record IDs ({recordIds.length}):
          </span>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {recordIds.slice(0, 6).map((id) => (
              <span
                key={id}
                style={{
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  padding: '0.15rem 0.45rem',
                  borderRadius: '4px',
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--accent-primary)',
                }}
              >
                {id}
              </span>
            ))}
            {recordIds.length > 6 && (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', alignSelf: 'center' }}>
                +{recordIds.length - 6} more
              </span>
            )}
          </div>
        </div>

        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          Database Persistence: <strong style={{ color: 'var(--accent-primary)' }}>Disabled (Zero Storage)</strong>
        </div>
      </div>

      {/* Search, Whitelisted Type Filter & Tabs */}
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
        {/* Search Input Form */}
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', flex: '1', maxWidth: '420px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '0.85rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
            <input
              type="text"
              placeholder="Search by ID, title, counterparty..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input"
              style={{ paddingLeft: '2.4rem', width: '100%' }}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>
            Search
          </button>
        </form>

        {/* Record Type Category Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
          <Filter size={15} style={{ color: 'var(--text-muted)', marginRight: '0.2rem' }} />
          {ALLOWED_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              style={{
                fontSize: '0.775rem',
                padding: '0.35rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 600,
                border: '1px solid',
                borderColor: selectedType === type ? 'var(--accent-primary)' : 'var(--border-color)',
                backgroundColor: selectedType === type ? 'var(--accent-soft)' : 'var(--bg-secondary)',
                color: selectedType === type ? 'var(--accent-primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {type}
            </button>
          ))}
        </div>

        {/* View Tabs Switcher */}
        <div style={{ display: 'flex', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', padding: '0.25rem' }}>
          <button
            onClick={() => setActiveTab('grid')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.4rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.8rem',
              fontWeight: 600,
              border: 'none',
              backgroundColor: activeTab === 'grid' ? 'var(--bg-surface)' : 'transparent',
              color: activeTab === 'grid' ? 'var(--accent-primary)' : 'var(--text-secondary)',
              boxShadow: activeTab === 'grid' ? 'var(--shadow-sm)' : 'none',
              cursor: 'pointer',
            }}
          >
            <LayoutGrid size={15} />
            Grid
          </button>

          <button
            onClick={() => setActiveTab('table')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.4rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.8rem',
              fontWeight: 600,
              border: 'none',
              backgroundColor: activeTab === 'table' ? 'var(--bg-surface)' : 'transparent',
              color: activeTab === 'table' ? 'var(--accent-primary)' : 'var(--text-secondary)',
              boxShadow: activeTab === 'table' ? 'var(--shadow-sm)' : 'none',
              cursor: 'pointer',
            }}
          >
            <TableIcon size={15} />
            Table
          </button>

          <button
            onClick={() => setActiveTab('bi')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.4rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.8rem',
              fontWeight: 600,
              border: 'none',
              backgroundColor: activeTab === 'bi' ? 'var(--bg-surface)' : 'transparent',
              color: activeTab === 'bi' ? 'var(--accent-primary)' : 'var(--text-secondary)',
              boxShadow: activeTab === 'bi' ? 'var(--shadow-sm)' : 'none',
              cursor: 'pointer',
            }}
          >
            <BarChart3 size={15} />
            Lite BI Tool
          </button>
        </div>
      </div>

      {/* Main Content Areas */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--text-secondary)' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem' }} />
          <p style={{ fontWeight: 600 }}>Querying Ironclad API &amp; Validating Whitelisted Record Types...</p>
        </div>
      ) : activeTab === 'grid' ? (
        /* GRID VIEW */
        contracts.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
            <AlertCircle size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>No Matching Contracts Found</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              No live records in Ironclad match your current filter or query.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {contracts.map((c) => (
              <ContractCard
                key={c.id}
                contract={c}
                onViewDetails={handleOpenDetail}
              />
            ))}
          </div>
        )
      ) : activeTab === 'table' ? (
        /* TABLE VIEW */
        <div className="card" style={{ overflowX: 'auto', padding: '0' }}>
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', backgroundColor: 'var(--bg-input)' }}>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>RECORD ID</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>TITLE</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>RECORD TYPE</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>COUNTERPARTY</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>COMMUNITY</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>EFFECTIVE</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>EXPIRATION</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>STATUS</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>DOCS</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'right' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {contracts.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => handleOpenDetail(c)}
                  style={{
                    borderBottom: '1px solid var(--border-color)',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s ease',
                  }}
                  className="hover-row"
                >
                  <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 600 }}>
                    {c.ironclad_id || c.id}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: 'var(--text-primary)', maxWidth: '240px' }}>
                    <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name || c.title}</div>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.75rem' }}>
                    <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', fontWeight: 600 }}>
                      {c.type_display_name || c.record_type}
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {c.counterparty_name}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {c.community_name || 'N/A'}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {formatDate(c.effective_date || c.agreement_date)}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {formatDate(c.expiration_date || c.completion_date)}
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span className="badge" style={{ fontSize: '0.7rem' }}>
                      {c.enhanced_status || c.status}
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <FileText size={13} style={{ color: 'var(--accent-primary)' }} />
                      <span>{c.attachment_count ?? (c.attachments?.length || 0)}</span>
                    </div>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDetail(c);
                      }}
                      className="btn btn-secondary"
                      style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                    >
                      <Eye size={13} />
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* LITE BI TOOL VIEW */
        <BiTool metrics={biMetrics} />
      )}

      {/* Contract Detailed View Modal (With Document View & Download RBAC) */}
      <ContractDetailModal
        contract={selectedContract}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
      />
    </div>
  );
};
