# Retail Forecasting Dashboard

Modern React dashboard for retail sales forecasting with ARIMA and SARIMA models.

## Features

- 📊 **Dashboard Overview** - Financial metrics, charts, and KPIs
- 📁 **Upload Dataset** - Drag & drop Excel file upload with validation
- 📈 **Forecasting** - Generate ARIMA and SARIMA forecasts
- 📉 **Analytics** - Detailed insights and performance metrics
- 🎨 Modern UI inspired by professional templates
- 📱 Responsive design

## Pages

### 1. Dashboard (Overview)
- Company balance metrics
- Goal tracking with circular progress
- MOIC (Multiple on Invested Capital) charts
- Distribution analysis
- Investment comparisons
- KPIs table with pagination

### 2. Upload
- Drag & drop file upload
- Excel file validation (.xlsx, .xls)
- Dataset requirements guide
- Sample data structure
- Upload status feedback

### 3. Forecast
- Category selection
- Configurable forecast steps
- ARIMA vs SARIMA comparison
- Interactive line charts
- Model accuracy metrics
- Export to CSV
- Forecast data table

### 4. Analytics
- Sales by category
- Category distribution
- Performance insights

## Installation

```bash
cd frontend
npm install
```

## Running the Application

```bash
npm start
```

The app will open at `http://localhost:3000`

## Backend Setup

Make sure your FastAPI backend is running on `http://localhost:8000`

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Project Structure

```
frontend/
├── public/
├── src/
│   ├── components/
│   │   ├── Layout.js
│   │   ├── Sidebar.js
│   │   └── Header.js
│   ├── pages/
│   │   ├── Overview.js      # Dashboard overview
│   │   ├── Upload.js        # Dataset upload
│   │   ├── Forecast.js      # Forecasting page
│   │   └── Analytics.js     # Analytics page
│   ├── App.js
│   └── index.js
└── package.json
```

## Technologies

- React 18
- React Router
- Recharts (for charts)
- Axios (API calls)
- Lucide React (icons)

## Navigation

- **Dashboard** - Overview with metrics and charts
- **Upload** - Upload your retail dataset
- **Forecast** - Generate sales forecasts
- **Analytics** - View detailed analytics
- **Settings** - Application settings
- **Help** - Help and documentation
- **Logout** - Sign out
