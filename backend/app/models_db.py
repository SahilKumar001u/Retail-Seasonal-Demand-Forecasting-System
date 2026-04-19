from sqlalchemy import Column, Integer, String, Float, DateTime, Text, JSON
from app.database import Base
from datetime import datetime

class ForecastLog(Base):
    """
    Stores historical forecasts so the API has persistent data storage
    as requested in Week 10 of the PRD.
    """
    __tablename__ = "forecast_logs"

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    category = Column(String, index=True)
    steps = Column(Integer)
    best_model = Column(String)
    metrics = Column(JSON)      # Stores SMAPE / RMSE
    forecast_data = Column(JSON) # Stores the series arrays
