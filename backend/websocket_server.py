import socketio
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

# Create Socket.IO server
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins='*',
    logger=True,
    engineio_logger=False
)

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'aquasense')
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# Store active connections
active_connections = {}


@sio.event
async def connect(sid, environ):
    """Handle client connection"""
    print(f"Client connected: {sid}")
    active_connections[sid] = {
        'user_id': None,
        'connected_at': asyncio.get_event_loop().time()
    }
    await sio.emit('connection_established', {'status': 'connected'}, room=sid)


@sio.event
async def disconnect(sid):
    """Handle client disconnection"""
    print(f"Client disconnected: {sid}")
    if sid in active_connections:
        del active_connections[sid]


@sio.event
async def authenticate(sid, data):
    """Authenticate user for WebSocket connection"""
    user_id = data.get('user_id')
    if user_id and sid in active_connections:
        active_connections[sid]['user_id'] = user_id
        await sio.emit('authenticated', {'status': 'success', 'user_id': user_id}, room=sid)
        
        # Send initial sensor data
        latest_sensor = await db.sensor_readings.find_one(
            {'user_id': user_id},
            {'_id': 0},
            sort=[('timestamp', -1)]
        )
        if latest_sensor:
            await sio.emit('sensor_update', latest_sensor, room=sid)


@sio.event
async def subscribe_sensors(sid, data):
    """Subscribe to sensor updates for specific user"""
    user_id = data.get('user_id')
    if user_id:
        # Join user-specific room
        await sio.enter_room(sid, f"user_{user_id}")
        await sio.emit('subscribed', {'user_id': user_id}, room=sid)


async def broadcast_sensor_update(user_id, sensor_data):
    """Broadcast sensor update to all connected clients for a user"""
    room = f"user_{user_id}"
    await sio.emit('sensor_update', sensor_data, room=room)


async def broadcast_notification(user_id, notification):
    """Send notification to user"""
    room = f"user_{user_id}"
    await sio.emit('notification', notification, room=room)


# Create ASGI app
app = socketio.ASGIApp(sio)
