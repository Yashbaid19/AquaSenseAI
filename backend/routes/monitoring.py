from fastapi import APIRouter, Depends, HTTPException, File, UploadFile
from datetime import datetime, timezone
from database import drone_analysis_collection, rover_data_collection
from auth import get_current_user_id
from PIL import Image
import io
import os
import base64
import random
import aiohttp

router = APIRouter(tags=["monitoring"])

ROVER_FEED_URL = os.environ.get('ROVER_FEED_URL', '').strip()
DRONE_FEED_URL = os.environ.get('DRONE_FEED_URL', '').strip()


# --- Drone ---
@router.get("/drone/latest")
async def get_latest_drone(user_id: str = Depends(get_current_user_id)):
    latest = await drone_analysis_collection.find_one({"user_id": user_id}, {"_id": 0}, sort=[("timestamp", -1)])
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


@router.post("/drone/process-frame")
async def process_drone_frame(user_id: str = Depends(get_current_user_id)):
    from drone_processor import drone_processor
    frame_path = "frame.jpg"
    if not os.path.exists(frame_path):
        raise HTTPException(status_code=404, detail="No frame available")
    image = Image.open(frame_path)
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
        "user_id": user_id, "timestamp": timestamp,
        "original_image_path": original_path, "segmented_image_path": segmented_path,
        "zones": zones, "total_zones": len(zones)
    })
    return {"status": "success", "segmented_image": f"data:image/jpeg;base64,{segmented_base64}", "zones": zones, "timestamp": timestamp}


@router.post("/drone/upload-image")
async def upload_and_process_image(file: UploadFile = File(...), user_id: str = Depends(get_current_user_id)):
    from drone_processor import drone_processor
    contents = await file.read()
    image = Image.open(io.BytesIO(contents))
    segmented_image, zones = drone_processor.process_image(image)

    timestamp = datetime.now(timezone.utc).isoformat().replace(':', '-')
    original_path = f"/app/backend/uploads/drone_original_uploaded_{timestamp}.jpg"
    image.save(original_path)
    segmented_path = f"/app/backend/uploads/drone_segmented_uploaded_{timestamp}.jpg"
    segmented_image.save(segmented_path)

    buffer = io.BytesIO()
    segmented_image.save(buffer, format="JPEG")
    segmented_base64 = base64.b64encode(buffer.getvalue()).decode()

    await drone_analysis_collection.insert_one({
        "user_id": user_id, "timestamp": timestamp,
        "original_image_path": original_path, "segmented_image_path": segmented_path,
        "zones": zones, "total_zones": len(zones), "source": "manual_upload"
    })
    return {"status": "success", "segmented_image": f"data:image/jpeg;base64,{segmented_base64}", "zones": zones}


@router.get("/drone/latest-analysis")
async def get_latest_drone_analysis(user_id: str = Depends(get_current_user_id)):
    analysis = await drone_analysis_collection.find_one({"user_id": user_id}, sort=[("timestamp", -1)])
    if not analysis:
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


# --- Rover ---
@router.get("/rover/latest")
async def get_latest_rover_data(user_id: str = Depends(get_current_user_id)):
    latest = await rover_data_collection.find_one({"user_id": user_id}, {"_id": 0}, sort=[("timestamp", -1)])
    if not latest:
        mock = {
            "user_id": user_id,
            "position": {"x": 45.2, "y": 23.8, "zone": "Zone B"},
            "soil_moisture": round(random.uniform(25, 40), 1),
            "temperature": round(random.uniform(22, 32), 1),
            "camera_feed_url": "",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        await rover_data_collection.insert_one(mock.copy())
        latest = mock
    return latest


@router.get("/rover/analyze-frame")
async def analyze_rover_frame(user_id: str = Depends(get_current_user_id)):
    from rover_processor import rover_analyzer
    if rover_analyzer is None:
        raise HTTPException(status_code=500, detail="Rover model not loaded")
    feed_url = ROVER_FEED_URL
    if not feed_url:
        raise HTTPException(status_code=400, detail="Rover camera feed URL not configured. Set ROVER_FEED_URL in backend/.env")
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(feed_url, timeout=aiohttp.ClientTimeout(total=10)) as resp:
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


@router.post("/rover/analyze-upload")
async def analyze_rover_upload(file: UploadFile = File(...), user_id: str = Depends(get_current_user_id)):
    from rover_processor import rover_analyzer
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
