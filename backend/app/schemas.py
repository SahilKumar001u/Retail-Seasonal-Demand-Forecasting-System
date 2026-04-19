from pydantic import BaseModel

class ForecastRequest(BaseModel):
    category: str
    steps: int = 12