import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { TrendingUp, RefreshCw, Upload, ChevronDown } from 'lucide-react';
import {
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import './Forecast.css';

const API_BASE = process.env.REACT_APP_API_URL;
const HORIZONS = [4, 8, 12];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  
  // Find the data point to get CI values
  const dataPoint = payload[0]?.payload;
  
  return (
    <div className="fc-tooltip">
      <p className="fc-tooltip-label">{label}</p>
      {payload.map((p, i) => {
        // Skip CI bound lines from main display
        if (p.name?.includes('Lower') || p.name?.includes('Upper')) return null;
        // Skip if value is NaN or invalid
        if (isNaN(p.value) || p.value === null || p.value === undefined) return null;
        return (
          <p key={i} style={{ color: p.color }}>
            {p.name}: <strong>${Number(p.value).toLocaleString()}</strong>
          </p>
        );
      })}
      
      {/* Show CI values if available and valid */}
      {dataPoint?.arima_lower !== null && dataPoint?.arima_upper !== null && 
       !isNaN(dataPoint?.arima_lower) && !isNaN(dataPoint?.arima_upper) && (
        <div style={{ marginTop: '8px', fontSize: '12px', color: '#f97316' }}>
          <p>ARIMA CI:</p>
          <p style={{ marginLeft: '8px' }}>
            Lower: <strong>${Number(dataPoint.arima_lower).toLocaleString()}</strong>
          </p>
          <p style={{ marginLeft: '8px' }}>
            Upper: <strong>${Number(dataPoint.arima_upper).toLocaleString()}</strong>
          </p>
        </div>
      )}
      
      {dataPoint?.sarima_lower !== null && dataPoint?.sarima_upper !== null && 
       !isNaN(dataPoint?.sarima_lower) && !isNaN(dataPoint?.sarima_upper) && (
        <div style={{ marginTop: '8px', fontSize: '12px', color: '#10b981' }}>
          <p>SARIMA CI:</p>
          <p style={{ marginLeft: '8px' }}>
            Lower: <strong>${Number(dataPoint.sarima_lower).toLocaleString()}</strong>
          </p>
          <p style={{ marginLeft: '8px' }}>
            Upper: <strong>${Number(dataPoint.sarima_upper).toLocaleString()}</strong>
          </p>
        </div>
      )}
    </div>
  );
};

const Forecast = () => {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [horizon, setHorizon] = useState(12);
  const [forecastData, setForecastData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasDataset, setHasDataset] = useState(false);
  const [catSearch, setCatSearch] = useState('');
  const [catOpen, setCatOpen] = useState(false);
  const abortRef = React.useRef(null); // cancel in-flight requests
  const navigate = useNavigate();

  const fetchCategories = useCallback(async (retry = 0) => {
    try {
      const res = await axios.get(`${API_BASE}/categories`);
      const cats = res.data.categories || [];
      if (cats.length > 0) {
        setCategories(cats);
        setHasDataset(true);
        return cats[0];
      }
      // Empty — backend may still be processing; retry up to 10x
      if (retry < 10) {
        return new Promise(resolve =>
          setTimeout(() => resolve(fetchCategories(retry + 1)), 2000)
        );
      }
      setHasDataset(false);
      return null;
    } catch {
      if (retry < 10) {
        return new Promise(resolve =>
          setTimeout(() => resolve(fetchCategories(retry + 1)), 2000)
        );
      }
      setHasDataset(false);
      return null;
    }
  }, []);

  const runForecast = useCallback(async (cat, steps) => {
    if (!cat) return;

    // Cancel any in-flight request
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/forecast`, {
        params: { category: cat, steps },
        signal: abortRef.current.signal,
        timeout: 120000
      });
      if (res.data?.status === 'processing') {
        setTimeout(() => runForecast(cat, steps), 3000);
        return;
      }
      if (res.data && !res.data.error && res.data.metrics) {
        setForecastData(res.data);
      }
    } catch (err) {
      if (axios.isCancel(err)) return; // cancelled — don't update state
      console.error('Forecast error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const first = await fetchCategories();
      if (first) {
        setSelectedCategory(first);
        runForecast(first, horizon);
      }
    };
    init();

    const onUpload = async () => {
      const first = await fetchCategories();
      if (first) { setSelectedCategory(first); runForecast(first, horizon); }
    };
    const onDelete = () => {
      setForecastData(null); setHasDataset(false);
      setCategories([]); setSelectedCategory('');
    };

    window.addEventListener('datasetUploaded', onUpload);
    window.addEventListener('datasetDeleted', onDelete);
    return () => {
      window.removeEventListener('datasetUploaded', onUpload);
      window.removeEventListener('datasetDeleted', onDelete);
    };
  }, []);

  const handleHorizon = (h) => {
    setHorizon(h);
    runForecast(selectedCategory, h);
  };

  const handleCategory = (cat) => {
    setSelectedCategory(cat);
    setCatOpen(false);
    setCatSearch('');
    runForecast(cat, horizon);
  };

  // Build combined chart data: historical + forecast (with CI bands)
  const chartData = React.useMemo(() => {
    if (!forecastData) return [];
    const hist = (forecastData.historical || []).map(h => ({
      period: h.period,
      actual: h.actual,
      arima: null,
      sarima: null,
      arima_ci: null,
      sarima_ci: null,
      arima_lower: null,
      arima_upper: null,
      sarima_lower: null,
      sarima_upper: null,
      type: 'historical'
    }));
    const fc = (forecastData.forecast || []).map(f => ({
      period: f.period,
      actual: null,
      arima: f.arima,
      sarima: f.sarima,
      // CI stored as [lower, upper] tuple for Area chart
      arima_ci: [f.arima_lower ?? f.arima, f.arima_upper ?? f.arima],
      sarima_ci: [f.sarima_lower ?? f.sarima, f.sarima_upper ?? f.sarima],
      // Individual bounds for tooltip
      arima_lower: f.arima_lower ?? f.arima,
      arima_upper: f.arima_upper ?? f.arima,
      sarima_lower: f.sarima_lower ?? f.sarima,
      sarima_upper: f.sarima_upper ?? f.sarima,
      type: 'forecast'
    }));
    // Connect last historical point to first forecast
    if (hist.length > 0 && fc.length > 0) {
      const last = hist[hist.length - 1];
      fc[0] = { ...fc[0], actual: last.actual };
    }
    return [...hist, ...fc];
  }, [forecastData]);

  // Decomposition Data parsing for Seasonal View
  const decompData = React.useMemo(() => {
    if (!forecastData || !forecastData.feature_engineering?.decomposition) return [];
    const dec = forecastData.feature_engineering.decomposition;
    return dec.trend.map((val, idx) => ({
      period: `W${idx + 1}`,
      trend: val,
      seasonal: dec.seasonal[idx],
      resid: dec.resid[idx]
    }));
  }, [forecastData]);

  const firstForecastPeriod = forecastData?.forecast?.[0]?.period;



  const filteredCats = categories.filter(c =>
    c.toLowerCase().includes(catSearch.toLowerCase())
  );

  // Real SMAPE thresholds: ≤20 = Excellent, ≤40 = Good, else = Fair
  const badge = (v) => v <= 20 ? ['Excellent', 'green'] : v <= 40 ? ['Good', 'blue'] : ['Fair', 'yellow'];

  if (loading && !forecastData) {
    return (
      <div className="forecast-page">
        <div className="page-header">
          <h1>Sales Forecasting</h1>
          <p>Historical data + ARIMA &amp; SARIMA forecast</p>
        </div>
        <div className="fc-skeleton-wrap">
          <div className="fc-skeleton-metrics">
            {[1,2,3,4].map(i => <div key={i} className="fc-skeleton-card" />)}
          </div>
          <div className="fc-skeleton-chart" />
        </div>
      </div>
    );
  }

  if (!hasDataset) {
    return (
      <div className="forecast-page">
        <div className="page-header">
          <h1>Sales Forecasting</h1>
          <p>Historical data + ARIMA &amp; SARIMA forecast</p>
        </div>
        <div className="fc-empty">
          <Upload size={52} color="#667eea" />
          <h3>No Dataset Found</h3>
          <p>Upload a dataset to generate forecasts automatically.</p>
          <button className="fc-upload-btn" onClick={() => navigate('/upload')}>
            Go to Upload
          </button>
        </div>
      </div>
    );
  }


  return (
    <div className="forecast-page">
      <div className="page-header">
        <h1>Sales Forecasting</h1>
        <p>Historical data + ARIMA &amp; SARIMA forecast</p>
      </div>

      {/* Controls bar */}
      <div className="fc-controls-bar">
        {/* Category selector */}
        <div className="fc-cat-wrapper" onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setCatOpen(false); }} tabIndex={-1}>
          <label className="fc-ctrl-label">Category</label>
          <button className="fc-cat-btn" onClick={() => setCatOpen(o => !o)}>
            <span className="fc-cat-selected">{selectedCategory || 'Select...'}</span>
            <ChevronDown size={15} className={catOpen ? 'rotated' : ''} />
          </button>
          {catOpen && (
            <div className="fc-cat-dropdown">
              <input
                className="fc-cat-search"
                placeholder="Search categories..."
                value={catSearch}
                onChange={e => setCatSearch(e.target.value)}
                autoFocus
              />
              <div className="fc-cat-list">
                {filteredCats.map(cat => (
                  <button
                    key={cat}
                    className={`fc-cat-item ${cat === selectedCategory ? 'active' : ''}`}
                    onMouseDown={() => handleCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
                {filteredCats.length === 0 && <p className="fc-cat-empty">No results</p>}
              </div>
            </div>
          )}
        </div>

        {/* Horizon selector */}
        <div className="fc-horizon-group">
          <label className="fc-ctrl-label">Forecast Horizon</label>
          <div className="fc-horizon-btns">
            {HORIZONS.map(h => (
              <button
                key={h}
                className={`fc-horizon-btn ${horizon === h ? 'active' : ''}`}
                onClick={() => handleHorizon(h)}
              >
                {h} Months
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="fc-actions">
          <button className="fc-refresh-btn" onClick={() => runForecast(selectedCategory, horizon)} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'spinning' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* Loading overlay on top of existing chart when switching category */}
      {loading && forecastData && (
        <div className="fc-loading-overlay">
          <div className="fc-loading-spinner"></div>
          <span>Updating forecast...</span>
        </div>
      )}

      {!loading && forecastData && forecastData.metrics && (
        <>
          {/* Metric cards */}
          <div className="fc-metrics">
            <div className="fc-metric-card accent">
              <div className="fc-metric-label">Best Model</div>
              <div className="fc-metric-value">{forecastData.best_model}</div>
              <span className="fc-badge green">Recommended</span>
            </div>
            <div className="fc-metric-card">
              <div className="fc-metric-label">Category</div>
              <div className="fc-metric-value sm">{forecastData.category_used}</div>
            </div>
            <div className="fc-metric-card">
              <div className="fc-metric-label">ARIMA SMAPE</div>
              <div className="fc-metric-value">{forecastData.metrics?.arima_smape ?? '--'}%</div>
              <span className={`fc-badge ${badge(forecastData.metrics?.arima_smape ?? 20)[1]}`}>
                {badge(forecastData.metrics?.arima_smape ?? 20)[0]}
              </span>
            </div>
            <div className="fc-metric-card">
              <div className="fc-metric-label">SARIMA SMAPE</div>
              <div className="fc-metric-value">{forecastData.metrics?.sarima_smape ?? '--'}%</div>
              <span className={`fc-badge ${badge(forecastData.metrics?.sarima_smape ?? 20)[1]}`}>
                {badge(forecastData.metrics?.sarima_smape ?? 20)[0]}
              </span>
            </div>
          </div>

          {/* Model info row — shows AIC-selected orders */}
          {forecastData.model_info && (
            <div className="fc-model-info-bar">
              <span className="fc-mi-label">🔬 Model Parameters (AIC-selected):</span>
              <span className="fc-mi-chip">
                ARIMA ({forecastData.model_info.arima_order?.join(',')})
              </span>
              <span className="fc-mi-chip">
                SARIMA ({forecastData.model_info.sarima_order?.join(',')}){forecastData.model_info.sarima_seasonal ? `×(${forecastData.model_info.sarima_seasonal.join(',')})` : ''}
              </span>
              <span className="fc-mi-chip">
                d={forecastData.model_info.differencing_d} (ADF)
              </span>
              <span className="fc-mi-chip">
                m={forecastData.model_info.seasonal_period_m}
              </span>
            </div>
          )}


          {/* Main chart: historical + forecast */}
          <div className="fc-chart-card">
            <div className="fc-chart-header">
              <div>
                <h2 className="fc-chart-title">Historical Sales + {horizon}-Month Forecast</h2>
                <p className="fc-chart-sub">Category: <strong>{forecastData.category_used}</strong></p>
              </div>
              <div className="fc-legend">
                <span className="fc-dot actual" /> Actual
                <span className="fc-dot arima" /> ARIMA
                <span className="fc-dot sarima" /> SARIMA
              </div>
            </div>

            <ResponsiveContainer width="100%" height={380}>
              <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="arimaCI" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0.04} />
                  </linearGradient>
                  <linearGradient id="sarimaCI" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.04} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="period"
                  stroke="#9ca3af"
                  tick={{ fontSize: 11 }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  stroke="#9ca3af"
                  tick={{ fontSize: 11 }}
                  tickFormatter={v => `$${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                {firstForecastPeriod && (
                  <ReferenceLine
                    x={firstForecastPeriod}
                    stroke="#f59e0b"
                    strokeDasharray="6 3"
                    label={{ value: 'Forecast Start', position: 'top', fontSize: 11, fill: '#f59e0b' }}
                  />
                )}
                {/* Historical area */}
                <Area
                  type="monotone"
                  dataKey="actual"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  fill="url(#actualGrad)"
                  dot={false}
                  name="Actual"
                  connectNulls={false}
                />
                {/* ARIMA 95% CI band */}
                <Area
                  type="monotone"
                  dataKey="arima_ci"
                  stroke="none"
                  fill="url(#arimaCI)"
                  dot={false}
                  name="ARIMA 95% CI"
                  connectNulls
                />
                {/* SARIMA 95% CI band */}
                <Area
                  type="monotone"
                  dataKey="sarima_ci"
                  stroke="none"
                  fill="url(#sarimaCI)"
                  dot={false}
                  name="SARIMA 95% CI"
                  connectNulls
                />
                {/* ARIMA forecast line */}
                <Line
                  type="monotone"
                  dataKey="arima"
                  stroke="#f97316"
                  strokeWidth={2.5}
                  strokeDasharray="6 3"
                  dot={{ r: 4, fill: '#f97316' }}
                  activeDot={{ r: 6 }}
                  name="ARIMA"
                  connectNulls
                />
                {/* SARIMA forecast line */}
                <Line
                  type="monotone"
                  dataKey="sarima"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  strokeDasharray="6 3"
                  dot={{ r: 4, fill: '#10b981' }}
                  activeDot={{ r: 6 }}
                  name="SARIMA"
                  connectNulls
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Bottom: accuracy + table */}
          <div className="fc-bottom-grid">
            <div className="fc-accuracy-card">
              <h3>Model Accuracy Metrics</h3>
              <div className="fc-bars">
                {[
                  { label: 'ARIMA SMAPE', val: forecastData.metrics?.arima_smape ?? 0, cls: 'arima' },
                  { label: 'SARIMA SMAPE', val: forecastData.metrics?.sarima_smape ?? 0, cls: 'sarima' },
                  { label: 'ARIMA RMSE', val: forecastData.metrics?.arima_rmse ?? 0, cls: 'arima' },
                  { label: 'SARIMA RMSE', val: forecastData.metrics?.sarima_rmse ?? 0, cls: 'sarima' },
                  { label: 'ARIMA MAPE', val: forecastData.metrics?.arima_mape ?? 0, cls: 'arima' },
                  { label: 'SARIMA MAPE', val: forecastData.metrics?.sarima_mape ?? 0, cls: 'sarima' },
                ].map(({ label, val, cls }) => (
                  <div className="fc-bar-row" key={label}>
                    <span className="fc-bar-label">{label}</span>
                    <div className="fc-bar-track">
                      <div className={`fc-bar-fill ${cls}`} style={{ width: `${Math.min(val, 100)}%` }}>
                        <span className="fc-bar-val">{val}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="fc-table-card">
              <h3>Forecast Data Table</h3>
              <div className="fc-table-wrap">
                <table className="fc-table">
                  <thead>
                    <tr>
                      <th>Period</th>
                      <th>ARIMA</th>
                      <th>SARIMA</th>
                      <th>Diff</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(forecastData.forecast || []).map((row, i) => (
                      <tr key={i}>
                        <td>{row.period}</td>
                        <td>${row.arima.toLocaleString()}</td>
                        <td>${row.sarima.toLocaleString()}</td>
                        <td className={row.arima >= row.sarima ? 'pos' : 'neg'}>
                          ${Math.abs(row.arima - row.sarima).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Seasonal Decomposition View (PRD Requirement) */}
          {decompData.length > 0 && (
            <div className="fc-bottom-grid" style={{ marginTop: '24px', gridTemplateColumns: '1fr' }}>
              <div className="fc-chart-card" style={{ padding: '24px' }}>
                <div className="fc-chart-header">
                  <div>
                    <h3>Seasonal Decomposition View</h3>
                    <p>Statsmodels Additive Decomposition (Trend vs Seasonality)</p>
                  </div>
                </div>
                <div style={{ width: '100%', height: '240px', marginTop: '16px' }}>
                  <ResponsiveContainer>
                    <ComposedChart data={decompData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="period" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val > 1000 ? (val / 1000).toFixed(1) + 'k' : val}`} />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                      />
                      <Line type="monotone" dataKey="trend" stroke="#3b82f6" strokeWidth={2} dot={false} name="Trend" />
                      <Line type="monotone" dataKey="seasonal" stroke="#10b981" strokeWidth={2} dot={false} name="Seasonality" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

        </>
      )}
    </div>
  );
};

export default Forecast;
