from fastapi import FastAPI, APIRouter, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
from dotenv import load_dotenv
import os
import logging

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from database import init_db, db
from notification_service import get_notification_service
from deps import app_state

# --- App + Router ---
app = FastAPI()
api_router = APIRouter(prefix="/api")

# --- CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')


# --- WebSocket Connection Manager ---
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
            self.active_connections[user_id] = [ws for ws in self.active_connections[user_id] if ws != websocket]
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


# --- WebSocket endpoint (must be on app, not router) ---
@app.websocket("/api/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await ws_manager.connect(websocket, user_id)
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


# --- Startup ---
@app.on_event("startup")
async def startup_event():
    await init_db()
    app_state.ws_manager = ws_manager
    app_state.notification_service = get_notification_service(db)
    logging.info("Database and services initialized")


# --- Import and include all route modules ---
from routes.auth import router as auth_router
from routes.sensors import router as sensors_router
from routes.irrigation import router as irrigation_router
from routes.monitoring import router as monitoring_router
from routes.analytics import router as analytics_router
from routes.chat import router as chat_router
from routes.iot import router as iot_router
from routes.notifications import router as notifications_router
from routes.krishi import router as krishi_router
from routes.farms import router as farms_router
from routes.reports import router as reports_router
from routes.config import router as config_router

api_router.include_router(auth_router)
api_router.include_router(sensors_router)
api_router.include_router(irrigation_router)
api_router.include_router(monitoring_router)
api_router.include_router(analytics_router)
api_router.include_router(chat_router)
api_router.include_router(iot_router)
api_router.include_router(notifications_router)
api_router.include_router(krishi_router)
api_router.include_router(farms_router)
api_router.include_router(reports_router)
api_router.include_router(config_router)


@api_router.get("/")
async def root():
    return {"message": "AquaSense AI API", "status": "operational"}


# Simulation endpoint
@api_router.post("/simulation")
async def run_simulation(request: dict):
    import random
    delay_days = request.get("delay_days", 2)
    soil_moisture_drop = round(2.5 * delay_days + random.uniform(-2, 2), 1)
    crop_stress_increase = round(5 * delay_days + random.uniform(-3, 3), 1)
    if crop_stress_increase > 20:
        recommendation = "Critical: Crop damage likely. Irrigate immediately."
    elif crop_stress_increase > 10:
        recommendation = "Warning: Significant stress increase. Consider irrigating sooner."
    else:
        recommendation = "Acceptable: Minimal impact on crop health."
    return {"delay_days": delay_days, "soil_moisture_drop": soil_moisture_drop, "crop_stress_increase": crop_stress_increase, "recommendation": recommendation}


app.include_router(api_router)
