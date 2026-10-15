import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Contract, BiMetrics } from '../types';
import { apiClient } from '../api/client';
import { ContractCard } from '../components/ContractCard';
import { BiTool } from '../components/BiTool';
import {
  LayoutGrid,
  Table as TableIcon,
  BarChart3,
  Search,
  FileText,
  Eye,
  AlertCircle,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

type TabType = 'grid' | 'table' | 'bi';

const ALLOWED_TYPES = [
  'All Types',
  'Property Service Contract (BH)',
  'Purchase & Sale Agreement (BH)',
  'General Services Agreement (BH)',
];

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<TabType>('grid');
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [biMetrics, setBiMetrics] = useState<BiMetrics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All Types');

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(9);

  const fetchData = async (overrideSearch?: string) => {
    try {
      setIsLoading(true);
      const params: Record<string, string> = {};
      if (selectedType !== 'All Types') params.record_type = selectedType;
      const query = overrideSearch !== undefined ? overrideSearch : searchQuery;
      if (query.trim()) params.search = query.trim();

      const [contractsRes, biRes] = await Promise.all([
        apiClient.get<Contract[]>('/contracts', { params }),
        apiClient.get<BiMetrics>('/contracts/bi-metrics', { params }),
      ]);

      setContracts(contractsRes.data);
      setBiMetrics(biRes.data);
    } catch (err) {
      console.error('Error fetching contracts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    setCurrentPage(1);
  }, [selectedType]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchData();
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setCurrentPage(1);
    fetchData('');
  };

  const handleOpenDetail = (contract: Contract) => {
    navigate(`/contracts/${contract.id}`);
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

  // Pagination Computations
  const totalItems = contracts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);
  const startIndex = (validCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedContracts = contracts.slice(startIndex, endIndex);

  return (
    <div className="dashboard-container">
      {/* Top Header: Title, Count, & View Switcher */}
      <div className="dashboard-header">
        <div>
          <div className="dashboard-title-row">
            <h1 className="dashboard-title">Contracts</h1>
            <span className="count-badge">
              {totalItems} {totalItems === 1 ? 'Record' : 'Records'}
            </span>
          </div>
          <p className="dashboard-subtitle">
            Search, filter, and inspect enterprise agreements and attachments.
          </p>
        </div>

        {/* View Switcher Controls */}
        <div className="view-switcher" role="tablist">
          <button
            type="button"
            onClick={() => setActiveTab('grid')}
            className={`view-tab-btn ${activeTab === 'grid' ? 'active' : ''}`}
            aria-selected={activeTab === 'grid'}
          >
            <LayoutGrid size={15} />
            <span>Grid</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('table')}
            className={`view-tab-btn ${activeTab === 'table' ? 'active' : ''}`}
            aria-selected={activeTab === 'table'}
          >
            <TableIcon size={15} />
            <span>Table</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('bi')}
            className={`view-tab-btn ${activeTab === 'bi' ? 'active' : ''}`}
            aria-selected={activeTab === 'bi'}
          >
            <BarChart3 size={15} />
            <span>Analytics</span>
          </button>
        </div>
      </div>

      {/* Direct Search & Category Filter Toolbar */}
      <div className="dashboard-toolbar">
        {/* Search Input Form */}
        <form onSubmit={handleSearchSubmit} className="search-form">
          <div className="search-input-wrapper">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search by ID, title, or counterparty..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input search-input"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="search-clear-btn"
                title="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <button type="submit" className="btn btn-primary search-submit-btn">
            Search
          </button>
        </form>

        {/* Contract Type Filter Pills */}
        <div className="filter-group">
          <span className="filter-label">
            <Filter size={13} />
            <span>Type:</span>
          </span>
          {ALLOWED_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setSelectedType(type)}
              className={`filter-pill ${selectedType === type ? 'active' : ''}`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content: Loading, Grid, Table, or Analytics */}
      {isLoading ? (
        <div className="empty-state">
          <div className="spinner" style={{ margin: '0 auto 1.25rem' }} />
          <h3 className="empty-state-title">Loading Contracts</h3>
          <p className="empty-state-desc">Retrieving records and applying security filters...</p>
        </div>
      ) : activeTab === 'grid' ? (
        /* GRID VIEW */
        totalItems === 0 ? (
          <div className="empty-state">
            <AlertCircle size={40} className="empty-state-icon" />
            <h3 className="empty-state-title">No Matching Contracts Found</h3>
            <p className="empty-state-desc">
              No contract records match your current filter or search criteria.
            </p>
          </div>
        ) : (
          <>
            <div className="contract-grid">
              {paginatedContracts.map((c) => (
                <ContractCard
                  key={c.id}
                  contract={c}
                  onViewDetails={handleOpenDetail}
                />
              ))}
            </div>

            {/* Pagination Controls */}
            {totalItems > 0 && (
              <div className="pagination-bar">
                <div className="pagination-info">
                  Showing <strong>{startIndex + 1}</strong> to <strong>{endIndex}</strong> of <strong>{totalItems}</strong> contracts (Page {validCurrentPage} of {totalPages})
                </div>

                <div className="pagination-actions">
                  <div className="pagination-page-size">
                    <span>Per page:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="select-page-size"
                    >
                      <option value={6}>6</option>
                      <option value={9}>9</option>
                      <option value={12}>12</option>
                      <option value={24}>24</option>
                    </select>
                  </div>

                  <div className="pagination-buttons">
                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                      disabled={validCurrentPage === 1}
                      className="pagination-nav-btn"
                      title="Previous Page"
                    >
                      <ChevronLeft size={16} />
                      <span>Prev</span>
                    </button>

                    <div className="pagination-pages">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => setCurrentPage(pageNum)}
                          className={`pagination-number-btn ${pageNum === validCurrentPage ? 'active' : ''}`}
                        >
                          {pageNum}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                      disabled={validCurrentPage === totalPages}
                      className="pagination-nav-btn"
                      title="Next Page"
                    >
                      <span>Next</span>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )
      ) : activeTab === 'table' ? (
        /* TABLE VIEW */
        totalItems === 0 ? (
          <div className="empty-state">
            <AlertCircle size={40} className="empty-state-icon" />
            <h3 className="empty-state-title">No Contracts Available</h3>
            <p className="empty-state-desc">Try clearing your search query or selecting a different filter.</p>
          </div>
        ) : (
          <>
            <div className="table-card">
              <table className="responsive-table">
                <thead>
                  <tr className="table-header-row">
                    <th className="table-header-cell">RECORD ID</th>
                    <th className="table-header-cell">TITLE</th>
                    <th className="table-header-cell">RECORD TYPE</th>
                    <th className="table-header-cell">COUNTERPARTY</th>
                    <th className="table-header-cell">COMMUNITY</th>
                    <th className="table-header-cell">EFFECTIVE</th>
                    <th className="table-header-cell">EXPIRATION</th>
                    <th className="table-header-cell">STATUS</th>
                    <th className="table-header-cell">DOCS</th>
                    <th className="table-header-cell" style={{ textAlign: 'right' }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedContracts.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => handleOpenDetail(c)}
                      className="table-row"
                    >
                      <td className="table-cell" style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--accent-primary)' }}>
                        {c.ironclad_id || c.id}
                      </td>
                      <td className="table-cell" style={{ fontWeight: 600, color: 'var(--text-primary)', maxWidth: '240px' }}>
                        <div className="truncate">{c.name || c.title}</div>
                      </td>
                      <td className="table-cell">
                        <span className="badge" style={{ textTransform: 'none' }}>
                          {c.type_display_name || c.record_type}
                        </span>
                      </td>
                      <td className="table-cell">
                        {c.counterparty_name || 'N/A'}
                      </td>
                      <td className="table-cell" style={{ color: 'var(--text-muted)' }}>
                        {c.community_name || 'N/A'}
                      </td>
                      <td className="table-cell">
                        {formatDate(c.effective_date || c.agreement_date)}
                      </td>
                      <td className="table-cell">
                        {formatDate(c.expiration_date || c.completion_date)}
                      </td>
                      <td className="table-cell">
                        <span className="badge">
                          {c.enhanced_status || c.status}
                        </span>
                      </td>
                      <td className="table-cell">
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                          <FileText size={13} style={{ color: 'var(--accent-primary)' }} />
                          <span>{c.attachment_count ?? (c.attachments?.length || 0)}</span>
                        </div>
                      </td>
                      <td className="table-cell" style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDetail(c);
                          }}
                          className="btn btn-secondary"
                          style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem' }}
                        >
                          <Eye size={13} />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalItems > 0 && (
              <div className="pagination-bar">
                <div className="pagination-info">
                  Showing <strong>{startIndex + 1}</strong> to <strong>{endIndex}</strong> of <strong>{totalItems}</strong> contracts (Page {validCurrentPage} of {totalPages})
                </div>

                <div className="pagination-actions">
                  <div className="pagination-page-size">
                    <span>Per page:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="select-page-size"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </div>

                  <div className="pagination-buttons">
                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                      disabled={validCurrentPage === 1}
                      className="pagination-nav-btn"
                      title="Previous Page"
                    >
                      <ChevronLeft size={16} />
                      <span>Prev</span>
                    </button>

                    <div className="pagination-pages">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => setCurrentPage(pageNum)}
                          className={`pagination-number-btn ${pageNum === validCurrentPage ? 'active' : ''}`}
                        >
                          {pageNum}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                      disabled={validCurrentPage === totalPages}
                      className="pagination-nav-btn"
                      title="Next Page"
                    >
                      <span>Next</span>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )
      ) : (
        /* LITE BI TOOL VIEW (Filtered Analytics) */
        <BiTool
          metrics={biMetrics}
          contracts={contracts}
          filterType={selectedType}
        />
      )}
    </div>
  );
};
