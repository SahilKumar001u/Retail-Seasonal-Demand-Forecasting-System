import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend
} from 'recharts';
import './Analytics.css';
const API_BASE = process.env.REACT_APP_API_URL;


const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#0ea5e9', '#f97316'];

const formatCurrency = (v) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);

const CustomBarTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="an-tooltip">
      <p className="an-tooltip-label">{label}</p>
      <p style={{ color: '#6366f1' }}><strong>{formatCurrency(payload[0].value)}</strong></p>
    </div>
  );
};

const CustomPieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="an-tooltip">
      <p className="an-tooltip-label">{payload[0].name}</p>
      <p><strong>{formatCurrency(payload[0].value)}</strong></p>
      <p style={{ fontSize: '12px', color: '#9ca3af' }}>
        {payload[0].payload.percent !== undefined ? `${(payload[0].payload.percent * 100).toFixed(1)}%` : ''}
      </p>
    </div>
  );
};

const Analytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API_BASE}/analytics`);
      if (res.data.error) {
        setError(res.data.error);
        setData(null);
      } else {
        setData(res.data);
      }
    } catch (e) {
      setError('Could not connect to backend. Make sure the server is running.');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    window.addEventListener('datasetUploaded', fetchAnalytics);
    window.addEventListener('datasetDeleted', () => { setData(null); setError(null); });
    return () => {
      window.removeEventListener('datasetUploaded', fetchAnalytics);
    };
  }, []);

  if (loading) {
    return (
      <div className="analytics">
        <div className="an-header">
          <h1>Analytics</h1>
          <p>Detailed insights and performance metrics</p>
        </div>
        <div className="an-skeleton-grid">
          {[1, 2, 3, 4].map(i => <div key={i} className="an-skeleton-card" />)}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="analytics">
        <div className="an-header">
          <h1>Analytics</h1>
          <p>Detailed insights and performance metrics</p>
        </div>
        <div className="an-empty">
          <div className="an-empty-icon">📊</div>
          <h3>No Data Available</h3>
          <p>{error || 'Upload a retail dataset to see analytics.'}</p>
        </div>
      </div>
    );
  }

  const { top_categories_bar, monthly_trend, category_pie, mom_growth_trend, summary } = data;

  return (
    <div className="analytics">
      <div className="an-header">
        <h1>Analytics</h1>
        <p>Detailed insights and performance metrics from your dataset</p>
      </div>

      {/* Summary KPI Cards */}
      <div className="an-kpi-grid">
        <div className="an-kpi-card">
          <div className="an-kpi-icon">💰</div>
          <div className="an-kpi-label">Total Revenue</div>
          <div className="an-kpi-value">{formatCurrency(summary.total_sales)}</div>
        </div>
        <div className="an-kpi-card">
          <div className="an-kpi-icon">📦</div>
          <div className="an-kpi-label">Total Transactions</div>
          <div className="an-kpi-value">{summary.total_orders.toLocaleString()}</div>
        </div>
        <div className="an-kpi-card">
          <div className="an-kpi-icon">🛒</div>
          <div className="an-kpi-label">Avg. Order Value</div>
          <div className="an-kpi-value">{formatCurrency(summary.avg_order_val)}</div>
        </div>
        <div className="an-kpi-card">
          <div className="an-kpi-icon">🏷️</div>
          <div className="an-kpi-label">Unique Products</div>
          <div className="an-kpi-value">{summary.unique_cats.toLocaleString()}</div>
        </div>
      </div>

      {/* Charts Row 1: Top categories bar + Pie */}
      <div className="an-charts-row">
        <div className="an-chart-card wide">
          <div className="an-chart-header">
            <h3>Top 10 Products by Revenue</h3>
            <p>Ranked by total sales across all periods</p>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={top_categories_bar} layout="vertical" margin={{ left: 10, right: 30, top: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" stroke="#9ca3af" tick={{ fontSize: 11 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="name" stroke="#9ca3af" tick={{ fontSize: 10 }} width={130} />
              <Tooltip content={<CustomBarTooltip />} />
              <Bar dataKey="sales" radius={[0, 6, 6, 0]}>
                {top_categories_bar.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="an-chart-card">
          <div className="an-chart-header">
            <h3>Revenue Distribution</h3>
            <p>Top 6 products vs. rest</p>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={category_pie}
                cx="50%"
                cy="50%"
                outerRadius={110}
                innerRadius={55}
                dataKey="value"
                labelLine={false}
              >
                {category_pie.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomPieTooltip />} />
              <Legend
                iconType="circle"
                iconSize={10}
                formatter={(value) => <span style={{ fontSize: '11px', color: '#6b7280' }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2: Monthly Sales Trend + MoM Growth */}
      <div className="an-charts-row">
        <div className="an-chart-card wide">
          <div className="an-chart-header">
            <h3>Monthly Sales Trend</h3>
            <p>Total revenue aggregated by month</p>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={monthly_trend} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#9ca3af" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis stroke="#9ca3af" tick={{ fontSize: 11 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={v => formatCurrency(v)} labelStyle={{ fontWeight: 600 }} />
              <Area type="monotone" dataKey="sales" stroke="#6366f1" strokeWidth={2.5} fill="url(#salesGrad)" name="Sales" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="an-chart-card">
          <div className="an-chart-header">
            <h3>Month-over-Month Growth</h3>
            <p>Percentage change in sales vs. prior month</p>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={mom_growth_trend.slice(-12)} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#9ca3af" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis stroke="#9ca3af" tick={{ fontSize: 11 }} tickFormatter={v => `${v.toFixed(0)}%`} />
              <Tooltip formatter={v => `${v.toFixed(2)}%`} labelStyle={{ fontWeight: 600 }} />
              <Bar dataKey="growth" radius={[4, 4, 0, 0]} name="MoM Growth %">
                {mom_growth_trend.slice(-12).map((entry, i) => (
                  <Cell key={i} fill={entry.growth >= 0 ? '#10b981' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
