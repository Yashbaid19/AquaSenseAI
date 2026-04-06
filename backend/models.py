from pydantic import BaseModel, EmailStr
from typing import Optional


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


class CropPredictionRequest(BaseModel):
    nitrogen: float
    potassium: float
    phosphorus: float
    temperature: float
    humidity: float
    rainfall: float


class YieldPredictionRequest(BaseModel):
    crop_type: str
    area_hectares: float
    rainfall_mm: float
    avg_temp: float
    soil_quality: str


class EquipmentListing(BaseModel):
    name: str
    equipment_type: str
    description: str
    price_per_day: float
    state: str
    district: str
    contact: str


class FarmCreateRequest(BaseModel):
    name: str
    location: str
    size_acres: float
    primary_crop: str


class FarmUpdateRequest(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    size_acres: Optional[float] = None
    primary_crop: Optional[str] = None


class SettingsUpdateRequest(BaseModel):
    rover_feed_url: Optional[str] = None
    drone_feed_url: Optional[str] = None
    ollama_url: Optional[str] = None
    ollama_model: Optional[str] = None
