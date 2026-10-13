import React, { useState } from 'react';
import { BiMetrics } from '../types';
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
import { DollarSign, FileCheck, Clock, TrendingUp, Filter } from 'lucide-react';

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
  isLoading: boolean;
}

export const BiTool: React.FC<BiToolProps> = ({ metrics, isLoading }) => {
  const [filterThreshold, setFilterThreshold] = useState<number>(0);

  if (isLoading || !metrics) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
        Loading business intelligence visualizations and KPI metrics...
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

  // Status distribution doughnut data
  const statusLabels = Object.keys(metrics.status_distribution).map((k) => k.replace(/_/g, ' ').toUpperCase());
  const statusValues = Object.values(metrics.status_distribution);

  const doughnutData = {
    labels: statusLabels,
    datasets: [
      {
        data: statusValues,
        backgroundColor: ['#9ca3af', '#f59e0b', '#06b6d4', '#10b981', '#ef4444'],
        borderColor: 'var(--bg-card)',
        borderWidth: 2,
      },
    ],
  };

  // Counterparty exposure bar chart
  const filteredCounterparties = metrics.counterparty_exposure.filter((cp) => cp.value >= filterThreshold);
  const barData = {
    labels: filteredCounterparties.map((cp) => cp.counterparty),
    datasets: [
      {
        label: 'Contract Value (USD)',
        data: filteredCounterparties.map((cp) => cp.value),
        backgroundColor: '#0284c7',
        borderRadius: 6,
      },
    ],
  };

  // Monthly contracting trends line chart
  const lineData = {
    labels: metrics.monthly_trends.map((t) => t.month),
    datasets: [
      {
        label: 'Portfolio Volume ($)',
        data: metrics.monthly_trends.map((t) => t.volume),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.35,
      },
    ],
  };

  // Department Distribution bar
  const deptData = {
    labels: Object.keys(metrics.department_distribution),
    datasets: [
      {
        label: 'Active Contracts',
        data: Object.values(metrics.department_distribution),
        backgroundColor: '#8b5cf6',
        borderRadius: 6,
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
      {/* KPI TILES GRID */}
      <div className="grid-kpi">
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)' }}>
            <DollarSign size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Total Portfolio Value</div>
            <div style={{ fontSize: '1.45rem', fontWeight: 700 }}>{formatM(metrics.total_portfolio_value)}</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
            <FileCheck size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Executed Contracts</div>
            <div style={{ fontSize: '1.45rem', fontWeight: 700 }}>{metrics.signed_contracts_count}</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
            <Clock size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Pending Legal Review</div>
            <div style={{ fontSize: '1.45rem', fontWeight: 700 }}>{metrics.pending_review_count}</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(6, 182, 212, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#06b6d4' }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Avg Turnaround Time</div>
            <div style={{ fontSize: '1.45rem', fontWeight: 700 }}>{metrics.avg_turnaround_days} Days</div>
          </div>
        </div>
      </div>

      {/* FILTER BAR FOR BI CHARTS */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>
          <Filter size={16} color="var(--accent-primary)" />
          <span>Lite BI Real-Time Analytics Controls</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Min Contract Value Filter:</span>
          <select
            className="select"
            style={{ width: '180px', padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
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

      {/* CHARTS GRID */}
      <div className="grid-charts">
        {/* Status Distribution Donut */}
        <div className="card" style={{ height: '340px', display: 'flex', flexDirection: 'column' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.75rem' }}>Contract Lifecycle Distribution</h4>
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
          <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.75rem' }}>Pipeline Velocity & Volume</h4>
          <div style={{ flex: 1, position: 'relative' }}>
            <Line data={lineData} options={chartOptions} />
          </div>
        </div>

        {/* Department Allocation */}
        <div className="card" style={{ height: '340px', display: 'flex', flexDirection: 'column' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.75rem' }}>Department Contract Allocation</h4>
          <div style={{ flex: 1, position: 'relative' }}>
            <Bar data={deptData} options={chartOptions} />
          </div>
        </div>
      </div>
    </div>
  );
};
