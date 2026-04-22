import os
from fastapi import APIRouter, UploadFile, File
from app.services import (
    save_file_sync, get_categories, generate_forecast,
    get_dashboard_stats, delete_dataset, check_dataset_exists,
    get_analytics_stats, is_processing
)

router = APIRouter()


@router.post("/upload")
async def upload_dataset(file: UploadFile = File(...)):
    if not file.filename.endswith(('.xlsx', '.xls', '.csv')):
        return {"error": "Invalid file type. Please upload an Excel or CSV file."}

    content = await file.read()
    
    if file.filename.endswith('.csv'):
        import pandas as pd
        import io
        try:
            df = pd.read_csv(io.BytesIO(content))
            out = io.BytesIO()
            df.to_excel(out, index=False, engine='openpyxl')
            content = out.getvalue()
        except Exception as e:
            return {"error": f"Failed to parse CSV file: {str(e)}"}
            
    # Process synchronously so dashboard stats and parquet are ready before returning
    save_file_sync(content)

    return {"message": "Dataset uploaded successfully", "ready": True}


@router.get("/categories")
def fetch_categories():
    return {"categories": get_categories()}


@router.get("/forecast")
def forecast_get(category: str, steps: int = 12):
    return generate_forecast(category, steps)


@router.get("/dashboard-stats")
def fetch_dashboard_stats():
    return get_dashboard_stats()


@router.delete("/dataset")
def delete_uploaded_dataset():
    return delete_dataset()


@router.get("/dataset-status")
def get_dataset_status():
    import app.services as svc
    xlsx_exists    = os.path.exists("data/dataset.xlsx")
    parquet_exists = os.path.exists("data/dataset_cache.parquet")
    return {
        "exists":     xlsx_exists,
        "ready":      parquet_exists,   # ready only when parquet is done
        "processing": xlsx_exists and not parquet_exists,
    }


@router.get("/dataset-preview")
def fetch_dataset_preview():
    from app.services import get_dataset_preview
    return get_dataset_preview()


@router.get("/analytics")
def fetch_analytics_stats():
    return get_analytics_stats()