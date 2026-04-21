import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import router
from app.database import engine, Base
from app import models_db

app = FastAPI(
    title="Retail Forecasting API",
    max_request_size=100 * 1024 * 1024
)

# ✅ Create tables on startup (ONLY HERE)
@app.on_event("startup")
def on_startup():
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)

# CORS
_cors_origin = os.getenv("CORS_ORIGIN", "http://localhost:3000")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[_cors_origin, "http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)