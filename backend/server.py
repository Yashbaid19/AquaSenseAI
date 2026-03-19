from fastapi import FastAPI, APIRouter, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from pathlib import Path
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from fastapi import Request
from fastapi.responses import FileResponse
import os
import logging
from PIL import Image
import io
import random
import aiohttp
from emergentintegrations.llm.chat import LlmChat, UserMessage


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from database import (
    init_db, users_collection, sensor_readings_collection, irrigation_logs_collection,
    farm_zones_collection, drone_analysis_collection, rover_data_collection,
    chat_history_collection, water_analytics_collection, db
)
from auth import hash_password, verify_password, create_access_token, get_current_user_id

app = FastAPI()
api_router = APIRouter(prefix="/api")

GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')
OPENWEATHER_API_KEY = os.environ.get('OPENWEATHER_API_KEY')


# Pydantic Models
class SignupRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    farm_location: str
    farm_size: float
    primary_crop: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


# Helper function
def generate_mock_sensor_data():
    return {
        "soil_moisture": round(random.uniform(25, 45), 1),
        "temperature": round(random.uniform(20, 35), 1),
        "humidity": round(random.uniform(40, 80), 1),
        "water_stress_index": round(random.uniform(0.1, 0.9), 2)
    }


# Auth Endpoints
@api_router.post("/auth/signup")
async def signup(request: SignupRequest):
    existing = await users_collection.find_one({"email": request.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_doc = {
        "name": request.name,
        "email": request.email,
        "password_hash": hash_password(request.password),
        "farm_location": request.farm_location,
        "farm_size": request.farm_size,
        "primary_crop": request.primary_crop,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    result = await users_collection.insert_one(user_doc)
    user_id = str(result.inserted_id)
    
    token = create_access_token({"user_id": user_id, "email": request.email})
    
    return {
        "token": token,
        "user": {
            "id": user_id,
            "name": request.name,
            "email": request.email,
            "farm_location": request.farm_location,
            "farm_size": request.farm_size,
            "primary_crop": request.primary_crop
        }
    }


@api_router.post("/auth/login")
async def login(request: LoginRequest):
    user = await users_collection.find_one({"email": request.email}, {"_id": 0})
    if not user or not verify_password(request.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token({"user_id": user.get("user_id", request.email), "email": user["email"]})
    
    return {
        "token": token,
        "user": {
            "id": user.get("user_id", request.email),
            "name": user["name"],
            "email": user["email"],
            "farm_location": user.get("farm_location"),
            "farm_size": user.get("farm_size"),
            "primary_crop": user.get("primary_crop")
        }
    }


# Sensor Endpoints
@api_router.get("/sensors/latest")
async def get_latest_sensor_data(user_id: str = Depends(get_current_user_id)):
    latest = await sensor_readings_collection.find_one(
        {"user_id": user_id},
        {"_id": 0},
        sort=[("timestamp", -1)]
    )
    
    # If no data for user, try default_user (ESP32 data)
    if not latest:
        latest = await sensor_readings_collection.find_one(
            {"user_id": "default_user"},
            {"_id": 0},
            sort=[("timestamp", -1)]
        )
    # If no data → create mock
    if not latest:
        mock_data = generate_mock_sensor_data()
        mock_data.update({
            "user_id": user_id,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        await sensor_readings_collection.insert_one(mock_data.copy())
        latest = mock_data

    # ✅ WEATHER SAFE FETCH (NON-BLOCKING STYLE)
    rain = 0
    humidity = latest.get("humidity", 50)

    try:
        if OPENWEATHER_API_KEY:
            timeout = aiohttp.ClientTimeout(total=2)  # prevent delay
            url = f"http://api.openweathermap.org/data/2.5/weather?q=Delhi&appid={OPENWEATHER_API_KEY}&units=metric"

            async with aiohttp.ClientSession(timeout=timeout) as session:
                async with session.get(url) as response:
                    if response.status == 200:
                        data = await response.json()
                        rain = data.get("rain", {}).get("1h", 0)
                        humidity = data.get("main", {}).get("humidity", humidity)
    except Exception as e:
        print("Weather error:", e)

    # ✅ ADD WEATHER DATA
    latest["rain_probability"] = rain
    latest["humidity"] = humidity

    return {
        **latest,
        "irrigation_status": "optimal" if latest.get("soil_moisture", 0) > 30 else "needs_irrigation"
    }


@api_router.get("/sensors/history")
async def get_sensor_history(user_id: str = Depends(get_current_user_id)):
    readings = await sensor_readings_collection.find(
        {"user_id": user_id},
        {"_id": 0}
    ).sort("timestamp", -1).limit(50).to_list(50)
    
    if len(readings) < 20:
        for i in range(20):
            mock_data = generate_mock_sensor_data()
            mock_data.update({
                "user_id": user_id,
                "timestamp": (datetime.now(timezone.utc) - timedelta(hours=i)).isoformat()
            })
            await sensor_readings_collection.insert_one(mock_data)
        
        readings = await sensor_readings_collection.find(
            {"user_id": user_id},
            {"_id": 0}
        ).sort("timestamp", -1).limit(50).to_list(50)
    
    return readings

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

        rain = data.get("rain", {}).get("1h", 0)
        humidity = data.get("main", {}).get("humidity", 50)

        return rain, humidity

    except Exception as e:
        print("Weather error:", e)
        return 0, 50

# Irrigation Endpoint
@api_router.get("/irrigation/predict")
async def get_irrigation_prediction(user_id: str = Depends(get_current_user_id)):
    latest = await sensor_readings_collection.find_one(
        {"user_id": user_id},
        {"_id": 0},
        sort=[("timestamp", -1)]
    )
    
    # Try default_user if no data for this user
    if not latest:
        latest = await sensor_readings_collection.find_one(
            {"user_id": "default_user"},
            {"_id": 0},
            sort=[("timestamp", -1)]
        )
    
    if not latest:
        mock_data = generate_mock_sensor_data()
        mock_data.update({"user_id": user_id, "timestamp": datetime.now(timezone.utc).isoformat()})
        await sensor_readings_collection.insert_one(mock_data)
        latest = mock_data
    
    soil_moisture = latest.get("soil_moisture", 30)
    rain_mm, humidity = await get_weather_safe()

    rain_expected = rain_mm > 0
    rain_hours = 2 if rain_expected else 0
    
    if soil_moisture > 35:
        recommendation = "No irrigation needed"
        status = "optimal"
        recommended_time = "N/A"
        water_quantity = 0
        crop_stress = "Low"
    elif soil_moisture > 28:
        if rain_expected:
            recommendation = f"Delay irrigation - rain expected in {rain_hours} hours"
            status = "monitor"
            recommended_time = f"After {rain_hours + 2} hours"
        else:
            recommendation = "Light irrigation recommended"
            status = "schedule"
            recommended_time = "In 4-6 hours"
        water_quantity = 15.0
        crop_stress = "Moderate"
    else:
        recommendation = "Immediate irrigation required"
        status = "critical"
        recommended_time = "Immediately"
        water_quantity = 25.0
        crop_stress = "High"
    
    await irrigation_logs_collection.insert_one({
        "user_id": user_id,
        "recommended_time": recommended_time,
        "water_quantity": water_quantity,
        "crop_stress_level": crop_stress,
        "rain_forecast": f"Rain in {rain_hours} hours" if rain_expected else "No rain expected",
        "recommendation": recommendation,
        "status": status,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    return {
        "decision": recommendation,
        "time": recommended_time,
        "water_quantity": water_quantity,
        "confidence": round(random.uniform(0.7, 0.95), 2),  # temp AI confidence
        "priority": status.upper(),
        "rain_probability": rain_mm * 10,  # simple %
        "explanation": {
            "factors": {
                "soil_moisture": soil_moisture,
                "rain_forecast": rain_expected,
                "humidity": humidity
            },
            "reasoning": recommendation
        }
    }


# Farm Zones
@api_router.get("/zones")
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
        # Re-query to get zones without _id field
        zones = await farm_zones_collection.find({"user_id": user_id}, {"_id": 0}).to_list(100)
    
    return zones


# Drone Monitoring
@api_router.get("/drone/latest")
async def get_latest_drone_analysis(user_id: str = Depends(get_current_user_id)):
    latest = await drone_analysis_collection.find_one(
        {"user_id": user_id},
        {"_id": 0},
        sort=[("timestamp", -1)]
    )
    
    if not latest:
        mock = {
            "user_id": user_id,
            "image_url": "https://images.unsplash.com/photo-1677126577258-1a82fdf1a976",
            "analysis_result": "Dry zones detected in sector B. Irrigation recommended for zones B and C.",
            "dry_zones": ["Zone B", "Zone C"],
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        await drone_analysis_collection.insert_one(mock.copy())
        latest = mock
    
    return latest


# Rover Monitoring
@api_router.get("/rover/latest")
async def get_latest_rover_data(user_id: str = Depends(get_current_user_id)):
    latest = await rover_data_collection.find_one(
        {"user_id": user_id},
        {"_id": 0},
        sort=[("timestamp", -1)]
    )
    
    if not latest:
        mock = {
            "user_id": user_id,
            "position": {"x": 45.2, "y": 23.8, "zone": "Zone B"},
            "soil_moisture": round(random.uniform(25, 40), 1),
            "temperature": round(random.uniform(22, 32), 1),
            "camera_feed_url": "https://images.unsplash.com/photo-1723531533870-8d88c18fe546",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        await rover_data_collection.insert_one(mock.copy())
        latest = mock
    
    return latest


# Water Analytics
@api_router.get("/analytics/water")
async def get_water_analytics(user_id: str = Depends(get_current_user_id)):
    analytics = await water_analytics_collection.find(
        {"user_id": user_id},
        {"_id": 0}
    ).sort("date", -1).limit(30).to_list(30)
    
    if not analytics:
        for i in range(30):
            mock = {
                "user_id": user_id,
                "water_used": round(random.uniform(800, 1200), 2),
                "water_saved": round(random.uniform(200, 400), 2),
                "efficiency": round(random.uniform(70, 95), 2),
                "date": (datetime.now(timezone.utc) - timedelta(days=i)).isoformat()
            }
            await water_analytics_collection.insert_one(mock)
        
        analytics = await water_analytics_collection.find(
            {"user_id": user_id},
            {"_id": 0}
        ).sort("date", -1).limit(30).to_list(30)
    
    total_saved = sum(a["water_saved"] for a in analytics)
    avg_efficiency = sum(a["efficiency"] for a in analytics) / len(analytics) if analytics else 0
    
    return {
        "water_saved_total": round(total_saved, 2),
        "efficiency_average": round(avg_efficiency, 2),
        "history": analytics
    }


# AI Chat
@api_router.post("/chat")
async def chat_with_advisor(request: dict, user_id: str = Depends(get_current_user_id)):
    message = request.get("message")
    session_id = request.get("session_id")
    
    try:
        chat = LlmChat(
            api_key=GEMINI_API_KEY,
            session_id=session_id,
            system_message="You are an expert agricultural AI advisor specializing in precision irrigation."
        ).with_model("gemini", "gemini-3-pro-preview")
        
        user_message = UserMessage(text=message)
        response_text = await chat.send_message(user_message)
        
        await chat_history_collection.insert_many([
            {
                "user_id": user_id,
                "session_id": session_id,
                "role": "user",
                "content": message,
                "timestamp": datetime.now(timezone.utc).isoformat()
            },
            {
                "user_id": user_id,
                "session_id": session_id,
                "role": "assistant",
                "content": response_text,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        ])
        
        return {
            "response": response_text,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        logging.error(f"Chat error: {e}")
        return {
            "response": "I'm experiencing technical difficulties. Please check your sensor data and weather forecasts.",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }


# Simulation
@api_router.post("/simulation")
async def run_simulation(request: dict, user_id: str = Depends(get_current_user_id)):
    delay_days = request.get("delay_days", 2)
    
    soil_moisture_drop = round(2.5 * delay_days + random.uniform(-2, 2), 1)
    crop_stress_increase = round(5 * delay_days + random.uniform(-3, 3), 1)
    
    if crop_stress_increase > 20:
        recommendation = "Critical: Crop damage likely. Irrigate immediately."
    elif crop_stress_increase > 10:
        recommendation = "Warning: Significant stress increase. Consider irrigating sooner."
    else:
        recommendation = "Acceptable: Minimal impact on crop health."
    
    return {
        "delay_days": delay_days,
        "soil_moisture_drop": soil_moisture_drop,
        "crop_stress_increase": crop_stress_increase,
        "recommendation": recommendation
    }


@api_router.get("/")
async def root():
    return {"message": "AquaSense AI API", "status": "operational"}


# app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)



logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)


# Import ML and Notification services
from ml_service import ml_model
from notification_service import get_notification_service
from websocket_server import broadcast_sensor_update, broadcast_notification

# Initialize notification service after database is loaded
notification_service = None


@app.on_event("startup")
async def startup_event_extended():
    global notification_service
    await init_db()
    notification_service = get_notification_service(db)
    logging.info("Database and services initialized")


# IoT Sensor Ingestion Endpoints
@api_router.post("/iot/sensor-data")
async def ingest_sensor_data(data: dict):
    """Ingest real-time sensor data from ESP32 devices"""
    # Use defaults if not provided
    device_id = data.get("device_id", "ESP32_DEFAULT")
    user_id = data.get("user_id", "default_user")
    
    # Get raw soil moisture value
    raw_soil = data.get("soil_moisture", data.get("soil", 0))
    
    # Convert raw ADC value (0-4095 for ESP32) to percentage (0-100%)
    # Lower ADC = More moisture, Higher ADC = Less moisture
    if raw_soil > 100:  # It's a raw ADC value
        # Invert and map: 4095 (dry) -> 0%, 0 (wet) -> 100%
        soil_moisture_percent = max(0, min(100, 100 - (raw_soil / 4095 * 100)))
    else:
        soil_moisture_percent = raw_soil  # Already in percentage
    
    sensor_doc = {
        "user_id": user_id,
        "device_id": device_id,
        "soil_moisture": round(soil_moisture_percent, 1),
        "temperature": data.get("temperature", 0),
        "humidity": data.get("humidity", 0),
        "soil_temp": data.get("soil_temp", 0),
        "water_stress_index": data.get("water_stress_index", round(random.uniform(0.1, 0.9), 2)),
        "timestamp": data.get("timestamp", datetime.now(timezone.utc).isoformat()),
        "raw_soil_value": raw_soil  # Keep raw value for reference
    }
    
    # Store in database
    await sensor_readings_collection.insert_one(sensor_doc.copy())
    
    # Check for alerts
    alerts = await notification_service.check_sensor_alerts(user_id, sensor_doc)
    
    # Broadcast to connected clients via WebSocket
    await broadcast_sensor_update(user_id, sensor_doc)
    
    # Send alerts via WebSocket
    for alert in alerts:
        await broadcast_notification(user_id, alert)
    
    return {
        "status": "success",
        "message": "Sensor data ingested",
        "alerts_generated": len(alerts)
    }


@api_router.get("/iot/devices")
async def get_user_devices(user_id: str = Depends(get_current_user_id)):
    """Get all IoT devices for a user"""
    devices = await sensor_readings_collection.distinct("device_id", {"user_id": user_id})
    
    device_list = []
    for device_id in devices:
        latest = await sensor_readings_collection.find_one(
            {"user_id": user_id, "device_id": device_id},
            {"_id": 0},
            sort=[("timestamp", -1)]
        )
        device_list.append({
            "device_id": device_id,
            "status": "active" if latest else "inactive",
            "last_reading": latest.get("timestamp") if latest else None
        })
    
    return device_list


# Advanced Analytics Endpoints
@api_router.get("/analytics/advanced")
async def get_advanced_analytics(user_id: str = Depends(get_current_user_id)):
    """Get advanced analytics including ML predictions"""
    # Get historical data
    sensor_data = await sensor_readings_collection.find(
        {"user_id": user_id},
        {"_id": 0}
    ).sort("timestamp", -1).limit(60).to_list(60)
    
    irrigation_logs = await irrigation_logs_collection.find(
        {"user_id": user_id},
        {"_id": 0}
    ).sort("timestamp", -1).limit(30).to_list(30)
    
    analytics_data = await water_analytics_collection.find(
        {"user_id": user_id},
        {"_id": 0}
    ).sort("date", -1).limit(30).to_list(30)
    
    # ML Predictions
    weather_data = {"rainfall": 50}  # Mock weather data
    yield_prediction = ml_model.predict_yield(sensor_data, irrigation_logs, weather_data)
    
    # Irrigation pattern analysis
    irrigation_analysis = ml_model.analyze_irrigation_patterns(irrigation_logs)
    
    # Water efficiency metrics
    efficiency_metrics = ml_model.calculate_water_efficiency(analytics_data)
    
    return {
        "yield_prediction": yield_prediction,
        "irrigation_analysis": irrigation_analysis,
        "efficiency_metrics": efficiency_metrics,
        "data_quality": {
            "sensor_readings": len(sensor_data),
            "irrigation_logs": len(irrigation_logs),
            "analytics_records": len(analytics_data)
        }
    }


@api_router.get("/analytics/irrigation-patterns")
async def get_irrigation_patterns(user_id: str = Depends(get_current_user_id)):
    """Get detailed irrigation pattern analysis"""
    irrigation_logs = await irrigation_logs_collection.find(
        {"user_id": user_id},
        {"_id": 0}
    ).sort("timestamp", -1).limit(60).to_list(60)
    
    # Group by date for pattern analysis
    pattern_data = []
    for log in irrigation_logs[-30:]:
        timestamp = log.get("timestamp")
        if isinstance(timestamp, str):
            date = datetime.fromisoformat(timestamp).date()
        else:
            date = timestamp.date()
        
        pattern_data.append({
            "date": str(date),
            "water_quantity": log.get("water_quantity", 0),
            "status": log.get("status", "unknown"),
            "crop_stress": log.get("crop_stress_level", "Unknown")
        })
    
    analysis = ml_model.analyze_irrigation_patterns(irrigation_logs)
    
    return {
        "pattern_data": pattern_data,
        "analysis": analysis,
        "recommendations": analysis.get("insights", [])
    }


# Notification Endpoints
@api_router.get("/notifications")
async def get_notifications(user_id: str = Depends(get_current_user_id), unread_only: bool = False):
    """Get user notifications"""
    return await notification_service.get_user_notifications(user_id, unread_only=unread_only)


@api_router.post("/notifications/mark-read")
async def mark_notifications_read(request: dict, user_id: str = Depends(get_current_user_id)):
    """Mark notifications as read"""
    notification_ids = request.get("notification_ids")
    await notification_service.mark_as_read(user_id, notification_ids)
    return {"status": "success"}


@api_router.get("/notifications/count")
async def get_unread_count(user_id: str = Depends(get_current_user_id)):
    """Get unread notification count"""
    notifications = await notification_service.get_user_notifications(user_id, unread_only=True)
    return {"unread_count": len(notifications)}

# Include router after all routes are defined


# Drone Image Processing Endpoints
from fastapi import File, UploadFile
from drone_processor import drone_processor
import base64

@api_router.post("/drone/process-frame")
async def process_drone_frame(user_id: str = Depends(get_current_user_id)):
    frame_path = "frame.jpg"
    if not os.path.exists(frame_path):
        raise HTTPException(status_code=404, detail="No frame available")
    image = Image.open(frame_path)

    # Process with model
    segmented_image, zones = drone_processor.process_image(image)

    timestamp = datetime.now(timezone.utc).isoformat().replace(':', '-')

    original_path = f"/app/backend/uploads/drone_original_{timestamp}.jpg"
    image.save(original_path)

    segmented_path = f"/app/backend/uploads/drone_segmented_{timestamp}.jpg"
    segmented_image.save(segmented_path)

    buffer = io.BytesIO()
    segmented_image.save(buffer, format="JPEG")
    segmented_base64 = base64.b64encode(buffer.getvalue()).decode()

    await drone_analysis_collection.insert_one({
        "user_id": user_id,
        "timestamp": timestamp,
        "original_image_path": original_path,
        "segmented_image_path": segmented_path,
        "zones": zones,
        "total_zones": len(zones)
    })

    return {
        "status": "success",
        "segmented_image": f"data:image/jpeg;base64,{segmented_base64}",
        "zones": zones,
        "timestamp": timestamp
    }



@api_router.post("/drone/upload-image")
async def upload_and_process_image(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id)
):
    """Upload and process a drone image manually"""
    # Read uploaded file
    contents = await file.read()
    image = Image.open(io.BytesIO(contents))
    
    # Process with model
    segmented_image, zones = drone_processor.process_image(image)
    
    # Save images
    timestamp = datetime.now(timezone.utc).isoformat().replace(':', '-')
    
    # Save original
    original_path = f"/app/backend/uploads/drone_original_uploaded_{timestamp}.jpg"
    image.save(original_path)
    
    # Save segmented
    segmented_path = f"/app/backend/uploads/drone_segmented_uploaded_{timestamp}.jpg"
    segmented_image.save(segmented_path)
    
    # Convert segmented to base64 for response
    buffer = io.BytesIO()
    segmented_image.save(buffer, format="JPEG")
    segmented_base64 = base64.b64encode(buffer.getvalue()).decode()
    
    # Store in database
    analysis_doc = {
        "user_id": user_id,
        "timestamp": timestamp,
        "original_image_path": original_path,
        "segmented_image_path": segmented_path,
        "zones": zones,
        "total_zones": len(zones),
        "source": "manual_upload"
    }
    await drone_analysis_collection.insert_one(analysis_doc)
    
    return {
        "status": "success",
        "segmented_image": f"data:image/jpeg;base64,{segmented_base64}",
        "zones": zones
    }


@api_router.get("/drone/latest-analysis")
async def get_latest_drone_analysis(user_id: str = Depends(get_current_user_id)):
    """Get latest drone zone analysis"""
    analysis = await drone_analysis_collection.find_one(
        {"user_id": user_id},
        sort=[("timestamp", -1)]
    )
    
    if not analysis:
        # Return demo data
        return {
            "zones": [
                {"id": "Zone A", "label": "High Moisture", "coverage_percent": 25.0, "color": [0, 255, 0], "needs_irrigation": False},
                {"id": "Zone B", "label": "Medium Moisture", "coverage_percent": 25.0, "color": [255, 255, 0], "needs_irrigation": False},
                {"id": "Zone C", "label": "Low Moisture", "coverage_percent": 25.0, "color": [255, 165, 0], "needs_irrigation": True},
                {"id": "Zone D", "label": "Very Low Moisture", "coverage_percent": 25.0, "color": [255, 0, 0], "needs_irrigation": True}
            ],
            "message": "Demo data - no real analysis yet"
        }
    
    analysis["_id"] = str(analysis["_id"])
    return analysis

app.include_router(api_router)