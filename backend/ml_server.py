"""
ML Inference Microservice
Runs on port 8002, handles all heavy ML model inference separately from the main API.

Usage:
  uvicorn ml_server:app --host 0.0.0.0 --port 8002

This separates heavy ML workloads (TensorFlow, PyTorch) from the main API server.
For local development, both servers can run on the same machine.
For production, this can be deployed as a separate container/service.
"""
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from pathlib import Path
from dotenv import load_dotenv
import io
import base64
import logging
import os

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

app = FastAPI(title="AquaSense ML Inference Service")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ml_server")

# Lazy-loaded model instances
_irrigation_predictor = None
_drone_processor = None
_rover_analyzer = None
_crop_model = None


def get_irrigation_predictor():
    global _irrigation_predictor
    if _irrigation_predictor is None:
        from ai_models import IrrigationPredictor
        _irrigation_predictor = IrrigationPredictor()
        logger.info("Irrigation model loaded")
    return _irrigation_predictor


def get_drone_processor():
    global _drone_processor
    if _drone_processor is None:
        from drone_processor import DroneImageProcessor
        _drone_processor = DroneImageProcessor()
        logger.info("Drone model loaded")
    return _drone_processor


def get_rover_analyzer():
    global _rover_analyzer
    if _rover_analyzer is None:
        from rover_processor import CropHealthAnalyzer
        model_path = str(ROOT_DIR / "models" / "rover_model.h5")
        _rover_analyzer = CropHealthAnalyzer(model_path)
        logger.info("Rover model loaded")
    return _rover_analyzer


def get_crop_model():
    global _crop_model
    if _crop_model is None:
        from krishi_service import predict_crop as _predict
        _crop_model = _predict
        logger.info("Crop model loaded")
    return _crop_model


@app.get("/health")
async def health():
    return {
        "status": "operational",
        "models": {
            "irrigation": _irrigation_predictor is not None,
            "drone": _drone_processor is not None,
            "rover": _rover_analyzer is not None,
            "crop": _crop_model is not None,
        }
    }


@app.post("/predict/irrigation")
async def predict_irrigation(data: dict):
    predictor = get_irrigation_predictor()
    return predictor.predict(
        soil_moisture=data.get("soil_moisture", 30),
        temperature=data.get("temperature", 25),
        humidity=data.get("humidity", 60),
        rain_probability=data.get("rain_probability", 0)
    )


@app.post("/predict/crop")
async def predict_crop_endpoint(data: dict):
    predict_fn = get_crop_model()
    return predict_fn(
        data.get("nitrogen", 0), data.get("potassium", 0),
        data.get("phosphorus", 0), data.get("temperature", 0),
        data.get("humidity", 0), data.get("rainfall", 0)
    )


@app.post("/analyze/drone")
async def analyze_drone(file: UploadFile = File(...)):
    processor = get_drone_processor()
    contents = await file.read()
    image = Image.open(io.BytesIO(contents))
    segmented_image, zones = processor.process_image(image)

    buffer = io.BytesIO()
    segmented_image.save(buffer, format="JPEG")
    segmented_base64 = base64.b64encode(buffer.getvalue()).decode()

    return {
        "segmented_image": f"data:image/jpeg;base64,{segmented_base64}",
        "zones": zones
    }


@app.post("/analyze/rover")
async def analyze_rover(file: UploadFile = File(...)):
    analyzer = get_rover_analyzer()
    if analyzer is None:
        raise HTTPException(status_code=500, detail="Rover model not loaded")
    contents = await file.read()
    image = Image.open(io.BytesIO(contents)).convert("RGB")
    return analyzer.analyze(image)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
