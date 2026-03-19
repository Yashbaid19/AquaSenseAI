from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'aquasense')

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# Collections
users_collection = db.users
sensor_readings_collection = db.sensor_readings
irrigation_logs_collection = db.irrigation_logs
farm_zones_collection = db.farm_zones
drone_analysis_collection = db.drone_analysis
rover_data_collection = db.rover_data
chat_history_collection = db.chat_history
water_analytics_collection = db.water_analytics


async def init_db():
    """Initialize database indexes"""
    await users_collection.create_index("email", unique=True)
    await sensor_readings_collection.create_index([("user_id", 1), ("timestamp", -1)])
    await irrigation_logs_collection.create_index([("user_id", 1), ("timestamp", -1)])
    await farm_zones_collection.create_index("user_id")
    await chat_history_collection.create_index([("user_id", 1), ("session_id", 1)])
