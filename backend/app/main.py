import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import router
from app.database import engine, Base

# PRD: Setup PostgreSQL and store historical data & forecasts Persistent data storage
# Creates the DB tables safely on startup against Postgres or SQLite.
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Retail Forecasting API",
    max_request_size=100 * 1024 * 1024  # 100MB max
)

# Enable CORS — origin is configurable via env var for Docker/EC2 deployments
_cors_origin = os.getenv("CORS_ORIGIN", "http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[_cors_origin, "http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)