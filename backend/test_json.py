import sys
sys.path.insert(0, '.')
from app.model import run_forecast
import json

def test():
    try:
        result = run_forecast('data/dataset.xlsx', 'WHITE HANGING HEART T-LIGHT HOLDER', 4)
        json.dumps(result)
        print("JSON serialization SUCCESS")
    except Exception as e:
        import traceback
        traceback.print_exc()

test()
