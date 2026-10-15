import React, { useState } from 'react';
import { BiMetrics, Contract } from '../types';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler,
} from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import { DollarSign, FileCheck, Clock, TrendingUp, Filter, AlertCircle } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
);

interface BiToolProps {
  metrics: BiMetrics | null;
  contracts?: Contract[];
  filterType?: string;
  isLoading?: boolean;
}

export const BiTool: React.FC<BiToolProps> = ({
  metrics,
  contracts,
  filterType = 'All Types',
  isLoading = false,
}) => {
  const [filterThreshold, setFilterThreshold] = useState<number>(0);

  if (isLoading || (!metrics && !contracts)) {
    return (
      <div className="empty-state">
        <div className="spinner" style={{ margin: '0 auto 1.25rem' }} />
        <h3 className="empty-state-title">Calculating Analytics</h3>
        <p className="empty-state-desc">Aggregating portfolio metrics and contract distributions...</p>
      </div>
    );
  }

  // Format currency
  const formatM = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Derive dynamic metrics from filtered contracts array if available
  const hasContracts = contracts !== undefined;
  const activeContracts = contracts || [];

  if (hasContracts && activeContracts.length === 0) {
    return (
      <div className="empty-state">
        <AlertCircle size={40} className="empty-state-icon" />
        <h3 className="empty-state-title">No Contracts in Current Filter</h3>
        <p className="empty-state-desc">
          No metrics or charts to display for "{filterType}". Try selecting "All Types" or clearing your search query.
        </p>
      </div>
    );
  }

  // 1. Total Portfolio Value
  const totalValue = hasContracts
    ? activeContracts.reduce((acc, c) => {
        const val = c.contract_value ?? (c.properties?.contract_value as number) ?? 0;
        return acc + (typeof val === 'number' ? val : 0);
      }, 0)
    : (metrics?.total_portfolio_value ?? 0);

  // 2. Executed / Active Contracts
  const executedCount = hasContracts
    ? activeContracts.filter((c) => {
        const st = (c.enhanced_status || c.status || '').toLowerCase();
        return st.includes('active') || st.includes('signed') || st.includes('completed') || st.includes('renew');
      }).length
    : (metrics?.signed_contracts_count ?? 0);

  // 3. Pending Review Contracts
  const pendingCount = hasContracts
    ? activeContracts.filter((c) => {
        const st = (c.enhanced_status || c.status || '').toLowerCase();
        return st.includes('review') || st.includes('draft') || st.includes('pending') || st.includes('indeterminate');
      }).length
    : (metrics?.pending_review_count ?? 0);

  // 4. Status Distribution
  const statusDist: Record<string, number> = {};
  if (hasContracts) {
    activeContracts.forEach((c) => {
      const st = c.enhanced_status || c.status || 'Active';
      statusDist[st] = (statusDist[st] || 0) + 1;
    });
  } else if (metrics?.status_distribution) {
    Object.assign(statusDist, metrics.status_distribution);
  }

  // Status Doughnut Data
  const statusLabels = Object.keys(statusDist).map((k) => k.replace(/_/g, ' ').toUpperCase());
  const statusValues = Object.values(statusDist);
  const doughnutColors = ['#0284c7', '#10b981', '#f59e0b', '#06b6d4', '#ef4444', '#8b5cf6', '#9ca3af'];

  const doughnutData = {
    labels: statusLabels,
    datasets: [
      {
        data: statusValues,
        backgroundColor: doughnutColors.slice(0, statusLabels.length),
        borderColor: 'var(--bg-card)',
        borderWidth: 2,
      },
    ],
  };

  // 5. Counterparty Exposure Bar Chart
  let counterpartyExposure: Array<{ counterparty: string; value: number }> = [];
  if (hasContracts) {
    const cpMap: Record<string, number> = {};
    activeContracts.forEach((c) => {
      const name = c.counterparty_name || 'Unassigned Counterparty';
      const val = c.contract_value ?? (c.properties?.contract_value as number) ?? 50000;
      cpMap[name] = (cpMap[name] || 0) + (typeof val === 'number' ? val : 0);
    });
    counterpartyExposure = Object.entries(cpMap)
      .map(([counterparty, value]) => ({ counterparty, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  } else if (metrics?.counterparty_exposure) {
    counterpartyExposure = metrics.counterparty_exposure;
  }

  const filteredCounterparties = counterpartyExposure.filter((cp) => cp.value >= filterThreshold);
  const barData = {
    labels: filteredCounterparties.map((cp) => cp.counterparty),
    datasets: [
      {
        label: 'Contract Value (USD)',
        data: filteredCounterparties.map((cp) => cp.value),
        backgroundColor: 'var(--accent-primary)',
        borderRadius: 6,
      },
    ],
  };

  // 6. Contract Categories / Type Distribution
  const typeDist: Record<string, number> = {};
  if (hasContracts) {
    activeContracts.forEach((c) => {
      const t = c.type_display_name || c.record_type || 'General Service';
      typeDist[t] = (typeDist[t] || 0) + 1;
    });
  } else if (metrics?.department_distribution) {
    Object.assign(typeDist, metrics.department_distribution);
  }

  const deptData = {
    labels: Object.keys(typeDist),
    datasets: [
      {
        label: 'Agreements',
        data: Object.values(typeDist),
        backgroundColor: '#8b5cf6',
        borderRadius: 6,
      },
    ],
  };

  // 7. Monthly Trends
  const monthlyTrends = metrics?.monthly_trends || [
    { month: 'Jan', volume: totalValue * 0.15, count: 2 },
    { month: 'Feb', volume: totalValue * 0.25, count: 3 },
    { month: 'Mar', volume: totalValue * 0.2, count: 2 },
    { month: 'Apr', volume: totalValue * 0.4, count: 5 },
  ];

  const lineData = {
    labels: monthlyTrends.map((t) => t.month),
    datasets: [
      {
        label: 'Portfolio Volume ($)',
        data: monthlyTrends.map((t) => t.volume),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.35,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: 'var(--text-primary)',
          font: { family: 'Inter', size: 12 },
        },
      },
    },
    scales: {
      x: {
        ticks: { color: 'var(--text-secondary)' },
        grid: { color: 'var(--border-color)' },
      },
      y: {
        ticks: { color: 'var(--text-secondary)' },
        grid: { color: 'var(--border-color)' },
      },
    },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* FILTER SCOPE HEADER */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <Filter size={16} style={{ color: 'var(--accent-primary)' }} />
          <div>
            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Active Analytics Scope:
            </span>
            <span style={{ marginLeft: '0.4rem', fontSize: '0.825rem', color: 'var(--accent-primary)', fontWeight: 600 }}>
              {filterType}
            </span>
          </div>
          <span className="count-badge">
            {hasContracts ? activeContracts.length : (metrics?.total_contracts_count ?? 0)} In Scope
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Min Value:</span>
          <select
            className="select"
            style={{ width: '160px', padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
            value={filterThreshold}
            onChange={(e) => setFilterThreshold(Number(e.target.value))}
          >
            <option value="0">All Values ($0+)</option>
            <option value="50000">$50,000+</option>
            <option value="150000">$150,000+</option>
            <option value="300000">$300,000+</option>
          </select>
        </div>
      </div>

      {/* KPI TILES GRID */}
      <div className="grid-kpi">
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)' }}>
            <DollarSign size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Portfolio Value</div>
            <div style={{ fontSize: '1.45rem', fontWeight: 700 }}>{formatM(totalValue)}</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
            <FileCheck size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Executed / Active</div>
            <div style={{ fontSize: '1.45rem', fontWeight: 700 }}>{executedCount}</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
            <Clock size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>In Review / Pending</div>
            <div style={{ fontSize: '1.45rem', fontWeight: 700 }}>{pendingCount}</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(6, 182, 212, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#06b6d4' }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Total In Filter</div>
            <div style={{ fontSize: '1.45rem', fontWeight: 700 }}>
              {hasContracts ? activeContracts.length : (metrics?.total_contracts_count ?? 0)}
            </div>
          </div>
        </div>
      </div>

      {/* CHARTS GRID */}
      <div className="grid-charts">
        {/* Status Distribution Donut */}
        <div className="card" style={{ height: '340px', display: 'flex', flexDirection: 'column' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.75rem' }}>Lifecycle & Status Distribution</h4>
          <div style={{ flex: 1, position: 'relative' }}>
            <Doughnut data={doughnutData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>

        {/* Counterparty Exposure Bar */}
        <div className="card" style={{ height: '340px', display: 'flex', flexDirection: 'column' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.75rem' }}>Top Counterparty Exposure</h4>
          <div style={{ flex: 1, position: 'relative' }}>
            <Bar data={barData} options={chartOptions} />
          </div>
        </div>

        {/* Monthly Trendline */}
        <div className="card" style={{ height: '340px', display: 'flex', flexDirection: 'column' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.75rem' }}>Pipeline Volume Distribution</h4>
          <div style={{ flex: 1, position: 'relative' }}>
            <Line data={lineData} options={chartOptions} />
          </div>
        </div>

        {/* Contract Type Allocation */}
        <div className="card" style={{ height: '340px', display: 'flex', flexDirection: 'column' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.75rem' }}>Category Agreement Allocation</h4>
          <div style={{ flex: 1, position: 'relative' }}>
            <Bar data={deptData} options={chartOptions} />
          </div>
        </div>
      </div>
    </div>
  );
};
