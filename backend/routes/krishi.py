from fastapi import APIRouter, Depends
from datetime import datetime, timezone
from database import equipment_collection
from auth import get_current_user_id
from models import CropPredictionRequest, YieldPredictionRequest, EquipmentListing
from krishi_service import (
    predict_crop, predict_yield, get_mandi_data, get_states,
    get_districts, get_market_trends, GOVT_SCHEMES, INSURANCE_OPTIONS
)

router = APIRouter(tags=["agriculture"])


@router.post("/crop/predict")
async def crop_prediction(req: CropPredictionRequest, user_id: str = Depends(get_current_user_id)):
    return predict_crop(req.nitrogen, req.potassium, req.phosphorus, req.temperature, req.humidity, req.rainfall)


@router.post("/yield/predict")
async def yield_prediction(req: YieldPredictionRequest, user_id: str = Depends(get_current_user_id)):
    return predict_yield(req.crop_type, req.area_hectares, req.rainfall_mm, req.avg_temp, req.soil_quality)


@router.get("/mandi/states")
async def mandi_states():
    return get_states()


@router.get("/mandi/districts/{state}")
async def mandi_districts(state: str):
    return get_districts(state)


@router.get("/mandi/prices")
async def mandi_prices(state: str, district: str, category: str = "All"):
    return get_mandi_data(state, district, category)


@router.get("/market/trends")
async def market_trends(crop: str, frequency: str = "daily"):
    return get_market_trends(crop, frequency)


@router.post("/equipment/list")
async def list_equipment(eq: EquipmentListing, user_id: str = Depends(get_current_user_id)):
    doc = eq.dict()
    doc["user_id"] = user_id
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await equipment_collection.insert_one(doc)
    doc.pop("_id", None)
    return {"status": "success", "equipment": doc}


@router.get("/equipment/search")
async def search_equipment(state: str = "", district: str = "", equipment_type: str = ""):
    query = {}
    if state:
        query["state"] = state
    if district:
        query["district"] = district
    if equipment_type:
        query["equipment_type"] = equipment_type
    return await equipment_collection.find(query, {"_id": 0}).sort("created_at", -1).limit(50).to_list(50)


@router.get("/finance/schemes")
async def get_schemes(state: str = ""):
    central = GOVT_SCHEMES["central"]
    state_schemes = GOVT_SCHEMES["state"].get(state, [])
    return {"central": central, "state": state_schemes}


@router.get("/finance/insurance")
async def get_insurance():
    return INSURANCE_OPTIONS
