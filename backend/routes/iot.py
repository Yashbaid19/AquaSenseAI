from fastapi import APIRouter, Depends
from datetime import datetime, timezone
from database import sensor_readings_collection
from auth import get_current_user_id
from deps import app_state
import random

router = APIRouter(tags=["iot"])


@router.post("/iot/sensor-data")
async def ingest_sensor_data(data: dict):
    device_id = data.get("device_id", "ESP32_DEFAULT")
    user_id = data.get("user_id", "default_user")
    raw_soil = data.get("soil_moisture", data.get("soil", 0))

    if raw_soil > 100:
        soil_moisture_percent = max(0, min(100, 100 - (raw_soil / 4095 * 100)))
    else:
        soil_moisture_percent = raw_soil

    sensor_doc = {
        "user_id": user_id,
        "device_id": device_id,
        "soil_moisture": round(soil_moisture_percent, 1),
        "temperature": data.get("temperature", 0),
        "humidity": data.get("humidity", 0),
        "soil_temp": data.get("soil_temp", 0),
        "water_stress_index": data.get("water_stress_index", round(random.uniform(0.1, 0.9), 2)),
        "timestamp": data.get("timestamp", datetime.now(timezone.utc).isoformat()),
        "raw_soil_value": raw_soil,
        "farm_id": data.get("farm_id"),
    }

    await sensor_readings_collection.insert_one(sensor_doc.copy())

    if app_state.notification_service:
        alerts = await app_state.notification_service.check_sensor_alerts(user_id, sensor_doc)
    else:
        alerts = []

    if app_state.ws_manager:
        ws_data = {
            "type": "sensor_update",
            "data": {
                "user_id": user_id, "device_id": device_id,
                "soil_moisture": round(soil_moisture_percent, 1),
                "temperature": data.get("temperature", 0),
                "humidity": data.get("humidity", 0),
                "soil_temp": data.get("soil_temp", 0),
                "water_stress_index": sensor_doc["water_stress_index"],
                "timestamp": sensor_doc["timestamp"], "rain_probability": 0
            }
        }
        await app_state.ws_manager.broadcast_to_user(user_id, ws_data)
        for alert in alerts:
            await app_state.ws_manager.broadcast_to_user(user_id, {"type": "alert", "data": alert})

    return {"status": "success", "message": "Sensor data ingested", "alerts_generated": len(alerts)}


@router.get("/iot/devices")
async def get_user_devices(user_id: str = Depends(get_current_user_id)):
    devices = await sensor_readings_collection.distinct("device_id", {"user_id": user_id})
    device_list = []
    for device_id in devices:
        latest = await sensor_readings_collection.find_one(
            {"user_id": user_id, "device_id": device_id}, {"_id": 0}, sort=[("timestamp", -1)]
        )
        device_list.append({"device_id": device_id, "status": "active" if latest else "inactive", "last_reading": latest.get("timestamp") if latest else None})
    return device_list
