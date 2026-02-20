
# 📦 Retail Seasonal Demand Forecasting System

A full-stack **Data Science & Machine Learning system** that forecasts retail demand using time series models (ARIMA/SARIMAX). It helps businesses optimize inventory, reduce stockouts, and improve supply chain decisions.


## 📌 Problem Statement

Retail demand fluctuates due to:

* Seasonal trends
* Holidays and promotions
* Customer behavior changes

Without accurate forecasting:

* Overstocking increases costs
* Stockouts reduce revenue
* Supply chain planning becomes inefficient

👉 This project builds a system to **predict demand at the product category level** using historical data.

---

## 🎯 Objectives

### Core Objectives

* Forecast demand using historical sales data
* Capture trends and seasonality (ARIMA/SARIMAX)
* Provide REST APIs for predictions
* Build an interactive dashboard
* Allow configurable forecast horizon

### Stretch Goals

* Auto-ARIMA
* Multi-seasonality handling
* External regressors (price, holidays)
* Confidence intervals
* Real-time data integration
* Automated retraining

---

## 🧠 Machine Learning Approach

### Model

* ARIMA / SARIMAX

### Workflow

1. Stationarity check (ADF test)
2. Differencing
3. Parameter selection (p, d, q, P, D, Q, s)
4. Model training per category
5. Forecast generation

### Metrics

* sMAPE ≤ 20%
* RMSE ≤ 10–20%
* Accuracy ≥ 80%

---

## 🗂️ Dataset

**Source:** UCI Online Retail Dataset

### Features

* InvoiceNo
* StockCode
* Description
* Quantity
* InvoiceDate
* UnitPrice
* CustomerID
* Country

### Derived Fields

* Product Category
* Sales = Quantity × UnitPrice
* Time Index (daily/weekly/monthly)

---

## 🔄 Data Pipeline

1. **Ingestion**

   * CSV upload / DB connection
   * Schema validation

2. **Cleaning**

   * Remove negative quantities
   * Handle missing values
   * Convert timestamps

3. **Aggregation**

   * Group by category and time

4. **Feature Engineering**

   * Lag features
   * Rolling averages
   * Seasonal decomposition

5. **Storage**

   * PostgreSQL

---


## ⚙️ Tech Stack

### Frontend

* React
* Tailwind CSS
* Recharts

### Backend

* FastAPI

### Machine Learning

* pandas
* numpy
* statsmodels

### Database

* PostgreSQL

### Deployment

* Docker
* AWS EC2

---

## 🔥 Features

### Core Features

* Upload dataset
* Category-level aggregation
* ARIMA forecasting
* REST API
* Interactive dashboard

### ML Features

* Per-category models
* Configurable forecast horizon
* Seasonal decomposition
* Error metrics (sMAPE, RMSE)
* Residual diagnostics

---

## 💻 Installation

### Clone Repo

```bash
git clone https://github.com/your-username/retail-forecasting.git
cd retail-forecasting
```

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

### Database Setup

* Install PostgreSQL
* Create database
* Update connection string

---

## 🐳 Docker Setup

```bash
docker-compose up --build
```

---

## ☁️ Deployment (AWS EC2)

* Launch EC2 instance
* Install Docker
* Deploy using Docker Compose
* Expose API

---

## 📊 Dashboard Features

* Historical vs forecast graph
* Category selection
* Adjustable forecast horizon
* Seasonal decomposition
* Performance metrics

---

## ⚡ Non-Functional Requirements

* API latency < 500 ms
* Scalable architecture
* Secure endpoints
* Proper error handling

---

## ⚠️ Risks

* Poor data quality
* Concept drift
* Sparse category data
* Overfitting

---

## 📦 Deliverables

* Web Application
* Forecast API
* Dashboard
* Documentation
* Source Code

---

## 🚀 Future Work

* Auto-ARIMA
* Real-time data
* Advanced models (LSTM, Prophet)
* Cloud scaling

---
## 🚀 Consumer Flow
1) Getting Started
   <img width="430" height="587" alt="image" src="https://github.com/user-attachments/assets/e2131944-478c-423e-a181-50ed0ef0af75" />

2) Getting the Forecast
   <img width="600" height="765" alt="image" src="https://github.com/user-attachments/assets/7918d298-48d8-4703-a794-34a0d8deee8b" />

3) Understanding Results
   <img width="1640" height="290" alt="image" src="https://github.com/user-attachments/assets/2a61a624-21b4-4a28-8412-b37175a56eee" />

