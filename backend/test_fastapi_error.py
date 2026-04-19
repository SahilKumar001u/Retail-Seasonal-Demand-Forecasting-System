import asyncio
from fastapi.testclient import TestClient
from app.main import app
import sys

client = TestClient(app)
try:
    response = client.get("/forecast?category=WHITE+HANGING+HEART+T-LIGHT+HOLDER&steps=4")
    print("STATUS:", response.status_code)
    print("RESPONSE:", response.text)
except Exception as e:
    import traceback
    traceback.print_exc()
