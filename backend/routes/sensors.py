from fastapi import APIRouter, Depends
from datetime import datetime, timezone, timedelta
from database import sensor_readings_collection
from auth import get_current_user_id
import random
import aiohttp
import os

router = APIRouter(tags=["sensors"])

OPENWEATHER_API_KEY = os.environ.get('OPENWEATHER_API_KEY')


def generate_mock_sensor_data():
    return {
        "soil_moisture": round(random.uniform(25, 45), 1),
        "temperature": round(random.uniform(20, 35), 1),
        "humidity": round(random.uniform(40, 80), 1),
        "soil_temp": round(random.uniform(18, 30), 1),
        "water_stress_index": round(random.uniform(0.1, 0.9), 2)
    }


@router.get("/sensors/latest")
async def get_latest_sensor_data(user_id: str = Depends(get_current_user_id)):
    user_data = await sensor_readings_collection.find_one(
        {"user_id": user_id}, {"_id": 0}, sort=[("timestamp", -1)]
    )
    esp32_data = await sensor_readings_collection.find_one(
        {"user_id": "default_user"}, {"_id": 0}, sort=[("timestamp", -1)]
    )

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
        await sensor_readings_collection.insert_one(mock_data.copy())
        latest = mock_data

    rain = 0
    humidity = latest.get("humidity", 50)
    try:
        if OPENWEATHER_API_KEY:
            timeout = aiohttp.ClientTimeout(total=2)
            url = f"http://api.openweathermap.org/data/2.5/weather?q=Delhi&appid={OPENWEATHER_API_KEY}&units=metric"
            async with aiohttp.ClientSession(timeout=timeout) as session:
                async with session.get(url) as response:
                    if response.status == 200:
                        data = await response.json()
                        rain = data.get("rain", {}).get("1h", 0)
                        humidity = data.get("main", {}).get("humidity", humidity)
    except Exception as e:
        print("Weather error:", e)

    latest["rain_probability"] = rain
    latest["humidity"] = humidity
    if "soil_temp" not in latest:
        latest["soil_temp"] = round(random.uniform(18, 30), 1)

    return {**latest, "irrigation_status": "optimal" if latest.get("soil_moisture", 0) > 30 else "needs_irrigation"}


@router.get("/sensors/history")
async def get_sensor_history(user_id: str = Depends(get_current_user_id)):
    readings = await sensor_readings_collection.find(
        {"user_id": {"$in": [user_id, "default_user"]}}, {"_id": 0}
    ).sort("timestamp", -1).limit(50).to_list(50)

    if len(readings) == 0:
        for i in range(20):
            mock_data = generate_mock_sensor_data()
            mock_data.update({"user_id": user_id, "timestamp": (datetime.now(timezone.utc) - timedelta(hours=i)).isoformat()})
            await sensor_readings_collection.insert_one(mock_data)
        readings = await sensor_readings_collection.find(
            {"user_id": user_id}, {"_id": 0}
        ).sort("timestamp", -1).limit(50).to_list(50)

    return readings
