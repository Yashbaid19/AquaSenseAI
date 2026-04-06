from fastapi import APIRouter, HTTPException
from datetime import datetime, timezone
from database import users_collection
from auth import hash_password, verify_password, create_access_token
from models import SignupRequest, LoginRequest

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup")
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


@router.post("/login")
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
