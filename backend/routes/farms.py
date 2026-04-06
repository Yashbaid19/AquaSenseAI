from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone
from database import farms_collection, sensor_readings_collection, farm_zones_collection
from auth import get_current_user_id
from models import FarmCreateRequest, FarmUpdateRequest
from bson import ObjectId

router = APIRouter(tags=["farms"])

MAX_FARMS = 5


@router.get("/farms")
async def get_user_farms(user_id: str = Depends(get_current_user_id)):
    farms = await farms_collection.find({"user_id": user_id}, {"_id": 0}).to_list(MAX_FARMS)
    if not farms:
        default_farm = {
            "farm_id": f"farm_{user_id}_default",
            "user_id": user_id,
            "name": "My Farm",
            "location": "Default Location",
            "size_acres": 10.0,
            "primary_crop": "Mixed",
            "is_default": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await farms_collection.insert_one(default_farm.copy())
        default_farm.pop("_id", None)
        farms = [default_farm]
    return farms


@router.post("/farms")
async def create_farm(req: FarmCreateRequest, user_id: str = Depends(get_current_user_id)):
    existing = await farms_collection.count_documents({"user_id": user_id})
    if existing >= MAX_FARMS:
        raise HTTPException(status_code=400, detail=f"Maximum {MAX_FARMS} farms allowed")

    farm_id = f"farm_{user_id}_{ObjectId()}"
    farm_doc = {
        "farm_id": farm_id,
        "user_id": user_id,
        "name": req.name,
        "location": req.location,
        "size_acres": req.size_acres,
        "primary_crop": req.primary_crop,
        "is_default": existing == 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await farms_collection.insert_one(farm_doc)
    farm_doc.pop("_id", None)
    return {"status": "success", "farm": farm_doc}


@router.put("/farms/{farm_id}")
async def update_farm(farm_id: str, req: FarmUpdateRequest, user_id: str = Depends(get_current_user_id)):
    farm = await farms_collection.find_one({"farm_id": farm_id, "user_id": user_id})
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")

    updates = {k: v for k, v in req.dict().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    await farms_collection.update_one({"farm_id": farm_id}, {"$set": updates})
    updated = await farms_collection.find_one({"farm_id": farm_id}, {"_id": 0})
    return {"status": "success", "farm": updated}


@router.delete("/farms/{farm_id}")
async def delete_farm(farm_id: str, user_id: str = Depends(get_current_user_id)):
    farm = await farms_collection.find_one({"farm_id": farm_id, "user_id": user_id})
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")
    if farm.get("is_default"):
        raise HTTPException(status_code=400, detail="Cannot delete default farm")

    await farms_collection.delete_one({"farm_id": farm_id})
    return {"status": "success", "message": "Farm deleted"}


@router.post("/farms/{farm_id}/set-default")
async def set_default_farm(farm_id: str, user_id: str = Depends(get_current_user_id)):
    farm = await farms_collection.find_one({"farm_id": farm_id, "user_id": user_id})
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")

    await farms_collection.update_many({"user_id": user_id}, {"$set": {"is_default": False}})
    await farms_collection.update_one({"farm_id": farm_id}, {"$set": {"is_default": True}})
    return {"status": "success", "message": f"Farm '{farm['name']}' set as default"}


@router.get("/farms/{farm_id}/summary")
async def get_farm_summary(farm_id: str, user_id: str = Depends(get_current_user_id)):
    farm = await farms_collection.find_one({"farm_id": farm_id, "user_id": user_id}, {"_id": 0})
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")

    sensor_count = await sensor_readings_collection.count_documents({"farm_id": farm_id})
    zones = await farm_zones_collection.find({"farm_id": farm_id}, {"_id": 0}).to_list(20)
    latest_sensor = await sensor_readings_collection.find_one({"farm_id": farm_id}, {"_id": 0}, sort=[("timestamp", -1)])

    return {
        "farm": farm,
        "sensor_readings_count": sensor_count,
        "zones_count": len(zones),
        "zones": zones,
        "latest_sensor": latest_sensor,
    }
