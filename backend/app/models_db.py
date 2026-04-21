from sqlalchemy import Column, Integer, String, Float, DateTime, JSON
from app.database import Base
from datetime import datetime

class ForecastLog(Base):
    __tablename__ = "forecast_logs"

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    category = Column(String, index=True)
    steps = Column(Integer)
    best_model = Column(String)
    metrics = Column(JSON)
    forecast_data = Column(JSON)