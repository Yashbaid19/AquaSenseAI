from fastapi import FastAPI, APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
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
import json
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

# WebSocket Connection Manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, list[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        self._register(websocket, user_id)

    def _register(self, websocket: WebSocket, user_id: str):
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)

    def disconnect(self, websocket: WebSocket, user_id: str):
        if user_id in self.active_connections:
            self.active_connections[user_id] = [
                ws for ws in self.active_connections[user_id] if ws != websocket
            ]
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    async def broadcast_to_user(self, user_id: str, data: dict):
        if user_id in self.active_connections:
            dead = []
            for ws in self.active_connections[user_id]:
                try:
                    await ws.send_json(data)
                except Exception:
                    dead.append(ws)
            for ws in dead:
                self.active_connections[user_id].remove(ws)

    async def broadcast_to_all(self, data: dict):
        for user_id in list(self.active_connections.keys()):
            await self.broadcast_to_user(user_id, data)

ws_manager = ConnectionManager()

GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')
OPENWEATHER_API_KEY = os.environ.get('OPENWEATHER_API_KEY')
OLLAMA_URL = os.environ.get('OLLAMA_URL', '').strip()
ROVER_FEED_URL_ENV = os.environ.get('ROVER_FEED_URL', '').strip()
DRONE_FEED_URL_ENV = os.environ.get('DRONE_FEED_URL', '').strip()


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
        "soil_temp": round(random.uniform(18, 30), 1),
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
    # Get latest from both user and default_user (ESP32), pick most recent
    user_data = await sensor_readings_collection.find_one(
        {"user_id": user_id},
        {"_id": 0},
        sort=[("timestamp", -1)]
    )
    esp32_data = await sensor_readings_collection.find_one(
        {"user_id": "default_user"},
        {"_id": 0},
        sort=[("timestamp", -1)]
    )

    # Pick whichever is more recent
    latest = None
    if user_data and esp32_data:
        user_ts = user_data.get("timestamp", "")
        esp_ts = esp32_data.get("timestamp", "")
        latest = esp32_data if esp_ts > user_ts else user_data
    elif esp32_data:
        latest = esp32_data
    elif user_data:
        latest = user_data

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

    # ADD WEATHER DATA
    latest["rain_probability"] = rain
    latest["humidity"] = humidity
    if "soil_temp" not in latest:
        latest["soil_temp"] = round(random.uniform(18, 30), 1)

    return {
        **latest,
        "irrigation_status": "optimal" if latest.get("soil_moisture", 0) > 30 else "needs_irrigation"
    }


@api_router.get("/sensors/history")
async def get_sensor_history(user_id: str = Depends(get_current_user_id)):
    # Get data from both the user and ESP32 default_user
    readings = await sensor_readings_collection.find(
        {"user_id": {"$in": [user_id, "default_user"]}},
        {"_id": 0}
    ).sort("timestamp", -1).limit(50).to_list(50)

    # Only generate mock data if absolutely no readings exist
    if len(readings) == 0:
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
    # Get latest from both user and default_user, prefer most recent
    user_data = await sensor_readings_collection.find_one(
        {"user_id": user_id},
        {"_id": 0},
        sort=[("timestamp", -1)]
    )
    esp32_data = await sensor_readings_collection.find_one(
        {"user_id": "default_user"},
        {"_id": 0},
        sort=[("timestamp", -1)]
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
        await sensor_readings_collection.insert_one(mock_data)
        latest = mock_data
    
    soil_moisture = latest.get("soil_moisture", 30)
    temperature = latest.get("temperature", 25)
    humidity = latest.get("humidity", 60)
    
    # Get weather data
    rain_mm, weather_humidity = await get_weather_safe()
    rain_probability = min(100, int(rain_mm * 10)) if rain_mm else 0
    
    # Use AI model for prediction
    from ai_models import irrigation_predictor
    decision = irrigation_predictor.predict(
        soil_moisture=soil_moisture,
        temperature=temperature, 
        humidity=humidity,
        rain_probability=rain_probability
    )
    
    # Map AI decision to our response format
    recommendation = decision.get("decision", "Monitor")
    if recommendation == "Irrigate":
        status = "schedule" if decision.get("priority") == "MEDIUM" else "critical"
        recommended_time = decision.get("time", "Soon")
    elif recommendation == "Delay":
        status = "monitor"
        recommended_time = decision.get("time", "After rain")
    else:  # Monitor
        status = "optimal"
        recommended_time = "N/A"
    
    water_quantity = decision.get("water_quantity", 0)
    
    # Determine crop stress based on soil moisture
    if soil_moisture < 25:
        crop_stress = "Critical"
    elif soil_moisture < 35:
        crop_stress = "High"  
    elif soil_moisture < 45:
        crop_stress = "Moderate"
    else:
        crop_stress = "Low"
    
    # Log the decision
    await irrigation_logs_collection.insert_one({
        "user_id": user_id,
        "recommended_time": recommended_time,
        "water_quantity": water_quantity,
        "crop_stress_level": crop_stress,
        "rain_forecast": f"{rain_probability}% chance",
        "recommendation": f"{recommendation} - {decision.get('explanation', {}).get('reasoning', '')}",
        "status": status,
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
        "status": status,
        "current_soil_moisture": soil_moisture,
        "confidence": decision.get("confidence", 85),
        "model_type": decision.get("explanation", {}).get("model_type", "AI Model")
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
    total_used = sum(a["water_used"] for a in analytics)
    avg_efficiency = sum(a["efficiency"] for a in analytics) / len(analytics) if analytics else 0
    
    # Calculate before (without AI) and after (with AI)
    before_usage = total_used + total_saved  # What would have been used
    after_usage = total_used  # Actual usage with AI
    
    # Calculate percentage saved (capped at 99%)
    if before_usage > 0:
        water_saved_percent = min(99.0, (total_saved / before_usage) * 100)
    else:
        water_saved_percent = 0.0
    
    return {
        "efficiency_score": round(avg_efficiency, 2),
        "water_saved_percent": round(water_saved_percent, 2),
        "water_saved_total": round(total_saved, 2),
        "before_usage": round(before_usage, 2),
        "after_usage": round(after_usage, 2),
        "efficiency_average": round(avg_efficiency, 2),
        "history": analytics
    }


# Camera Feed Config Endpoint
@api_router.get("/config/camera-feeds")
async def get_camera_feeds():
    """Returns configured camera feed URLs for Rover and Drone"""
    return {
        "rover_feed_url": ROVER_FEED_URL_ENV,
        "drone_feed_url": DRONE_FEED_URL_ENV,
    }


# AI Chat
@api_router.post("/chat")
async def chat_with_advisor(request: dict, user_id: str = Depends(get_current_user_id)):
    message = request.get("message")
    session_id = request.get("session_id")
    
    system_prompt = (
        "You are an expert agricultural AI advisor for AquaSense AI platform. "
        "You specialize in precision irrigation, crop health analysis, soil management, "
        "pest control, crop prediction, mandi pricing, government schemes, and farm finance. "
        "Provide clear, actionable advice to farmers. Be specific with recommendations."
    )

    try:
        # If OLLAMA_URL is configured, use Ollama for local inference
        if OLLAMA_URL:
            response_text = await _chat_ollama(message, session_id, system_prompt)
        else:
            # Use Gemini via Emergent LLM Key
            response_text = await _chat_gemini(message, session_id, system_prompt)
        
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
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "llm_mode": "ollama" if OLLAMA_URL else "gemini"
        }
    except Exception as e:
        logging.error(f"Chat error: {e}")
        return {
            "response": "I'm experiencing technical difficulties. Please check your sensor data and weather forecasts.",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "llm_mode": "error"
        }


async def _chat_gemini(message: str, session_id: str, system_prompt: str) -> str:
    """Chat using Gemini via Emergent LLM Key"""
    chat = LlmChat(
        api_key=GEMINI_API_KEY,
        session_id=session_id,
        system_message=system_prompt
    ).with_model("gemini", "gemini-3-pro-preview")
    
    user_message = UserMessage(text=message)
    return await chat.send_message(user_message)


async def _chat_ollama(message: str, session_id: str, system_prompt: str) -> str:
    """Chat using local Ollama instance"""
    # Retrieve recent chat history for context
    history = await chat_history_collection.find(
        {"session_id": session_id},
        {"_id": 0, "role": 1, "content": 1}
    ).sort("timestamp", -1).limit(10).to_list(10)
    history.reverse()

    messages = [{"role": "system", "content": system_prompt}]
    for h in history:
        messages.append({"role": h["role"], "content": h["content"]})
    messages.append({"role": "user", "content": message})

    async with aiohttp.ClientSession() as session:
        async with session.post(
            f"{OLLAMA_URL}/api/chat",
            json={"model": os.environ.get("OLLAMA_MODEL", "llama3"), "messages": messages, "stream": False},
            timeout=aiohttp.ClientTimeout(total=120)
        ) as resp:
            if resp.status != 200:
                raise Exception(f"Ollama returned status {resp.status}")
            data = await resp.json()
            return data.get("message", {}).get("content", "No response from Ollama")


@api_router.get("/chat/mode")
async def get_chat_mode():
    """Returns which LLM mode is active"""
    return {
        "mode": "ollama" if OLLAMA_URL else "gemini",
        "ollama_url": OLLAMA_URL if OLLAMA_URL else None,
        "ollama_model": os.environ.get("OLLAMA_MODEL", "llama3") if OLLAMA_URL else None,
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

# WebSocket endpoint - must be on app directly (not router) for /api/ws path
@app.websocket("/api/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await ws_manager.connect(websocket, user_id)
    # Also subscribe to default_user to get ESP32 data
    if user_id != "default_user":
        ws_manager._register(websocket, "default_user")
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_json({"type": "pong"})
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, user_id)
        if user_id != "default_user":
            ws_manager.disconnect(websocket, "default_user")

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
    
    # Broadcast to connected clients via native WebSocket
    ws_data = {
        "type": "sensor_update",
        "data": {
            "user_id": user_id,
            "device_id": device_id,
            "soil_moisture": round(soil_moisture_percent, 1),
            "temperature": data.get("temperature", 0),
            "humidity": data.get("humidity", 0),
            "soil_temp": data.get("soil_temp", 0),
            "water_stress_index": sensor_doc["water_stress_index"],
            "timestamp": sensor_doc["timestamp"],
            "rain_probability": 0
        }
    }
    await ws_manager.broadcast_to_user(user_id, ws_data)

    # Send alerts via WebSocket
    for alert in alerts:
        await ws_manager.broadcast_to_user(user_id, {"type": "alert", "data": alert})
    
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


# Schedule Endpoints
@api_router.get("/schedule")
async def get_irrigation_schedule(user_id: str = Depends(get_current_user_id)):
    """Get upcoming irrigation schedule based on recent predictions"""
    logs = await irrigation_logs_collection.find(
        {"user_id": user_id},
        {"_id": 0}
    ).sort("timestamp", -1).limit(5).to_list(5)

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


# Smart Alerts Endpoints
@api_router.get("/alerts")
async def get_smart_alerts(user_id: str = Depends(get_current_user_id)):
    """Generate smart alerts based on latest sensor data"""
    latest = await sensor_readings_collection.find_one(
        {"user_id": user_id},
        {"_id": 0},
        sort=[("timestamp", -1)]
    )
    if not latest:
        latest = await sensor_readings_collection.find_one(
            {"user_id": "default_user"},
            {"_id": 0},
            sort=[("timestamp", -1)]
        )

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


# Rover Crop Health Analysis Endpoints
from rover_processor import rover_analyzer

ROVER_FEED_URL = ROVER_FEED_URL_ENV or ""

@api_router.get("/rover/analyze-frame")
async def analyze_rover_frame(user_id: str = Depends(get_current_user_id)):
    """Fetch a frame from the rover camera and analyze crop health"""
    if rover_analyzer is None:
        raise HTTPException(status_code=500, detail="Rover model not loaded")
    if not ROVER_FEED_URL:
        raise HTTPException(status_code=400, detail="Rover camera feed URL not configured. Set ROVER_FEED_URL in backend/.env")
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(ROVER_FEED_URL, timeout=aiohttp.ClientTimeout(total=10)) as resp:
                if resp.status != 200:
                    raise HTTPException(status_code=502, detail="Failed to fetch rover frame")
                image_bytes = await resp.read()
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        result = rover_analyzer.analyze(image)
        result["source"] = "live_feed"
        result["timestamp"] = datetime.now(timezone.utc).isoformat()
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@api_router.post("/rover/analyze-upload")
async def analyze_rover_upload(file: UploadFile = File(...), user_id: str = Depends(get_current_user_id)):
    """Analyze an uploaded image for crop health"""
    if rover_analyzer is None:
        raise HTTPException(status_code=500, detail="Rover model not loaded")
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")
        result = rover_analyzer.analyze(image)
        result["source"] = "upload"
        result["filename"] = file.filename
        result["timestamp"] = datetime.now(timezone.utc).isoformat()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


# ============================================
# KrishiRakshak X - Supporting Modules
# ============================================
from krishi_service import (
    predict_crop, predict_yield, get_mandi_data, get_states,
    get_districts, get_market_trends, GOVT_SCHEMES, INSURANCE_OPTIONS
)

equipment_collection = db["equipment"]


# --- Crop Prediction ---
class CropPredictionRequest(BaseModel):
    nitrogen: float
    potassium: float
    phosphorus: float
    temperature: float
    humidity: float
    rainfall: float


@api_router.post("/crop/predict")
async def crop_prediction(req: CropPredictionRequest, user_id: str = Depends(get_current_user_id)):
    result = predict_crop(req.nitrogen, req.potassium, req.phosphorus, req.temperature, req.humidity, req.rainfall)
    return result


# --- Yield Prediction ---
class YieldPredictionRequest(BaseModel):
    crop_type: str
    area_hectares: float
    rainfall_mm: float
    avg_temp: float
    soil_quality: str


@api_router.post("/yield/predict")
async def yield_prediction(req: YieldPredictionRequest, user_id: str = Depends(get_current_user_id)):
    return predict_yield(req.crop_type, req.area_hectares, req.rainfall_mm, req.avg_temp, req.soil_quality)


# --- Mandi Pricing ---
@api_router.get("/mandi/states")
async def mandi_states():
    return get_states()


@api_router.get("/mandi/districts/{state}")
async def mandi_districts(state: str):
    return get_districts(state)


@api_router.get("/mandi/prices")
async def mandi_prices(state: str, district: str, category: str = "All"):
    return get_mandi_data(state, district, category)


# --- Market Trends ---
@api_router.get("/market/trends")
async def market_trends(crop: str, frequency: str = "daily"):
    return get_market_trends(crop, frequency)


# --- Equipment Rental ---
class EquipmentListing(BaseModel):
    name: str
    equipment_type: str
    description: str
    price_per_day: float
    state: str
    district: str
    contact: str


@api_router.post("/equipment/list")
async def list_equipment(eq: EquipmentListing, user_id: str = Depends(get_current_user_id)):
    doc = eq.dict()
    doc["user_id"] = user_id
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await equipment_collection.insert_one(doc)
    doc.pop("_id", None)
    return {"status": "success", "equipment": doc}


@api_router.get("/equipment/search")
async def search_equipment(state: str = "", district: str = "", equipment_type: str = ""):
    query = {}
    if state:
        query["state"] = state
    if district:
        query["district"] = district
    if equipment_type:
        query["equipment_type"] = equipment_type
    results = await equipment_collection.find(query, {"_id": 0}).sort("created_at", -1).limit(50).to_list(50)
    return results


# --- Financial Support ---
@api_router.get("/finance/schemes")
async def get_schemes(state: str = ""):
    central = GOVT_SCHEMES["central"]
    state_schemes = GOVT_SCHEMES["state"].get(state, [])
    return {"central": central, "state": state_schemes}


@api_router.get("/finance/insurance")
async def get_insurance():
    return INSURANCE_OPTIONS


app.include_router(api_router)