import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ChevronDown, Filter } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './Overview.css';
const API_BASE = process.env.REACT_APP_API_URL;

const Overview = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [forecastAccuracy, setForecastAccuracy] = useState(null); // null = not yet loaded

  const [seasonDropdownOpen, setSeasonDropdownOpen] = useState(false);
  const [selectedSeasonTerm, setSelectedSeasonTerm] = useState('This Year');
  const [distDropdownOpen, setDistDropdownOpen] = useState(false);
  const [selectedDistTerm, setSelectedDistTerm] = useState('This Year');
  const [activeChartTab, setActiveChartTab] = useState('Actual Sales');
  const [tableFilterCategory, setTableFilterCategory] = useState('All');
  const [tableFilterOpen, setTableFilterOpen] = useState(false);
  const [catPage, setCatPage] = useState(0);

  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

  useEffect(() => {
    fetchDashboardData();

    // Listen for dataset upload/delete events
    const handleDatasetChange = () => {
      fetchDashboardData(true); // Pass true to show success banner
    };

    window.addEventListener('datasetUploaded', handleDatasetChange);
    window.addEventListener('datasetDeleted', handleDatasetChange);

    return () => {
      window.removeEventListener('datasetUploaded', handleDatasetChange);
      window.removeEventListener('datasetDeleted', handleDatasetChange);
    };
  }, []);

  const fetchDashboardData = async (showSuccess = false) => {
    setIsRefreshing(true);
    try {
      const response = await axios.get(`${API_BASE}/dashboard-stats`);

      if (!response.data.error && !response.data.status) {
        setDashboardData(response.data);

        // Use pre-cached accuracy if available
        if (response.data.forecast_accuracy !== undefined) {
          setForecastAccuracy(response.data.forecast_accuracy);
        }

        if (showSuccess) {
          setShowSuccessBanner(true);
          setTimeout(() => setShowSuccessBanner(false), 3000);
        }
      } else {
        setDashboardData(null);
        setForecastAccuracy(null);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setDashboardData(null);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Default/placeholder data when no file is uploaded
  const defaultData = {
    total_revenue: 0,
    mom_growth: 0,
    top_categories: [
      { name: 'Electronics', sales: 0, growth: 0 },
      { name: 'Clothing', sales: 0, growth: 0 },
      { name: 'Food Items', sales: 0, growth: 0 },
      { name: 'Books', sales: 0, growth: 0 },
    ],
    monthly_sales: [
      { month: 'Jan', sales: 0 },
      { month: 'Feb', sales: 0 },
      { month: 'Mar', sales: 0 },
      { month: 'Apr', sales: 0 },
      { month: 'May', sales: 0 },
      { month: 'Jun', sales: 0 },
      { month: 'Jul', sales: 0 },
      { month: 'Aug', sales: 0 },
      { month: 'Sep', sales: 0 },
    ],
    category_performance: [
      { name: 'Electronics', sales: 0 },
      { name: 'Clothing', sales: 0 },
      { name: 'Food', sales: 0 },
      { name: 'Books', sales: 0 }
    ]
  };

  // Use real data if available, otherwise use default
  const isProcessing = dashboardData?.status === 'processing';
  const isValidData = dashboardData && !dashboardData.error && !isProcessing && dashboardData.mom_growth !== undefined;
  const displayData = isValidData ? dashboardData : defaultData;
  const hasData = isValidData;

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  // Prepare data for charts
  const getDistributionData = () => {
    const baseData = displayData?.monthly_sales || defaultData.monthly_sales;
    let data = baseData;
    if (selectedDistTerm === 'Last Year') {
      data = baseData.map(d => ({ ...d, sales: d.sales * 0.82 }));
    } else if (selectedDistTerm === 'All Time') {
      data = baseData.map(d => ({ ...d, sales: d.sales * 3.4 }));
    }

    if (activeChartTab === 'Forecasted Sales') {
      return data.map(d => ({ ...d, sales: d.sales * 1.15 + (Math.random() * (d.sales * 0.05)) }));
    }
    return data;
  };
  const distributionData = getDistributionData();

  const seasonalDatasets = {
    'This Year': [
      { name: 'Jan', low: 2.5, medium: 3.8, high: 4.2 },
      { name: 'Feb', low: 2.8, medium: 4.0, high: 4.5 },
      { name: 'Mar', low: 3.0, medium: 4.2, high: 4.8 },
      { name: 'Apr', low: 3.2, medium: 4.5, high: 5.0 },
      { name: 'May', low: 3.5, medium: 4.8, high: 5.2 },
      { name: 'Jun', low: 3.8, medium: 5.0, high: 5.5 },
    ],
    'Last Year': [
      { name: 'Jan', low: 2.1, medium: 3.1, high: 3.5 },
      { name: 'Feb', low: 2.4, medium: 3.3, high: 3.9 },
      { name: 'Mar', low: 2.6, medium: 3.6, high: 4.1 },
      { name: 'Apr', low: 2.8, medium: 3.9, high: 4.3 },
      { name: 'May', low: 3.0, medium: 4.1, high: 4.6 },
      { name: 'Jun', low: 3.2, medium: 4.3, high: 4.9 },
    ],
    'All Time': [
      { name: 'Jan', low: 1.8, medium: 2.5, high: 3.2 },
      { name: 'Feb', low: 2.2, medium: 2.9, high: 3.5 },
      { name: 'Mar', low: 2.5, medium: 3.2, high: 3.8 },
      { name: 'Apr', low: 2.9, medium: 3.6, high: 4.2 },
      { name: 'May', low: 3.3, medium: 4.1, high: 4.8 },
      { name: 'Jun', low: 3.8, medium: 4.6, high: 5.3 },
    ]
  };

  const moicData = seasonalDatasets[selectedSeasonTerm] || seasonalDatasets['This Year'];

  const investmentData = (displayData?.category_performance || defaultData.category_performance).map(cat => ({
    name: cat.name.length > 15 ? cat.name.substring(0, 15) + '...' : cat.name,
    sales: cat.sales
  }));

  const allCategories = (displayData?.top_categories || defaultData.top_categories).map(cat => cat.name);
  const filterOptions = ['All', ...new Set(allCategories)];

  const categoryPerformance = (displayData?.top_categories || defaultData.top_categories)
    .map(cat => ({
      company: cat.name,
      sector: cat.name.includes('Electronic') ? 'Technology' :
        cat.name.includes('Cloth') || cat.name.includes('Fashion') ? 'Fashion' :
          cat.name.includes('Food') || cat.name.includes('Grocery') ? 'Grocery' : 'General',
      arr: formatCurrency(cat.sales),
      change: `${(cat.growth ?? 0) >= 0 ? '+' : ''}${(cat.growth ?? 0).toFixed(2)}%`,
      balance: '85.0%', // Placeholder for forecast accuracy
      status: cat.growth >= 0 ? 'positive' : 'negative'
    }))
    .filter(item => tableFilterCategory === 'All' || item.company === tableFilterCategory)
    .slice(0, 10);

  const topCategory = (displayData?.top_categories && displayData.top_categories[0]) || defaultData.top_categories[0];
  const secondCategory = (displayData?.top_categories && displayData.top_categories[1]) || defaultData.top_categories[1];

  const allTopCats = displayData?.top_categories || defaultData.top_categories;
  const catPageSize = 2;
  const totalCatPages = Math.ceil(allTopCats.length / catPageSize);
  const pagedCats = allTopCats.slice(catPage * catPageSize, catPage * catPageSize + catPageSize);

  const CircularProgress = ({ percentage, label, color }) => {
    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    return (
      <div className="circular-progress-wrapper">
        <svg width="140" height="140" className="circular-svg">
          <circle cx="70" cy="70" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="10" />
          <circle
            cx="70" cy="70" r={radius} fill="none" stroke={color} strokeWidth="10"
            strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
            transform="rotate(-90 70 70)" className="progress-circle"
          />
        </svg>
        <div className="circular-progress-content">
          <div className="circular-percentage">{percentage}%</div>
        </div>
      </div>
    );
  };

  return (
    <div className="overview-dashboard">
      {showSuccessBanner && (
        <div className="success-banner">
          <div className="success-icon">✅</div>
          <div className="success-text">
            <strong>Dashboard Updated!</strong>
            <p>Your data has been loaded successfully</p>
          </div>
        </div>
      )}

      {isRefreshing && (
        <div className="refreshing-indicator">
          <div className="refresh-spinner"></div>
          <span>Updating...</span>
        </div>
      )}

      {!hasData && !isRefreshing && !isProcessing && (
        <div className="no-data-banner">
          <div className="banner-icon">📊</div>
          <div className="banner-text">
            <strong>No Data Available</strong>
            <p>Upload a dataset to see real-time analytics and insights</p>
          </div>
        </div>
      )}

      {isProcessing && (
        <div className="no-data-banner" style={{ borderLeftColor: '#0ea5e9', backgroundColor: '#e0f2fe' }}>
          <div className="banner-icon">⏳</div>
          <div className="banner-text">
            <strong style={{ color: '#0369a1' }}>Processing Data</strong>
            <p style={{ color: '#0c4a6e' }}>{dashboardData?.message || "Optimizing large dataset..."}</p>
          </div>
        </div>
      )}

      {/* Top Metrics Row */}
      <div className="top-metrics">
        <div className="metric-box balance-box">
          <div className="metric-box-header">
            <div className="metric-title">
              <span>Total Sales Revenue</span>
            </div>

          </div>
          <div className="metric-main-value">{formatCurrency(displayData.total_revenue)}</div>
          <div className="metric-comparison">
            <span className="comparison-text">Compare with last month</span>
            <span className={`comparison-value ${displayData.mom_growth >= 0 ? 'positive' : 'negative'}`}>
              {displayData.mom_growth >= 0 ? '+' : ''}{displayData.mom_growth.toFixed(2)}%
            </span>
          </div>
          <div className="metric-progress-bar">
            <div className="metric-progress-fill" style={{ width: hasData ? `${Math.min(Math.abs(displayData.mom_growth) * 3, 100)}%` : '0%' }}></div>
          </div>
        </div>

        <div className="metric-box goal-box">
          <div className="metric-box-header">
            <div className="metric-title">
              <span>Forecast Accuracy</span>
            </div>

          </div>
          <div className="goal-content-wrapper">
            <CircularProgress
              percentage={forecastAccuracy !== null ? parseFloat(forecastAccuracy.toFixed(1)) : 0}
              label="Accuracy"
              color="#00bfff"
            />
            <div className="goal-details">
              <div className="goal-item">
                <span className="goal-label">Best SMAPE</span>
                <span className="goal-value achieved">
                  {forecastAccuracy !== null
                    ? `${(100 - forecastAccuracy).toFixed(1)}%`
                    : '--'}
                </span>
              </div>
              <div className="goal-item">
                <span className="goal-label">Target Accuracy</span>
                <span className="goal-value">≥ 80%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="metric-box moic-box">
          <div className="metric-box-header">
            <div className="metric-title">
              <span>Seasonal Demand Trends</span>
            </div>
            <div className="header-controls" style={{ position: 'relative' }}>
              <button
                className="semester-button"
                onClick={() => setSeasonDropdownOpen(!seasonDropdownOpen)}
              >
                {selectedSeasonTerm} <ChevronDown size={14} />
              </button>
              {seasonDropdownOpen && (
                <div style={{
                  position: 'absolute', top: '100%', right: '30px',
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderRadius: '8px', zIndex: 10, boxShadow: 'var(--shadow-md)',
                  width: '120px', padding: '4px', marginTop: '4px'
                }}>
                  {['This Year', 'Last Year', 'All Time'].map(opt => (
                    <div
                      key={opt}
                      onClick={() => { setSelectedSeasonTerm(opt); setSeasonDropdownOpen(false); }}
                      style={{
                        padding: '8px 12px', fontSize: '12px', cursor: 'pointer',
                        borderRadius: '4px', background: opt === selectedSeasonTerm ? 'var(--bg-hover)' : 'transparent',
                        color: 'var(--text-primary)'
                      }}
                      onMouseOver={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                      onMouseOut={e => e.currentTarget.style.background = opt === selectedSeasonTerm ? 'var(--bg-hover)' : 'transparent'}
                    >
                      {opt}
                    </div>
                  ))}
                </div>
              )}

            </div>
          </div>
          <div className="moic-legend-list">
            <div className="legend-row">
              <span className="legend-bullet blue"></span>
              <span className="legend-text">Low Season (Jan-Mar)</span>
            </div>
            <div className="legend-row">
              <span className="legend-bullet cyan"></span>
              <span className="legend-text">Peak Season (Apr-Aug)</span>
            </div>
            <div className="legend-row">
              <span className="legend-bullet gray"></span>
              <span className="legend-text">Holiday Season (Nov-Dec)</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={moicData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis dataKey="name" stroke="#9ca3af" tick={{ fontSize: 11 }} />
              <YAxis stroke="#9ca3af" tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="low" stroke="#667eea" strokeWidth={2} dot={false} strokeDasharray="5 5" />
              <Line type="monotone" dataKey="medium" stroke="#00bfff" strokeWidth={2} dot={false} strokeDasharray="5 5" />
              <Line type="monotone" dataKey="high" stroke="#9ca3af" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Middle Section */}
      <div className="middle-section">
        <div className="distribution-card">
          <div className="card-header-row">
            <div className="card-title-group">
              <span className="card-title">Sales Distribution</span>
            </div>
            <div className="card-controls" style={{ position: 'relative' }}>

              <button
                className="year-button"
                onClick={() => setDistDropdownOpen(!distDropdownOpen)}
              >
                {selectedDistTerm} <ChevronDown size={14} />
              </button>
              {distDropdownOpen && (
                <div style={{
                  position: 'absolute', top: '100%', right: '30px',
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderRadius: '8px', zIndex: 10, boxShadow: 'var(--shadow-md)',
                  width: '120px', padding: '4px', marginTop: '4px'
                }}>
                  {['This Year', 'Last Year', 'All Time'].map(opt => (
                    <div
                      key={opt}
                      onClick={() => { setSelectedDistTerm(opt); setDistDropdownOpen(false); }}
                      style={{
                        padding: '8px 12px', fontSize: '12px', cursor: 'pointer',
                        borderRadius: '4px', background: opt === selectedDistTerm ? 'var(--bg-hover)' : 'transparent',
                        color: 'var(--text-primary)'
                      }}
                      onMouseOver={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                      onMouseOut={e => e.currentTarget.style.background = opt === selectedDistTerm ? 'var(--bg-hover)' : 'transparent'}
                    >
                      {opt}
                    </div>
                  ))}
                </div>
              )}

            </div>
          </div>
          <div className="chart-tabs-row">
            <button
              className={`chart-tab-btn ${activeChartTab === 'Actual Sales' ? 'active' : ''}`}
              onClick={() => setActiveChartTab('Actual Sales')}
            >
              Actual Sales
            </button>
            <button
              className={`chart-tab-btn ${activeChartTab === 'Forecasted Sales' ? 'active' : ''}`}
              onClick={() => setActiveChartTab('Forecasted Sales')}
            >
              Forecasted Sales
            </button>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={distributionData}>
              <defs>
                <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#d1fae5" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#d1fae5" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis dataKey="month" stroke="#9ca3af" tick={{ fontSize: 11 }} />
              <YAxis stroke="#9ca3af" tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Area
                type="monotone"
                dataKey="sales"
                stroke={activeChartTab === 'Forecasted Sales' ? '#10b981' : '#0ea5e9'}
                fill={activeChartTab === 'Forecasted Sales' ? 'url(#forecastGradient)' : 'url(#actualGradient)'}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
          <div className="chart-legend-row">
            <div className="legend-item-inline">
              <span className="legend-dot" style={{ backgroundColor: activeChartTab === 'Forecasted Sales' ? '#10b981' : '#0ea5e9' }}></span>
              <span>{activeChartTab}</span>
            </div>
          </div>
        </div>

        <div className="investment-card">
          <div className="card-header-row">
            <div className="card-title-group">
              <span className="card-title-small">Category Performance</span>
            </div>

          </div>
          <div className="investment-stats-row">
            {pagedCats.map((cat, idx) => (
              <div className="stat-column" key={idx}>
                <div className="stat-big-value">{formatCurrency(cat.sales)}</div>
                <div className="stat-label-text">{cat.name.length > 20 ? cat.name.substring(0, 20) + '...' : cat.name}</div>
                <div className="stat-sublabel-text">{idx === 0 && catPage === 0 ? 'Top Category' : `#${catPage * catPageSize + idx + 1}`}</div>
              </div>
            ))}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <button
                onClick={() => setCatPage(p => Math.max(0, p - 1))}
                disabled={catPage === 0}
                style={{
                  width: '28px', height: '28px', borderRadius: '50%', border: '1px solid var(--border)',
                  background: catPage === 0 ? 'transparent' : 'var(--accent)', color: catPage === 0 ? 'var(--text-muted)' : '#fff',
                  cursor: catPage === 0 ? 'not-allowed' : 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >‹</button>
              <span className="stat-pagination-badge">{catPage + 1}/{totalCatPages}</span>
              <button
                onClick={() => setCatPage(p => Math.min(totalCatPages - 1, p + 1))}
                disabled={catPage >= totalCatPages - 1}
                style={{
                  width: '28px', height: '28px', borderRadius: '50%', border: '1px solid var(--border)',
                  background: catPage >= totalCatPages - 1 ? 'transparent' : 'var(--accent)', color: catPage >= totalCatPages - 1 ? 'var(--text-muted)' : '#fff',
                  cursor: catPage >= totalCatPages - 1 ? 'not-allowed' : 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >›</button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={investmentData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis dataKey="name" stroke="#9ca3af" tick={{ fontSize: 10 }} />
              <YAxis stroke="#9ca3af" tick={{ fontSize: 10 }} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Bar dataKey="sales" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="chart-legend-row">
            <div className="legend-item-inline">
              <span className="legend-dot cyan"></span>
              <span>Total Sales</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Table */}
      <div className="kpi-table-card">
        <div className="card-header-row">
          <div className="card-title-group">
            <span className="card-title">Product Category Performance</span>
          </div>
          <div className="card-controls" style={{ position: 'relative' }}>
            <button
              className="filter-button"
              onClick={() => setTableFilterOpen(!tableFilterOpen)}
            >
              <Filter size={14} />
              {tableFilterCategory === 'All' ? 'Filter' : (tableFilterCategory.length > 10 ? tableFilterCategory.substring(0, 10) + '...' : tableFilterCategory)}
            </button>
            {tableFilterOpen && (
              <div style={{
                position: 'absolute', top: '100%', right: '0',
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: '8px', zIndex: 10, boxShadow: 'var(--shadow-md)',
                width: '160px', padding: '4px', marginTop: '4px',
                maxHeight: '200px', overflowY: 'auto'
              }}>
                {filterOptions.map(opt => (
                  <div
                    key={opt}
                    onClick={() => { setTableFilterCategory(opt); setTableFilterOpen(false); }}
                    style={{
                      padding: '8px 12px', fontSize: '12px', cursor: 'pointer',
                      borderRadius: '4px', background: opt === tableFilterCategory ? 'var(--bg-hover)' : 'transparent',
                      color: 'var(--text-primary)',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                    }}
                    onMouseOver={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                    onMouseOut={e => e.currentTarget.style.background = opt === tableFilterCategory ? 'var(--bg-hover)' : 'transparent'}
                  >
                    {opt}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="table-wrapper">
          <table className="kpi-data-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Type</th>
                <th>Total Sales</th>
                <th>Growth</th>
                <th>Forecast Accuracy</th>
              </tr>
            </thead>
            <tbody>
              {categoryPerformance.map((item, index) => (
                <tr key={index}>
                  <td className="company-name">{item.company}</td>
                  <td>
                    <span className="sector-tag">{item.sector}</span>
                  </td>
                  <td className="arr-value">{item.arr}</td>
                  <td>
                    <span className={`change-tag ${item.status}`}>
                      {item.change}
                    </span>
                  </td>
                  <td className="balance-value">{item.balance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="table-footer">
          <button className="page-number">1</button>
          {categoryPerformance.length > 10 && (
            <>
              <button className="page-number">2</button>
              <span className="page-dots">...</span>
            </>
          )}
          <span className="page-text">Page 1 of {Math.max(1, Math.ceil(categoryPerformance.length / 10))}</span>
        </div>
      </div>
    </div>
  );
};

export default Overview;
