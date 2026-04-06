from fastapi import APIRouter, Depends
from database import app_settings_collection
from auth import get_current_user_id
from models import SettingsUpdateRequest
import os

router = APIRouter(tags=["config"])


@router.get("/config/camera-feeds")
async def get_camera_feeds():
    return {
        "rover_feed_url": os.environ.get('ROVER_FEED_URL', '').strip(),
        "drone_feed_url": os.environ.get('DRONE_FEED_URL', '').strip(),
    }


@router.get("/config/settings")
async def get_app_settings(user_id: str = Depends(get_current_user_id)):
    settings = await app_settings_collection.find_one({"user_id": user_id}, {"_id": 0})
    if not settings:
        settings = {
            "user_id": user_id,
            "rover_feed_url": os.environ.get('ROVER_FEED_URL', '').strip(),
            "drone_feed_url": os.environ.get('DRONE_FEED_URL', '').strip(),
            "ollama_url": os.environ.get('OLLAMA_URL', '').strip(),
            "ollama_model": os.environ.get('OLLAMA_MODEL', 'llama3'),
            "notifications": {"irrigation": True, "weather": True, "system": False},
        }
    return settings


@router.put("/config/settings")
async def update_app_settings(req: SettingsUpdateRequest, user_id: str = Depends(get_current_user_id)):
    updates = {k: v for k, v in req.dict().items() if v is not None}
    if not updates:
        return {"status": "no_change"}

    updates["user_id"] = user_id
    await app_settings_collection.update_one(
        {"user_id": user_id}, {"$set": updates}, upsert=True
    )

    # Update env vars in memory for camera feeds
    if "rover_feed_url" in updates:
        os.environ["ROVER_FEED_URL"] = updates["rover_feed_url"]
    if "drone_feed_url" in updates:
        os.environ["DRONE_FEED_URL"] = updates["drone_feed_url"]
    if "ollama_url" in updates:
        os.environ["OLLAMA_URL"] = updates["ollama_url"]
    if "ollama_model" in updates:
        os.environ["OLLAMA_MODEL"] = updates["ollama_model"]

    return {"status": "success", "updated": list(updates.keys())}
