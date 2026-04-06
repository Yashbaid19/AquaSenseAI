"""
KrishiRakshak X - Supporting modules for AquaSense AI
Crop Prediction, Yield Prediction, Mandi Pricing, Market Trends, Equipment, Finance
"""
import joblib
import pandas as pd
import numpy as np
import random
import warnings
import logging
from datetime import datetime, timezone, timedelta

warnings.filterwarnings('ignore')
logger = logging.getLogger(__name__)

# --- Crop Prediction Model ---
try:
    crop_model = joblib.load('/app/backend/models/crop_model.pkl')
    CROP_CLASSES = list(crop_model.classes_)
    CROP_FEATURES = list(crop_model.feature_names_in_)
    logger.info(f"Crop model loaded: {len(CROP_CLASSES)} classes, {len(CROP_FEATURES)} features")
except Exception as e:
    crop_model = None
    CROP_CLASSES = []
    CROP_FEATURES = []
    logger.error(f"Crop model load failed: {e}")


def predict_crop(nitrogen, potassium, phosphorus, temperature, humidity, rainfall):
    if crop_model is None:
        return {"crop": "rice", "confidence": 0.75, "top_3": [("rice", 75), ("maize", 15), ("cotton", 10)], "model_type": "Fallback"}

    features = pd.DataFrame([[nitrogen, potassium, phosphorus, temperature, humidity, rainfall]], columns=CROP_FEATURES)
    pred = crop_model.predict(features)[0]
    proba = crop_model.predict_proba(features)[0]
    top3 = sorted(zip(CROP_CLASSES, proba), key=lambda x: -x[1])[:3]

    return {
        "crop": pred,
        "confidence": round(float(max(proba)), 4),
        "top_3": [(c, round(float(p) * 100, 1)) for c, p in top3],
        "model_type": "RandomForest (crop_model.pkl)"
    }


# --- Yield Prediction (Demo Logic) ---
CROP_YIELD_BASE = {
    "rice": 2800, "wheat": 3200, "maize": 4500, "cotton": 1800, "sugarcane": 70000,
    "soybean": 2200, "groundnut": 1600, "tomato": 25000, "potato": 20000, "onion": 18000,
    "banana": 30000, "mango": 8000, "apple": 12000, "coffee": 1200, "tea": 2000,
}

SOIL_QUALITY_FACTOR = {"poor": 0.6, "average": 0.85, "good": 1.0, "excellent": 1.15}


def predict_yield(crop_type, area_hectares, rainfall_mm, avg_temp, soil_quality):
    base = CROP_YIELD_BASE.get(crop_type.lower(), 3000)
    soil_f = SOIL_QUALITY_FACTOR.get(soil_quality.lower(), 0.85)
    rain_f = min(1.3, max(0.5, rainfall_mm / 800))
    temp_f = 1.0 if 20 <= avg_temp <= 30 else (0.85 if avg_temp < 20 else 0.9)
    predicted = base * soil_f * rain_f * temp_f
    total = predicted * area_hectares
    return {
        "yield_per_acre": round(predicted / 2.47, 0),
        "total_yield_kg": round(total, 0),
        "area_hectares": area_hectares,
        "crop": crop_type,
        "factors": {"soil": soil_f, "rain": round(rain_f, 2), "temp": round(temp_f, 2)},
        "model_type": "Rule-based estimation"
    }


# --- Mandi Pricing (Demo Data) ---
MANDI_DATA = {
    "Maharashtra": {
        "Pune": [
            {"commodity": "Tomato", "category": "Vegetables", "min_price": 800, "max_price": 2500, "modal_price": 1500},
            {"commodity": "Onion", "category": "Vegetables", "min_price": 1200, "max_price": 3000, "modal_price": 2000},
            {"commodity": "Potato", "category": "Vegetables", "min_price": 600, "max_price": 1500, "modal_price": 1000},
            {"commodity": "Wheat", "category": "Grains", "min_price": 2200, "max_price": 2800, "modal_price": 2500},
            {"commodity": "Rice", "category": "Grains", "min_price": 3000, "max_price": 4500, "modal_price": 3800},
            {"commodity": "Soybean", "category": "Pulses", "min_price": 4000, "max_price": 5500, "modal_price": 4800},
            {"commodity": "Turmeric", "category": "Spices", "min_price": 8000, "max_price": 14000, "modal_price": 11000},
            {"commodity": "Mango", "category": "Fruits", "min_price": 3000, "max_price": 8000, "modal_price": 5000},
            {"commodity": "Banana", "category": "Fruits", "min_price": 1000, "max_price": 2500, "modal_price": 1800},
            {"commodity": "Chilli", "category": "Spices", "min_price": 6000, "max_price": 12000, "modal_price": 9000},
            {"commodity": "Cotton", "category": "Grains", "min_price": 5500, "max_price": 7000, "modal_price": 6200},
            {"commodity": "Groundnut", "category": "Pulses", "min_price": 4500, "max_price": 6000, "modal_price": 5200},
        ],
        "Mumbai": [
            {"commodity": "Tomato", "category": "Vegetables", "min_price": 1000, "max_price": 3000, "modal_price": 1800},
            {"commodity": "Onion", "category": "Vegetables", "min_price": 1500, "max_price": 3500, "modal_price": 2400},
            {"commodity": "Potato", "category": "Vegetables", "min_price": 800, "max_price": 1800, "modal_price": 1200},
            {"commodity": "Rice", "category": "Grains", "min_price": 3200, "max_price": 5000, "modal_price": 4200},
            {"commodity": "Mango", "category": "Fruits", "min_price": 4000, "max_price": 10000, "modal_price": 6500},
            {"commodity": "Banana", "category": "Fruits", "min_price": 1200, "max_price": 2800, "modal_price": 2000},
            {"commodity": "Turmeric", "category": "Spices", "min_price": 9000, "max_price": 15000, "modal_price": 12000},
            {"commodity": "Wheat", "category": "Grains", "min_price": 2400, "max_price": 3000, "modal_price": 2700},
        ],
        "Nagpur": [
            {"commodity": "Orange", "category": "Fruits", "min_price": 2000, "max_price": 5000, "modal_price": 3500},
            {"commodity": "Cotton", "category": "Grains", "min_price": 5800, "max_price": 7200, "modal_price": 6500},
            {"commodity": "Soybean", "category": "Pulses", "min_price": 4200, "max_price": 5800, "modal_price": 5000},
            {"commodity": "Wheat", "category": "Grains", "min_price": 2300, "max_price": 2900, "modal_price": 2600},
            {"commodity": "Rice", "category": "Grains", "min_price": 3100, "max_price": 4800, "modal_price": 3900},
            {"commodity": "Chilli", "category": "Spices", "min_price": 7000, "max_price": 13000, "modal_price": 10000},
            {"commodity": "Tomato", "category": "Vegetables", "min_price": 700, "max_price": 2200, "modal_price": 1400},
        ],
    },
    "Karnataka": {
        "Bangalore": [
            {"commodity": "Tomato", "category": "Vegetables", "min_price": 900, "max_price": 2800, "modal_price": 1600},
            {"commodity": "Coffee", "category": "Spices", "min_price": 20000, "max_price": 35000, "modal_price": 28000},
            {"commodity": "Rice", "category": "Grains", "min_price": 3200, "max_price": 4600, "modal_price": 3900},
            {"commodity": "Coconut", "category": "Fruits", "min_price": 1500, "max_price": 3000, "modal_price": 2200},
            {"commodity": "Mango", "category": "Fruits", "min_price": 3500, "max_price": 9000, "modal_price": 5500},
            {"commodity": "Onion", "category": "Vegetables", "min_price": 1400, "max_price": 3200, "modal_price": 2200},
            {"commodity": "Potato", "category": "Vegetables", "min_price": 700, "max_price": 1600, "modal_price": 1100},
            {"commodity": "Turmeric", "category": "Spices", "min_price": 8500, "max_price": 14500, "modal_price": 11500},
        ],
    },
    "Uttar Pradesh": {
        "Lucknow": [
            {"commodity": "Wheat", "category": "Grains", "min_price": 2100, "max_price": 2700, "modal_price": 2400},
            {"commodity": "Rice", "category": "Grains", "min_price": 2800, "max_price": 4200, "modal_price": 3500},
            {"commodity": "Sugarcane", "category": "Grains", "min_price": 280, "max_price": 350, "modal_price": 315},
            {"commodity": "Potato", "category": "Vegetables", "min_price": 500, "max_price": 1200, "modal_price": 800},
            {"commodity": "Tomato", "category": "Vegetables", "min_price": 600, "max_price": 2000, "modal_price": 1200},
            {"commodity": "Onion", "category": "Vegetables", "min_price": 1000, "max_price": 2500, "modal_price": 1700},
            {"commodity": "Mango", "category": "Fruits", "min_price": 2500, "max_price": 7000, "modal_price": 4500},
        ],
    },
    "Punjab": {
        "Ludhiana": [
            {"commodity": "Wheat", "category": "Grains", "min_price": 2200, "max_price": 2800, "modal_price": 2500},
            {"commodity": "Rice", "category": "Grains", "min_price": 3000, "max_price": 4500, "modal_price": 3800},
            {"commodity": "Cotton", "category": "Grains", "min_price": 5600, "max_price": 7100, "modal_price": 6300},
            {"commodity": "Potato", "category": "Vegetables", "min_price": 400, "max_price": 1000, "modal_price": 700},
            {"commodity": "Tomato", "category": "Vegetables", "min_price": 500, "max_price": 1800, "modal_price": 1100},
            {"commodity": "Onion", "category": "Vegetables", "min_price": 900, "max_price": 2200, "modal_price": 1500},
        ],
    },
}

STATES = list(MANDI_DATA.keys())


def get_mandi_data(state, district, category="All"):
    data = MANDI_DATA.get(state, {}).get(district, [])
    if category and category != "All":
        data = [d for d in data if d["category"] == category]
    return data


def get_states():
    return STATES


def get_districts(state):
    return list(MANDI_DATA.get(state, {}).keys())


# --- Market Trends (Demo) ---
def get_market_trends(crop, frequency="daily"):
    base_prices = {
        "rice": 3800, "wheat": 2500, "tomato": 1500, "onion": 2000, "cotton": 6200,
        "soybean": 4800, "coffee": 28000, "mango": 5000, "potato": 1000, "banana": 1800,
    }
    base = base_prices.get(crop.lower(), 2000)
    now = datetime.now(timezone.utc)
    days = 30
    step = 1 if frequency == "daily" else 7

    history = []
    for i in range(days, 0, -step):
        dt = now - timedelta(days=i)
        noise = random.uniform(-0.08, 0.08)
        trend = 0.001 * (days - i)
        price = base * (1 + noise + trend)
        history.append({"date": dt.strftime("%Y-%m-%d"), "price": round(price)})

    predictions = []
    last = history[-1]["price"] if history else base
    for i in range(1, 8):
        dt = now + timedelta(days=i)
        change = random.uniform(-0.03, 0.04)
        last = last * (1 + change)
        predictions.append({"date": dt.strftime("%Y-%m-%d"), "price": round(last)})

    current = history[-1]["price"] if history else base
    avg = round(sum(h["price"] for h in history) / len(history)) if history else base
    predicted_change = round(((predictions[-1]["price"] - current) / current) * 100, 1) if predictions else 0

    return {
        "crop": crop,
        "current_price": current,
        "average_price": avg,
        "predicted_change": predicted_change,
        "history": history,
        "predictions": predictions
    }


# --- Government Schemes ---
GOVT_SCHEMES = {
    "central": [
        {"name": "PM-KISAN", "description": "Direct income support of Rs 6,000/year to farmer families", "url": "https://pmkisan.gov.in/", "type": "Income Support"},
        {"name": "PM Fasal Bima Yojana", "description": "Crop insurance scheme against natural calamities", "url": "https://pmfby.gov.in/", "type": "Insurance"},
        {"name": "Kisan Credit Card", "description": "Credit facility for farming needs at subsidized interest", "url": "https://www.nabard.org/", "type": "Credit"},
        {"name": "Soil Health Card", "description": "Free soil testing and nutrient recommendations", "url": "https://soilhealth.dac.gov.in/", "type": "Advisory"},
        {"name": "PM Krishi Sinchai Yojana", "description": "Irrigation infrastructure development support", "url": "https://pmksy.gov.in/", "type": "Irrigation"},
        {"name": "e-NAM", "description": "Electronic National Agriculture Market for transparent trading", "url": "https://enam.gov.in/", "type": "Market"},
    ],
    "state": {
        "Maharashtra": [
            {"name": "Jalyukt Shivar Abhiyan", "description": "Water conservation and drought-proofing", "url": "#"},
            {"name": "Nanaji Deshmukh Krishi Sanjivani", "description": "Climate resilient agriculture project", "url": "#"},
        ],
        "Karnataka": [
            {"name": "Raitha Siri", "description": "Farmer welfare and crop diversification", "url": "#"},
            {"name": "Krishi Bhagya", "description": "Farm pond and irrigation support", "url": "#"},
        ],
        "Uttar Pradesh": [
            {"name": "Kisan Rath", "description": "Transport facility for agricultural produce", "url": "#"},
            {"name": "Paramparagat Krishi Vikas Yojana", "description": "Organic farming support", "url": "#"},
        ],
        "Punjab": [
            {"name": "Crop Diversification Programme", "description": "Incentives for diversifying from paddy", "url": "#"},
            {"name": "Mera Pani Meri Virasat", "description": "Water conservation incentive scheme", "url": "#"},
        ],
    }
}

INSURANCE_OPTIONS = [
    {"name": "PM Fasal Bima Yojana", "type": "Government", "description": "Comprehensive crop insurance", "url": "https://pmfby.gov.in/"},
    {"name": "Weather Based Crop Insurance", "description": "Coverage against weather anomalies", "type": "Government", "url": "https://pmfby.gov.in/"},
    {"name": "ICICI Lombard Crop Insurance", "type": "Private", "description": "Private crop insurance solutions", "url": "https://www.icicilombard.com/"},
    {"name": "HDFC ERGO Crop Insurance", "type": "Private", "description": "Customizable farm insurance", "url": "https://www.hdfcergo.com/"},
]
