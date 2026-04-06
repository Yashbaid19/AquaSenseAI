import tensorflow as tf
import numpy as np
from PIL import Image
import logging
import io

logger = logging.getLogger(__name__)

CLASS_LABELS = ["Healthy", "Mild Stress", "Severe Stress"]

HEALTH_DETAILS = {
    "Healthy": {
        "color": "emerald",
        "water_stress_range": (0.05, 0.2),
        "description": "Plant is in good condition with no visible signs of stress.",
        "action": "Continue current irrigation schedule. No immediate action needed."
    },
    "Mild Stress": {
        "color": "amber",
        "water_stress_range": (0.35, 0.6),
        "description": "Plant shows early signs of water or nutrient stress.",
        "action": "Consider increasing irrigation frequency. Monitor closely over next 24 hours."
    },
    "Severe Stress": {
        "color": "red",
        "water_stress_range": (0.7, 0.95),
        "description": "Plant is under significant stress and needs immediate attention.",
        "action": "Irrigate immediately. Check for pest/disease. Inspect soil conditions."
    }
}


class RoverCropAnalyzer:
    def __init__(self, model_path="/app/backend/models/rover_model.h5"):
        self.model = None
        try:
            self.model = tf.keras.models.load_model(model_path)
            logger.info("Rover crop health model loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load rover model: {e}")

    def analyze(self, image: Image.Image) -> dict:
        if self.model is None:
            return self._fallback_result()

        try:
            img = image.convert("RGB").resize((224, 224))
            arr = np.array(img, dtype=np.float32) / 255.0
            arr = np.expand_dims(arr, axis=0)

            preds = self.model.predict(arr, verbose=0)[0]
            class_idx = int(np.argmax(preds))
            confidence = float(preds[class_idx])
            label = CLASS_LABELS[class_idx]
            details = HEALTH_DETAILS[label]

            # Derive water stress index from class probabilities
            stress_weights = [0.1, 0.5, 0.9]
            water_stress = float(sum(p * w for p, w in zip(preds, stress_weights)))

            return {
                "health": label,
                "confidence": round(confidence, 4),
                "water_stress_index": round(water_stress, 3),
                "probabilities": {
                    "healthy": round(float(preds[0]), 4),
                    "mild_stress": round(float(preds[1]), 4),
                    "severe_stress": round(float(preds[2]), 4)
                },
                "description": details["description"],
                "action": details["action"],
                "color": details["color"],
                "model_type": "MobileNetV2 (rover_model.h5)"
            }
        except Exception as e:
            logger.error(f"Rover model inference error: {e}")
            return self._fallback_result()

    def _fallback_result(self):
        return {
            "health": "Unknown",
            "confidence": 0.0,
            "water_stress_index": 0.5,
            "probabilities": {"healthy": 0.0, "mild_stress": 0.0, "severe_stress": 0.0},
            "description": "Model not available. Unable to analyze.",
            "action": "Please check model configuration.",
            "color": "slate",
            "model_type": "Fallback"
        }


try:
    rover_analyzer = RoverCropAnalyzer()
except Exception as e:
    logger.error(f"Failed to initialize rover analyzer: {e}")
    rover_analyzer = None
