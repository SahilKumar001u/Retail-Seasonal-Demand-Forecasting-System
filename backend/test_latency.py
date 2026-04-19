import sys
sys.path.append('.')
from app.services import generate_forecast, get_categories
import time

cats = get_categories()
if cats:
    cat = cats[0]
    print(f"Testing forecast for category: {cat}")
    t0 = time.time()
    res = generate_forecast(cat, 12)
    t1 = time.time()
    print(f"Time taken: {t1 - t0:.2f} seconds")
    if 'error' in res:
        print(f"Error: {res['error']}")
    else:
        print("Success! (Pre-warmed or newly calculated)")
else:
    print("No categories found. Upload a file first.")
