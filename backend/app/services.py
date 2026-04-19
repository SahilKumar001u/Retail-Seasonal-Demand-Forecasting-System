import pandas as pd
import numpy as np
import os
import threading

DATA_PATH  = "data/dataset.xlsx"
CACHE_PATH = "data/dataset_cache.parquet"

_stats_cache    = None
_cache_mtime    = None
_forecast_cache = {}   # dict: cache_key → result (multi-category cache)
_is_processing  = False


# ─────────────────────────────────────────────
# FILE SAVE
# ─────────────────────────────────────────────

def save_file(file):
    """Legacy – kept for compatibility."""
    pass


def save_file_sync(content: bytes):
    """Synchronous upload: write xlsx, convert parquet, compute stats.
    Returns only after dashboard data is ready. Forecast pre-warms in background."""
    global _stats_cache, _cache_mtime, _forecast_cache, _is_processing

    os.makedirs("data", exist_ok=True)
    _is_processing = True

    try:
        # 1. Write xlsx
        with open(DATA_PATH, "wb") as f:
            f.write(content)

        # 2. Clear caches
        _stats_cache    = None
        _cache_mtime    = None
        _forecast_cache = {}  # empty dict, never None

        # 3. Convert to parquet (blocking)
        if os.path.exists(CACHE_PATH):
            os.remove(CACHE_PATH)
        _convert_to_parquet()

        # 4. Pre-compute dashboard stats (blocking — so dashboard is instant after upload)
        get_dashboard_stats()

    finally:
        _is_processing = False

    # 5. Pre-warm forecast in background (non-blocking)
    threading.Thread(target=_prewarm_forecast, daemon=True).start()


def save_file_async(content: bytes):
    """Async variant — kept for compatibility."""
    save_file_sync(content)


def is_processing():
    return _is_processing


# ─────────────────────────────────────────────
# PARQUET CONVERSION
# ─────────────────────────────────────────────

def _convert_to_parquet():
    try:
        df = pd.read_excel(
            DATA_PATH,
            usecols=['InvoiceDate', 'Description', 'Quantity', 'UnitPrice'],
            engine='openpyxl'
        )
        df['InvoiceDate'] = pd.to_datetime(df['InvoiceDate'], errors='coerce', format='mixed')
        df = df.dropna(subset=['InvoiceDate', 'Description'])
        df = df[df['Quantity'] > 0]
        df['Sales'] = df['Quantity'] * df['UnitPrice']
        df.to_parquet(CACHE_PATH, index=False)
        print(f"[parquet] {len(df)} rows saved")
    except Exception as e:
        print(f"[parquet] conversion failed: {e}")


def _read_data() -> pd.DataFrame:
    if os.path.exists(CACHE_PATH):
        return pd.read_parquet(CACHE_PATH)
    df = pd.read_excel(
        DATA_PATH,
        usecols=['InvoiceDate', 'Description', 'Quantity', 'UnitPrice'],
        engine='openpyxl'
    )
    df['InvoiceDate'] = pd.to_datetime(df['InvoiceDate'], errors='coerce', format='mixed')
    df = df.dropna(subset=['InvoiceDate', 'Description'])
    df = df[df['Quantity'] > 0]
    df['Sales'] = df['Quantity'] * df['UnitPrice']
    return df


# ─────────────────────────────────────────────
# CATEGORIES
# ─────────────────────────────────────────────

def get_categories():
    global _is_processing
    if _is_processing:
        return []
    try:
        if os.path.exists(CACHE_PATH):
            df = pd.read_parquet(CACHE_PATH, columns=['Description'])
        else:
            df = pd.read_excel(DATA_PATH, usecols=['Description'], engine='openpyxl')
        return df['Description'].dropna().unique().tolist()[:200]
    except Exception as e:
        print(f"[categories] error: {e}")
        return []


# ─────────────────────────────────────────────
# FORECAST
# ─────────────────────────────────────────────

def generate_forecast(category, steps):
    global _forecast_cache
    # Ensure cache is always a dict
    if not isinstance(_forecast_cache, dict):
        _forecast_cache = {}
    cache_key = f"{category}_{steps}"

    # Return from multi-category cache instantly
    cached = _forecast_cache.get(cache_key)
    if cached and 'historical' in cached and 'metrics' in cached:
        return cached

    from app.model import run_forecast
    result = run_forecast(DATA_PATH, category, steps)
    if result and 'error' not in result:
        _forecast_cache[cache_key] = result
    return result


def _prewarm_forecast():
    """Pre-compute top 10 categories × 3 horizons in background so switching is instant."""
    global _forecast_cache
    try:
        cats = get_categories()
        if not cats:
            return
        from app.model import run_forecast
        for cat in cats[:10]:
            for steps in [4, 8, 12]:
                key = f"{cat}_{steps}"
                if key not in _forecast_cache:
                    try:
                        print(f"[prewarm] {cat} ({steps}m)")
                        result = run_forecast(DATA_PATH, cat, steps)
                        if result and 'error' not in result:
                            _forecast_cache[key] = result
                    except Exception as e:
                        print(f"[prewarm] skip {cat}: {e}")
        print(f"[prewarm] done — {len(_forecast_cache)} forecasts cached")
    except Exception as e:
        print(f"[prewarm] error: {e}")


# ─────────────────────────────────────────────
# DASHBOARD STATS
# ─────────────────────────────────────────────

def get_dashboard_stats():
    global _stats_cache, _cache_mtime, _is_processing
    if _is_processing:
        return {"status": "processing", "message": "Processing large dataset, please wait (~30s)..."}
    try:
        source = CACHE_PATH if os.path.exists(CACHE_PATH) else DATA_PATH
        if not os.path.exists(source):
            return {'error': 'No dataset uploaded'}

        mtime = os.path.getmtime(source)
        if _stats_cache is not None and _cache_mtime == mtime:
            return _stats_cache

        df = _read_data()
        total_revenue = float(df['Sales'].sum())

        df['YearMonth'] = df['InvoiceDate'].dt.to_period('M')
        monthly_sales   = df.groupby('YearMonth')['Sales'].sum().sort_index()

        mom_growth = 0.0
        if len(monthly_sales) >= 2:
            last = monthly_sales.iloc[-1]
            prev = monthly_sales.iloc[-2]
            mom_growth = float((last - prev) / prev * 100) if prev != 0 else 0.0

        cat_sales      = df.groupby('Description')['Sales'].sum().nlargest(10)
        top_categories = [
            {'name': str(k), 'sales': float(v), 'growth': mom_growth}
            for k, v in cat_sales.items()
        ]
        monthly_data = [
            {'month': p.strftime('%b'), 'sales': float(s)}
            for p, s in monthly_sales.tail(9).items()
        ]
        category_performance = [
            {'name': c['name'][:20] + ('...' if len(c['name']) > 20 else ''), 'sales': c['sales']}
            for c in top_categories[:4]
        ]

        # Derive forecast accuracy from pre-warmed cache (no model re-run)
        forecast_accuracy = None
        if _forecast_cache:
            smapes = []
            for v in _forecast_cache.values():
                if isinstance(v, dict) and 'metrics' in v:
                    m = v['metrics']
                    arima_s = m.get('arima_smape', 100)
                    sarima_s = m.get('sarima_smape', 100)
                    smapes.append(min(arima_s, sarima_s))
            if smapes:
                avg_smape = sum(smapes) / len(smapes)
                forecast_accuracy = round(max(0, min(100, 100 - avg_smape)), 1)

        result = {
            'total_revenue':       round(total_revenue, 2),
            'mom_growth':          round(mom_growth, 2),
            'top_categories':      top_categories,
            'monthly_sales':       monthly_data,
            'category_performance': category_performance,
            'forecast_accuracy':   forecast_accuracy,
        }
        _stats_cache  = result
        _cache_mtime  = mtime
        return result

    except Exception as e:
        import traceback; traceback.print_exc()
        return {'error': str(e)}


# ─────────────────────────────────────────────
# DELETE / STATUS
# ─────────────────────────────────────────────

def delete_dataset():
    global _stats_cache, _cache_mtime, _forecast_cache
    try:
        for path in [DATA_PATH, CACHE_PATH]:
            if os.path.exists(path):
                os.remove(path)
        _stats_cache = _cache_mtime = None
        _forecast_cache = {}
        return {"success": True,  "message": "Dataset deleted successfully"}
    except Exception as e:
        return {"success": False, "message": str(e)}


def check_dataset_exists():
    return os.path.exists(DATA_PATH) or os.path.exists(CACHE_PATH)


def get_dataset_preview(limit=5):
    try:
        df = _read_data()
        df['InvoiceDate'] = df['InvoiceDate'].dt.strftime('%Y-%m-%d')
        df = df.head(limit)
        return {
            "success": True,
            "columns": ['InvoiceDate', 'Description', 'Quantity', 'UnitPrice'],
            "rows": df[['InvoiceDate', 'Description', 'Quantity', 'UnitPrice']].to_dict(orient='records')
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


# ─────────────────────────────────────────────
# ANALYTICS
# ─────────────────────────────────────────────

def get_analytics_stats():
    """Returns rich analytics data for the Analytics page."""
    try:
        df = _read_data()

        # ── Top 10 categories by total sales ──
        top_cats = df.groupby('Description')['Sales'].sum().nlargest(10)
        top_categories_bar = [
            {"name": k[:28] + ('...' if len(k) > 28 else ''), "sales": round(float(v), 2)}
            for k, v in top_cats.items()
        ]

        # ── Monthly sales trend ──
        df['YearMonth'] = df['InvoiceDate'].dt.to_period('M')
        monthly = df.groupby('YearMonth')['Sales'].sum().sort_index()
        monthly_trend = [
            {"month": p.strftime('%b %Y'), "sales": round(float(s), 2)}
            for p, s in monthly.items()
        ]

        # ── Category distribution (pie) ─ top 6 + Others ──
        top6 = df.groupby('Description')['Sales'].sum().nlargest(6)
        rest = df['Sales'].sum() - top6.sum()
        pie_data = [
            {"name": k[:20] + ('...' if len(k) > 20 else ''), "value": round(float(v), 2)}
            for k, v in top6.items()
        ]
        if rest > 0:
            pie_data.append({"name": "Others", "value": round(float(rest), 2)})

        # ── Month-over-month growth per recent month ──
        mom_series = monthly.pct_change().fillna(0) * 100
        mom_trend = [
            {"month": p.strftime('%b %Y'), "growth": round(float(g), 2)}
            for p, g in mom_series.items()
        ]

        # ── Total stats ──
        total_sales    = round(float(df['Sales'].sum()), 2)
        total_orders   = int(df['InvoiceDate'].count())
        avg_order_val  = round(total_sales / total_orders, 2) if total_orders else 0
        unique_cats    = int(df['Description'].nunique())

        return {
            "top_categories_bar": top_categories_bar,
            "monthly_trend":      monthly_trend,
            "category_pie":       pie_data,
            "mom_growth_trend":   mom_trend,
            "summary": {
                "total_sales":   total_sales,
                "total_orders":  total_orders,
                "avg_order_val": avg_order_val,
                "unique_cats":   unique_cats,
            }
        }
    except Exception as e:
        import traceback; traceback.print_exc()
        return {"error": str(e)}

