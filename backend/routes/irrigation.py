from fastapi import APIRouter, Depends
from datetime import datetime, timezone, timedelta
from database import sensor_readings_collection, irrigation_logs_collection, farm_zones_collection
from auth import get_current_user_id
import random
import aiohttp
import os

router = APIRouter(tags=["irrigation"])

OPENWEATHER_API_KEY = os.environ.get('OPENWEATHER_API_KEY')


async def get_weather_safe():
    try:
        if not OPENWEATHER_API_KEY:
            return 0, 50
        url = f"http://api.openweathermap.org/data/2.5/weather?q=Delhi&appid={OPENWEATHER_API_KEY}&units=metric"
        async with aiohttp.ClientSession() as session:
            async with session.get(url, timeout=2) as response:
                if response.status != 200:
                    return 0, 50
                data = await response.json()
        return data.get("rain", {}).get("1h", 0), data.get("main", {}).get("humidity", 50)
    except Exception:
        return 0, 50


def generate_mock_sensor_data():
    return {
        "soil_moisture": round(random.uniform(25, 45), 1),
        "temperature": round(random.uniform(20, 35), 1),
        "humidity": round(random.uniform(40, 80), 1),
        "soil_temp": round(random.uniform(18, 30), 1),
        "water_stress_index": round(random.uniform(0.1, 0.9), 2)
    }


@router.get("/irrigation/predict")
async def get_irrigation_prediction(user_id: str = Depends(get_current_user_id)):
    user_data = await sensor_readings_collection.find_one({"user_id": user_id}, {"_id": 0}, sort=[("timestamp", -1)])
    esp32_data = await sensor_readings_collection.find_one({"user_id": "default_user"}, {"_id": 0}, sort=[("timestamp", -1)])

    latest = None
    if user_data and esp32_data:
        latest = esp32_data if esp32_data.get("timestamp", "") > user_data.get("timestamp", "") else user_data
    elif esp32_data:
        latest = esp32_data
    elif user_data:
        latest = user_data

    if not latest:
        mock_data = generate_mock_sensor_data()
        mock_data.update({"user_id": user_id, "timestamp": datetime.now(timezone.utc).isoformat()})
        await sensor_readings_collection.insert_one(mock_data)
        latest = mock_data

    soil_moisture = latest.get("soil_moisture", 30)
    temperature = latest.get("temperature", 25)
    humidity = latest.get("humidity", 60)

    rain_mm, weather_humidity = await get_weather_safe()
    rain_probability = min(100, int(rain_mm * 10)) if rain_mm else 0

    from ai_models import irrigation_predictor
    decision = irrigation_predictor.predict(
        soil_moisture=soil_moisture, temperature=temperature,
        humidity=humidity, rain_probability=rain_probability
    )

    recommendation = decision.get("decision", "Monitor")
    if recommendation == "Irrigate":
        irr_status = "schedule" if decision.get("priority") == "MEDIUM" else "critical"
        recommended_time = decision.get("time", "Soon")
    elif recommendation == "Delay":
        irr_status = "monitor"
        recommended_time = decision.get("time", "After rain")
    else:
        irr_status = "optimal"
        recommended_time = "N/A"

    water_quantity = decision.get("water_quantity", 0)
    crop_stress = "Critical" if soil_moisture < 25 else "High" if soil_moisture < 35 else "Moderate" if soil_moisture < 45 else "Low"

    await irrigation_logs_collection.insert_one({
        "user_id": user_id,
        "recommended_time": recommended_time,
        "water_quantity": water_quantity,
        "crop_stress_level": crop_stress,
        "rain_forecast": f"{rain_probability}% chance",
        "recommendation": f"{recommendation} - {decision.get('explanation', {}).get('reasoning', '')}",
        "status": irr_status,
        "confidence": decision.get("confidence", 85),
        "timestamp": datetime.now(timezone.utc).isoformat()
    })

    return {
        "recommendation": f"{recommendation} - {decision.get('explanation', {}).get('reasoning', 'Based on sensor data')}",
        "recommended_time": recommended_time,
        "water_quantity": water_quantity,
        "crop_stress_level": crop_stress,
        "rain_forecast": f"{rain_probability}% chance of rain",
        "rain_probability": rain_probability,
        "status": irr_status,
        "current_soil_moisture": soil_moisture,
        "confidence": decision.get("confidence", 85),
        "model_type": decision.get("explanation", {}).get("model_type", "AI Model")
    }


@router.get("/zones")
async def get_farm_zones(user_id: str = Depends(get_current_user_id)):
    zones = await farm_zones_collection.find({"user_id": user_id}, {"_id": 0}).to_list(100)
    if not zones:
        mock_zones = [
            {"user_id": user_id, "zone_name": "Zone A", "status": "healthy", "soil_moisture": 38.5, "coordinates": {"lat": 28.6139, "lng": 77.2090}},
            {"user_id": user_id, "zone_name": "Zone B", "status": "needs_irrigation", "soil_moisture": 26.3, "coordinates": {"lat": 28.6149, "lng": 77.2100}},
            {"user_id": user_id, "zone_name": "Zone C", "status": "critical", "soil_moisture": 21.7, "coordinates": {"lat": 28.6159, "lng": 77.2110}},
            {"user_id": user_id, "zone_name": "Zone D", "status": "optimal", "soil_moisture": 41.2, "coordinates": {"lat": 28.6129, "lng": 77.2080}}
        ]
        await farm_zones_collection.insert_many(mock_zones)
        zones = await farm_zones_collection.find({"user_id": user_id}, {"_id": 0}).to_list(100)
    return zones


@router.get("/schedule")
async def get_irrigation_schedule(user_id: str = Depends(get_current_user_id)):
    logs = await irrigation_logs_collection.find({"user_id": user_id}, {"_id": 0}).sort("timestamp", -1).limit(5).to_list(5)
    schedule = []
    for i, log in enumerate(logs):
        if log.get("status") in ("schedule", "critical"):
            ts = log.get("timestamp", "")
            try:
                dt = datetime.fromisoformat(ts) + timedelta(hours=i + 1)
            except Exception:
                dt = datetime.now(timezone.utc) + timedelta(hours=i + 1)
            schedule.append({
                "zone": f"Zone {chr(65 + i)}",
                "date": dt.strftime("%b %d"),
                "time": dt.strftime("%I:%M %p"),
                "priority": "HIGH" if log.get("status") == "critical" else "MEDIUM",
                "water_quantity": log.get("water_quantity", 0)
            })

    if not schedule:
        now = datetime.now(timezone.utc)
        schedule = [
            {"zone": "Zone A", "date": (now + timedelta(hours=2)).strftime("%b %d"), "time": (now + timedelta(hours=2)).strftime("%I:%M %p"), "priority": "MEDIUM", "water_quantity": 4.5},
            {"zone": "Zone C", "date": (now + timedelta(hours=6)).strftime("%b %d"), "time": (now + timedelta(hours=6)).strftime("%I:%M %p"), "priority": "HIGH", "water_quantity": 6.2},
        ]
    return schedule


@router.get("/alerts")
async def get_smart_alerts(user_id: str = Depends(get_current_user_id)):
    latest = await sensor_readings_collection.find_one({"user_id": user_id}, {"_id": 0}, sort=[("timestamp", -1)])
    if not latest:
        latest = await sensor_readings_collection.find_one({"user_id": "default_user"}, {"_id": 0}, sort=[("timestamp", -1)])

    alerts = []
    if latest:
        sm = latest.get("soil_moisture", 50)
        temp = latest.get("temperature", 25)
        humidity = latest.get("humidity", 60)
        if sm < 25:
            alerts.append({"type": "critical", "title": "Low Soil Moisture", "message": f"Soil moisture at {sm}% - irrigation recommended immediately."})
        elif sm < 35:
            alerts.append({"type": "warning", "title": "Soil Moisture Declining", "message": f"Soil moisture at {sm}% - schedule irrigation soon."})
        if temp > 38:
            alerts.append({"type": "critical", "title": "High Temperature Alert", "message": f"Temperature at {temp}C - crops may experience heat stress."})
        elif temp > 33:
            alerts.append({"type": "warning", "title": "Temperature Rising", "message": f"Temperature at {temp}C - monitor crop stress levels."})
        if humidity < 30:
            alerts.append({"type": "warning", "title": "Low Humidity", "message": f"Humidity at {humidity}% - increased evaporation expected."})
    return alerts
